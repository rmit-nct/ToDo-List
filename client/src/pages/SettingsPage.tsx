import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Check, Copy, LogOut, Monitor, Moon, ShieldCheck, Sun, X } from 'lucide-react'
import { apiRequest } from '../api'
import { useTheme } from '../themeContext'
import type { Account } from './AccountPage'
import './SettingsPage.css'

type Member = { id: string; userId: string; name: string; email: string; role: 'owner' | 'member'; title: string }
type Workspace = { id: string; name: string; ownerId: string; inviteCode?: string; members: Member[] }
type Action = 'password' | 'setup' | 'disable' | 'workspace' | 'account' | 'leave'
const initials = (name: string) => name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()

export function SettingsPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, preference, setPreference, storageError } = useTheme()
  const [account, setAccount] = useState<Account | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const [copied, setCopied] = useState(false)
  const [action, setAction] = useState<Action | null>(null)
  const owner = !!account && workspace?.ownerId === account.id

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(''); setCopied(false); setAccount(null); setWorkspace(null)
    Promise.all([
      apiRequest<Account>('/users/me', { signal: controller.signal }),
      apiRequest<Workspace>(`/workspaces/${workspaceId}`, { signal: controller.signal }),
    ]).then(([user, team]) => {
      if (controller.signal.aborted) return
      setAccount(user); setWorkspace(team); setName(user.name); setTitle(user.title); setWorkspaceName(team.name)
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [workspaceId, retry])

  useEffect(() => {
    if (!loading && account && location.hash === '#profile') {
      document.getElementById('profile-heading')?.focus()
      document.getElementById('profile')?.scrollIntoView({ block: 'start' })
    }
  }, [loading, account, location.hash])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy('profile'); setError(''); setMessage('')
    try {
      const user = await apiRequest<Account>('/users/me', { method: 'PATCH', body: JSON.stringify({ name: name.trim(), title: title.trim() }) })
      setAccount(user); setName(user.name); setTitle(user.title)
      setWorkspace(current => current && ({ ...current, members: current.members.map(member => member.userId === user.id ? { ...member, name: user.name, title: user.title } : member) }))
      const identity = { ...user, workspaceId }
      try { localStorage.setItem(`memberIdentity:${workspaceId}`, JSON.stringify(identity)) } catch { /* Server remains authoritative. */ }
      window.dispatchEvent(new CustomEvent('member-updated', { detail: identity }))
      setMessage('Profile saved.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save profile.') }
    finally { setBusy('') }
  }
  async function saveWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy('workspace'); setError(''); setMessage('')
    try {
      const team = await apiRequest<Workspace>(`/workspaces/${workspaceId}`, { method: 'PATCH', body: JSON.stringify({ name: workspaceName.trim() }) })
      setWorkspace(team); setWorkspaceName(team.name)
      window.dispatchEvent(new CustomEvent('workspace-updated', { detail: team }))
      setMessage('Workspace saved.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save workspace.') }
    finally { setBusy('') }
  }
  async function copyInvite() {
    setError('')
    try { await navigator.clipboard.writeText(workspace?.inviteCode || `${window.location.origin}/workspace/${workspaceId}`); setCopied(true) }
    catch { setError('Clipboard access is unavailable. Select and copy the invite below.') }
  }
  const joined = workspace?.members.some(member => member.userId === account?.id)

  return <div className="page settings-page">
    <header className="settings-page-heading"><div><h1>Settings</h1><p>Manage your profile and workspace preferences.</p></div><Link to="/account" className="secondary">Your workspaces</Link></header>
    <div className="settings-feedback" aria-live="polite">{message && <p className="settings-success"><Check size={16} />{message}</p>}{error && <p className="settings-error" role="alert">{error}</p>}</div>
    {loading ? <div className="settings-panel" role="status">Loading settings…</div> : !account || !workspace ? <div className="settings-panel"><h2>Sign in to manage your settings</h2><p>Your account keeps your profile, password, and workspace permissions together.</p><Link className="primary" to={`/account?returnTo=${encodeURIComponent(`/workspace/${workspaceId}`)}`}>Sign in / create account</Link><button className="secondary" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : <>
      <section id="profile" aria-labelledby="profile-heading"><h2 className="settings-eyebrow" id="profile-heading" tabIndex={-1}>Profile</h2><div className="settings-panel"><div className="settings-profile-summary"><span className="settings-avatar">{initials(account.name)}</span><div><strong>{account.name}</strong><span>{account.email}</span></div></div><form onSubmit={saveProfile}><div className="settings-field-grid"><label className="settings-field">Display name<input required maxLength={80} value={name} onChange={event => setName(event.target.value)} autoComplete="name" /></label><label className="settings-field">Role<input maxLength={80} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Frontend Developer" /></label></div><div className="settings-save-row"><button className="primary" disabled={!!busy}>{busy === 'profile' ? 'Saving…' : 'Save Profile'}</button></div></form></div></section>
      <section aria-labelledby="workspace-heading"><h2 className="settings-eyebrow" id="workspace-heading">Workspace</h2><div className="settings-panel settings-workspace-panel"><form onSubmit={saveWorkspace}><label className="settings-field">Workspace name<input required maxLength={80} disabled={!owner} value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} /></label>{!owner && <p className="settings-note">{workspace.ownerId ? 'Only the owner can change workspace details.' : 'This older workspace has no verified owner. Create a signed-in workspace to use owner controls.'}</p>}{joined && <><span className="settings-field-label">{workspace.inviteCode ? 'Invite code' : 'Invite link'}</span><div className="settings-invite"><code>{workspace.inviteCode || `${window.location.origin}/workspace/${workspace.id}`}</code><button type="button" onClick={copyInvite}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy'}</button></div></>}<div className="settings-save-row"><button className="primary" disabled={!owner || !!busy}>{busy === 'workspace' ? 'Saving…' : 'Save Workspace'}</button></div></form><div className="settings-members"><h3>Members ({workspace.members.length})</h3>{workspace.members.map(member => <div className="settings-member" key={member.id}><span className="settings-avatar small">{initials(member.name)}</span><div><strong>{member.name}{member.userId === account.id ? ' (you)' : ''}</strong><small>{member.title || member.email}</small></div><span className={`settings-role ${member.role}`}>{member.userId === workspace.ownerId ? 'Owner' : 'Member'}</span></div>)}{!joined && <Link to={`/workspace/${workspace.id}`}>Join this workspace to access member settings.</Link>}</div></div></section>
      <section aria-labelledby="security-heading"><h2 className="settings-eyebrow" id="security-heading">Security</h2><div className="settings-panel settings-rows"><div className="settings-row"><div><strong>Change Password</strong><p>Update your account password</p></div><button className="secondary" onClick={() => setAction('password')}>Change</button></div><div className="settings-row"><div><strong>Two-Factor Authentication {account.twoFactorEnabled && <span className="settings-enabled"><ShieldCheck size={13} />Enabled</span>}</strong><p>Add an extra layer of security with an authenticator app</p></div><button className="secondary" onClick={() => setAction(account.twoFactorEnabled ? 'disable' : 'setup')}>{account.twoFactorEnabled ? 'Disable' : 'Enable'}</button></div></div></section>
    </>}
    <section aria-labelledby="appearance-heading"><h2 className="settings-eyebrow" id="appearance-heading">Appearance</h2><div className="settings-panel settings-row"><div><strong>Color theme</strong><p>Saved on this device · currently {dark ? 'dark' : 'light'}</p></div><fieldset className="settings-theme"><legend className="sr-only">Color theme</legend>{([{ value: 'light', label: 'Light', Icon: Sun }, { value: 'dark', label: 'Dark', Icon: Moon }, { value: 'system', label: 'System', Icon: Monitor }] as const).map(({ value, label, Icon }) => <label key={value} className={preference === value ? 'selected' : ''}><input type="radio" name="theme" checked={preference === value} onChange={() => setPreference(value)} /><Icon size={15} />{label}</label>)}</fieldset></div>{storageError && <p className="settings-error" role="alert">{storageError}</p>}</section>
    {account && workspace && <section aria-labelledby="danger-heading"><h2 className="settings-eyebrow danger-heading" id="danger-heading">Danger zone</h2><div className="settings-panel settings-rows settings-danger">{owner ? <div className="settings-row"><div><strong>Delete Workspace</strong><p>Permanently delete this workspace and all its tasks</p></div><button className="settings-danger-button" onClick={() => setAction('workspace')}>Delete Workspace</button></div> : joined ? <div className="settings-row"><div><strong>Leave Workspace</strong><p>Remove your membership and unassign your tasks</p></div><button className="settings-danger-button" onClick={() => setAction('leave')}>Leave Workspace</button></div> : null}<div className="settings-row"><div><strong>Delete Account</strong><p>Delete your account and every workspace you own</p></div><button className="settings-danger-button" onClick={() => setAction('account')}>Delete Account</button></div></div></section>}
    {account && <button className="settings-signout" onClick={async () => { try { await apiRequest('/auth/logout', { method: 'POST', body: '{}' }); navigate('/account') } catch { setError('Could not sign out. Try again.') } }}><LogOut size={16} />Sign out</button>}
    {action && account && workspace && <SettingsDialog action={action} account={account} workspace={workspace} onClose={() => setAction(null)} onSuccess={text => { setAction(null); setMessage(text); setRetry(value => value + 1) }} />}
  </div>
}

function SettingsDialog({ action, account, workspace, onClose, onSuccess }: { action: Action; account: Account; workspace: Workspace; onClose: () => void; onSuccess: (text: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [setup, setSetup] = useState<{ secret: string; qrCode: string } | null>(null)
  const destructive = ['workspace', 'account', 'leave'].includes(action)
  const titles = { password: 'Change password', setup: 'Enable two-factor authentication', disable: 'Disable two-factor authentication', workspace: 'Delete workspace', account: 'Delete account', leave: 'Leave workspace' }
  useEffect(() => { dialog.current?.showModal() }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    if (action === 'password' && data.newPassword !== data.confirmPassword) { setError('The new passwords do not match.'); return }
    setBusy(true); setError('')
    try {
      if (action === 'setup' && !setup) {
        setSetup(await apiRequest('/users/me/2fa/setup', { method: 'POST', body: JSON.stringify(data) }))
        form.reset()
        return
      }
      const paths = { password: '/users/me/password', setup: '/users/me/2fa/enable', disable: '/users/me/2fa', workspace: `/workspaces/${workspace.id}`, account: '/users/me', leave: `/workspaces/${workspace.id}/leave` }
      const result = await apiRequest<{ message: string }>(paths[action], { method: action === 'password' ? 'PATCH' : ['setup', 'leave'].includes(action) ? 'POST' : 'DELETE', body: JSON.stringify(data) })
      if (destructive) {
        try { localStorage.removeItem(`memberIdentity:${workspace.id}`) } catch { /* Continue to account page. */ }
        navigate('/account')
      } else onSuccess(result.message)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The action failed. Please try again.') }
    finally { setBusy(false) }
  }
  return <dialog className="settings-dialog" aria-labelledby="settings-dialog-title" ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else onClose() }}><div className="settings-dialog-heading"><h2 id="settings-dialog-title">{titles[action]}</h2><button aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20} /></button></div><form onSubmit={submit}>
    {action === 'workspace' && <><p>This permanently deletes <strong>{workspace.name}</strong>, its memberships, and all tasks. This cannot be undone.</p><label className="settings-field">Type the workspace name to confirm<input required name="confirmation" autoComplete="off" /></label></>}
    {action === 'account' && <><p>This permanently deletes your account and all workspaces you own. Tasks in other teams remain, with your assignments removed and creator name anonymized. This cannot be undone.</p><label className="settings-field">Type DELETE to confirm<input required name="confirmation" autoComplete="off" /></label></>}
    {action === 'leave' ? <p>You will leave <strong>{workspace.name}</strong>. Your tasks will become unassigned. You can rejoin with an invite.</p> : <>
      {!setup && <label className="settings-field">Current password<input required type="password" name="password" autoComplete="current-password" maxLength={128} /></label>}
      {action === 'password' && <><label className="settings-field">New password<input required type="password" name="newPassword" minLength={12} maxLength={128} autoComplete="new-password" /></label><label className="settings-field">Confirm new password<input required type="password" name="confirmPassword" minLength={12} maxLength={128} autoComplete="new-password" /></label><p className="settings-note">At least 12 characters. Other sessions will be signed out.</p></>}
      {setup && <div className="settings-2fa"><p>Scan this QR code with your authenticator app, or enter the setup key manually. Keep a secure backup of the key; recovery codes are not available.</p><img src={setup.qrCode} alt="Authenticator setup QR code" width={180} height={180} /><code>{setup.secret}</code></div>}
      {(setup || account.twoFactorEnabled) && <label className="settings-field">Authenticator code<input required name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" /><small>Use a fresh six-digit code. Codes can only be used once.</small></label>}
    </>}
    {error && <p className="settings-error" role="alert">{error}</p>}<div className="settings-dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancel</button><button className={destructive ? 'settings-danger-button' : 'primary'} disabled={busy}>{busy ? 'Working…' : action === 'setup' ? setup ? 'Verify & enable' : 'Continue setup' : titles[action]}</button></div>
  </form></dialog>
}
