import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Moon, Sun } from 'lucide-react'
import { apiRequest } from '../api'
import { BrandLogo } from '../components/BrandLogo'
import CreateWorkspaceForm from '../components/CreateWorkspaceForm'
import { useTheme } from '../themeContext'
import type { Account } from './AccountPage'
import './SettingsPage.css'

type Workspace = { id: string; name: string; members: { id: string; name: string }[] }
export function UsernamePage() {
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [invite, setInvite] = useState('')
  async function load() {
    const user = await apiRequest<Account>('/users/me')
    const list = await apiRequest<Workspace[]>('/users/me/workspaces')
    setAccount(user); setWorkspaces(list)
  }
  useEffect(() => { load().catch(() => {}).finally(() => setLoading(false)) }, [])
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const csrfResponse = await fetch('/api/username/csrf')
      const { csrfToken } = await csrfResponse.json()
      if (!csrfResponse.ok || !csrfToken) throw new Error('Unable to start sign-in. Please try again.')
      const response = await fetch('/api/username/callback/credentials', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrfToken, username: username.trim().toLowerCase(), json: 'true', callbackUrl: `${window.location.origin}/account` }),
      })
      const result = await response.json()
      if (!response.ok || !result.url || new URL(result.url, window.location.origin).searchParams.has('error')) throw new Error('Unable to sign in. Check your username or try again shortly.')
      await apiRequest('/username-session', { method: 'POST', body: '{}' })
      await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in.') }
    finally { setBusy(false) }
  }
  function open(workspace: Workspace) {
    const member = workspace.members.find(item => item.id === account?.id)
    if (member) localStorage.setItem(`memberIdentity:${workspace.id}`, JSON.stringify(member))
    navigate(`/workspace/${workspace.id}/app/today`)
  }
  async function join(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const workspace = await apiRequest<{ id: string }>(`/invites/${encodeURIComponent(invite.trim())}`)
      const member = await apiRequest(`/workspaces/${workspace.id}/members`, { method: 'POST', body: JSON.stringify({ name: account?.name, email: account?.email }) })
      localStorage.setItem(`memberIdentity:${workspace.id}`, JSON.stringify(member))
      navigate(`/workspace/${workspace.id}/app/today`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to join.') }
    finally { setBusy(false) }
  }
  return <main className="account-page">
    <header className="account-header"><Link to="/" aria-label="NEO home"><BrandLogo /></Link><button className="secondary" onClick={toggleTheme}>{dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? 'Light' : 'Dark'}</button></header>
    <div className="account-content">
      {loading ? <p role="status">Loading your workspace…</p> : account ? <>
        <div className="account-title"><div><p className="settings-eyebrow">YOUR WORKSPACES</p><h1>Welcome, {account.name}.</h1><p>Select a workspace to continue.</p></div><button className="secondary" disabled={busy} onClick={async () => { setBusy(true); try { await apiRequest('/auth/logout', { method: 'POST', body: '{}' }); setAccount(null); setWorkspaces([]) } catch { setError('Could not sign out. Try again.') } finally { setBusy(false) } }}>Sign out</button></div>
        {workspaces.length > 0 ? <section className="account-workspaces" aria-label="Your workspaces">{workspaces.map(workspace => <button key={workspace.id} onClick={() => open(workspace)}><span className="workspace-dot">{workspace.name[0]}</span><strong>{workspace.name}</strong><ArrowRight size={18} /></button>)}</section> : <p className="settings-note">No workspaces yet. Create one or join your team below.</p>}
        <div className="account-grid"><section className="settings-panel"><h2>Create a workspace</h2><CreateWorkspaceForm /></section><section className="settings-panel"><h2>Join your team</h2><form onSubmit={join}><label className="settings-field">Invite code<input required value={invite} onChange={event => setInvite(event.target.value)} /></label><button className="primary" disabled={busy}>Join workspace</button></form></section></div>
      </> : <section className="settings-panel account-form"><p className="settings-eyebrow">YOUR TEAM. ONE BOARD.</p><h1>Welcome back</h1><p>Enter your username, then choose your workspace.</p><form onSubmit={submit}><label className="settings-field">Username<input name="username" value={username} onChange={event => setUsername(event.target.value)} required minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]*" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus /></label><button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Continue'}</button></form><p className="settings-note">Use your earlier username to find your workspaces.</p><Link to="/account/email">Use an email account</Link></section>}
      {error && <p className="settings-error" role="alert">{error}</p>}
    </div>
  </main>
}
