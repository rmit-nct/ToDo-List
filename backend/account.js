const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const OTPAuth = require('otpauth');
const QRCode = require('qrcode');
const User = require('./models/User');
const Session = require('./models/Session');
const Workspace = require('./models/Workspace');
const Task = require('./models/Task');

const scrypt = promisify(crypto.scrypt);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const publicUser = user => ({ id: user.id, name: user.name, email: user.authMode === 'username' ? '' : user.email, authMode: user.authMode, username: user.username, title: user.title, twoFactorEnabled: user.twoFactorEnabled });
const passwordValid = value => typeof value === 'string' && value.length >= 12 && value.length <= 128;
const nameValid = value => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 80;
const emailValid = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' };

function encryptionKey() {
  const configured = process.env.SETTINGS_ENCRYPTION_KEY;
  if (configured) {
    if (!/^[a-f\d]{64}$/i.test(configured)) throw new Error('SETTINGS_ENCRYPTION_KEY must be 32 bytes encoded as hex');
    return Buffer.from(configured, 'hex');
  }
  if (process.env.NODE_ENV === 'production') throw new Error('SETTINGS_ENCRYPTION_KEY is required in production');
  const location = path.join(__dirname, '.settings-key');
  try { fs.writeFileSync(location, crypto.randomBytes(32), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  return fs.readFileSync(location);
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(buffer => buffer.toString('base64')).join('.');
}
function decrypt(value) {
  const [iv, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
async function passwordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}
async function checkPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 128 || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored || '')) return false;
  const [salt, expected] = stored.split(':');
  const actual = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
function totp(secret, email) {
  return new OTPAuth.TOTP({ issuer: 'NEO', label: email, algorithm: 'SHA1', digits: 6, period: 30, secret });
}
async function checkOtp(user, token) {
  if (!user.twoFactorEnabled) return true;
  if (typeof token !== 'string' || !/^\d{6}$/.test(token)) return false;
  const timestamp = Date.now();
  const delta = totp(decrypt(user.twoFactorSecret), user.email).validate({ token, window: 1, timestamp });
  if (delta === null) return false;
  const counter = Math.floor(timestamp / 30000) + delta;
  const result = await User.updateOne({ id: user.id, lastOtpCounter: { $lt: counter } }, { $set: { lastOtpCounter: counter } });
  return result.modifiedCount === 1;
}
async function issueSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  await Session.create({ tokenHash: hash(token), userId, expiresAt: new Date(Date.now() + maxAge) });
  res.cookie('neo_session', token, { ...cookieOptions, maxAge });
}
async function optionalUser(req, res, next) {
  const token = /(?:^|;\s*)neo_session=([a-f\d]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  if (token) {
    const session = await Session.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } });
    if (session) {
      req.account = await User.findOne({ id: session.userId, deleting: false }).select('+passwordHash +twoFactorSecret +pendingSecret');
      req.sessionHash = session.tokenHash;
    }
  }
  next();
}
function requireUser(req, res, next) {
  if (!req.account) return res.status(401).json({ error: 'Sign in to manage your account.' });
  next();
}
async function confirmAccount(req) {
  if (req.account.authMode === 'username') return req.body.username === req.account.username;
  return await checkPassword(req.body.password, req.account.passwordHash) && await checkOtp(req.account, req.body.code);
}
async function deleteWorkspace(workspace) {
  // Tombstone first: repeated cleanup is safe, and no new tasks may be added.
  await Workspace.updateOne({ id: workspace.id }, { $set: { deleting: true } });
  await Task.deleteMany({ workspaceId: workspace.id });
  await Workspace.deleteOne({ id: workspace.id });
}

const router = Router();
const sensitive = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many attempts. Please try again in 15 minutes.' } });

router.post('/auth/register', sensitive, async (req, res) => {
  const { name, email, password } = req.body;
  if (!nameValid(name) || !emailValid(email) || !passwordValid(password)) return res.status(400).json({ error: 'Use a name (1–80 characters), valid email, and password of 12–128 characters.' });
  try {
    const user = await User.create({ id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), passwordHash: await passwordHash(password) });
    await issueSession(res, user.id);
    res.status(201).json(publicUser(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Unable to create this account. Try signing in instead.' });
    throw error;
  }
});
router.post('/auth/login', sensitive, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const user = await User.findOne({ email, deleting: false }).select('+passwordHash +twoFactorSecret');
  if (!user || !await checkPassword(req.body.password, user.passwordHash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  if (user.twoFactorEnabled && !req.body.code) return res.status(401).json({ error: 'Enter the current code from your authenticator app.', requiresTwoFactor: true });
  if (!await checkOtp(user, req.body.code)) return res.status(401).json({ error: 'Invalid or already used authenticator code. Wait for a new code.' });
  await issueSession(res, user.id);
  res.json(publicUser(user));
});
router.post('/auth/logout', async (req, res) => {
  if (req.sessionHash) await Session.deleteOne({ tokenHash: req.sessionHash });
  res.clearCookie('neo_session', cookieOptions).json({ message: 'Signed out.' });
});
router.get('/users/me', requireUser, (req, res) => res.json(publicUser(req.account)));
router.patch('/users/me', requireUser, async (req, res) => {
  if (!nameValid(req.body.name) || typeof req.body.title !== 'string' || req.body.title.trim().length > 80) return res.status(400).json({ error: 'Enter a name and a role of up to 80 characters.' });
  const user = await User.findOneAndUpdate({ id: req.account.id }, { $set: { name: req.body.name.trim(), title: req.body.title.trim() } }, { returnDocument: 'after', runValidators: true });
  await Workspace.updateMany({ 'members.userId': user.id }, { $set: { 'members.$[member].name': user.name, 'members.$[member].title': user.title } }, { arrayFilters: [{ 'member.userId': user.id }] });
  await Task.updateMany({ 'assignee.id': user.id }, { $set: { 'assignee.name': user.name, 'assignee.initials': user.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() } });
  await Task.updateMany({ 'creator.id': user.id }, { $set: { 'creator.name': user.name } });
  res.json(publicUser(user));
});
router.patch('/users/me/password', requireUser, sensitive, async (req, res) => {
  if (!passwordValid(req.body.newPassword)) return res.status(400).json({ error: 'Use a new password of 12–128 characters.' });
  if (!await confirmAccount(req)) return res.status(403).json({ error: 'Current password or authenticator code is incorrect.' });
  await User.updateOne({ id: req.account.id }, { $set: { passwordHash: await passwordHash(req.body.newPassword) } });
  await Session.deleteMany({ userId: req.account.id });
  await issueSession(res, req.account.id);
  res.json({ message: 'Password updated. Other sessions have been signed out.' });
});
router.post('/users/me/2fa/setup', requireUser, sensitive, async (req, res) => {
  if (req.account.twoFactorEnabled) return res.status(409).json({ error: 'Two-factor authentication is already enabled.' });
  if (!await checkPassword(req.body.password, req.account.passwordHash)) return res.status(403).json({ error: 'Current password is incorrect.' });
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  await User.updateOne({ id: req.account.id }, { $set: { pendingSecret: encrypt(secret), pendingExpires: new Date(Date.now() + 10 * 60 * 1000) } });
  res.json({ secret, qrCode: await QRCode.toDataURL(totp(secret, req.account.email).toString()) });
});
router.post('/users/me/2fa/enable', requireUser, sensitive, async (req, res) => {
  const user = req.account;
  if (user.twoFactorEnabled || !user.pendingSecret || !user.pendingExpires || user.pendingExpires <= new Date()) return res.status(400).json({ error: 'Setup expired. Start again.' });
  const secret = decrypt(user.pendingSecret);
  const token = req.body.code;
  const timestamp = Date.now();
  const delta = typeof token === 'string' && /^\d{6}$/.test(token) ? totp(secret, user.email).validate({ token, window: 1, timestamp }) : null;
  if (delta === null) return res.status(400).json({ error: 'Enter a valid six-digit authenticator code.' });
  await User.updateOne({ id: user.id }, { $set: { twoFactorEnabled: true, twoFactorSecret: user.pendingSecret, pendingSecret: '', lastOtpCounter: Math.floor(timestamp / 30000) + delta }, $unset: { pendingExpires: '' } });
  await Session.deleteMany({ userId: user.id });
  await issueSession(res, user.id);
  res.json({ message: 'Two-factor authentication enabled.' });
});
router.delete('/users/me/2fa', requireUser, sensitive, async (req, res) => {
  if (!await confirmAccount(req)) return res.status(403).json({ error: 'Current password or authenticator code is incorrect.' });
  await User.updateOne({ id: req.account.id }, { $set: { twoFactorEnabled: false, twoFactorSecret: '', pendingSecret: '', lastOtpCounter: -1 } });
  await Session.deleteMany({ userId: req.account.id });
  await issueSession(res, req.account.id);
  res.json({ message: 'Two-factor authentication disabled.' });
});
router.get('/users/me/tasks', requireUser, async (req, res) => {
  const status = req.query.status;
  if (status !== undefined && !['todo', 'in-progress', 'done'].includes(status)) return res.status(400).json({ error: 'Invalid task status.' });
  const workspaces = await Workspace.find({ 'members.userId': req.account.id, deleting: { $ne: true } }).select('id');
  const query = { workspaceId: { $in: workspaces.map(workspace => workspace.id) }, $or: [{ assignedMemberId: req.account.id }, { 'assignee.id': req.account.id }] };
  if (status) query.status = status;
  res.json(await Task.find(query).sort({ dueDate: 1, createdAt: -1 }));
});
router.get('/users/me/workspaces', requireUser, async (req, res) => {
  res.json(await Workspace.find({ 'members.userId': req.account.id, deleting: { $ne: true } }));
});
router.get('/workspaces/:workspaceId/members', requireUser, async (req, res) => {
  const workspace = await Workspace.findOne({ id: req.params.workspaceId, deleting: { $ne: true }, 'members.userId': req.account.id });
  if (!workspace) return res.status(403).json({ error: 'Join this workspace to view its members.' });
  res.json(workspace.members);
});
router.delete('/workspaces/:workspaceId', requireUser, sensitive, async (req, res) => {
  const workspace = await Workspace.findOne({ id: req.params.workspaceId, ownerId: req.account.id });
  if (!workspace) return res.status(403).json({ error: 'Only the workspace owner can delete it.' });
  if (req.body.confirmation !== workspace.name || !await confirmAccount(req)) return res.status(400).json({ error: 'Check the workspace name, password, and authenticator code.' });
  await deleteWorkspace(workspace);
  res.json({ message: 'Workspace and its tasks deleted.' });
});
router.post('/workspaces/:workspaceId/leave', requireUser, async (req, res) => {
  const workspace = await Workspace.findOne({ id: req.params.workspaceId, 'members.userId': req.account.id, deleting: { $ne: true } });
  if (!workspace) return res.status(404).json({ error: 'Workspace membership not found.' });
  if (workspace.ownerId === req.account.id) return res.status(403).json({ error: 'Owners must delete their workspace instead of leaving it.' });
  await Workspace.updateOne({ id: workspace.id }, { $pull: { members: { userId: req.account.id } } });
  await Task.updateMany({ workspaceId: workspace.id, $or: [{ assignedMemberId: req.account.id }, { 'assignee.id': req.account.id }] }, { $set: { assignedMemberId: '' }, $unset: { assignee: '' } });
  res.json({ message: 'You have left the workspace.' });
});
router.delete('/users/me', requireUser, sensitive, async (req, res) => {
  if (req.body.confirmation !== 'DELETE' || !await confirmAccount(req)) return res.status(400).json({ error: 'Type DELETE and confirm your password and authenticator code.' });
  const id = req.account.id;
  // Owned workspaces are removed first. Cleanup can be retried if a database call fails.
  for (const workspace of await Workspace.find({ ownerId: id })) await deleteWorkspace(workspace);
  await Workspace.updateMany({ 'members.userId': id }, { $pull: { members: { userId: id } } });
  await Task.updateMany({ $or: [{ assignedMemberId: id }, { 'assignee.id': id }] }, { $set: { assignedMemberId: '' }, $unset: { assignee: '' } });
  await Task.updateMany({ 'creator.id': id }, { $set: { creator: { id: 'deleted-user', name: 'Deleted member', initials: '?', color: '#68778e' } } });
  await Session.deleteMany({ userId: id });
  if (req.account.authMode === 'username') {
    const connection = require('./runtime-mongoose').scope.getStore();
    // Remove the username credential too, so deleted profiles cannot sign in again.
    // The archived workspace records stay intact; restoration markers prevent resurrection.
    if (connection) await connection.db.collection('users').deleteOne({ id, authMode: 'username' });
  }
  await User.deleteOne({ id });
  res.clearCookie('neo_session', cookieOptions).json({ message: 'Account deleted.' });
});

module.exports = { issueSession, router, optionalUser, requireUser, passwordHash, publicUser, encryptionKey };
