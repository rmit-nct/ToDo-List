const mongoose = require('../runtime-mongoose');

const schema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, default: '', maxlength: 80 },
  passwordHash: { type: String, required: true, select: false },
  twoFactorSecret: { type: String, default: '', select: false },
  pendingSecret: { type: String, default: '', select: false },
  pendingExpires: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  lastOtpCounter: { type: Number, default: -1 },
  deleting: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('User', schema);
