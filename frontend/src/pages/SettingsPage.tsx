import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, Monitor, Moon, ShieldCheck, Sun, UserRound, Users } from 'lucide-react'
import { API_BASE_URL } from '../api'
import { useTheme, type ThemePreference } from '../themeContext'
import type { TeamMember } from '../types'
import './SettingsPage.css'

const modes = [
  { value: 'light', label: 'Light', description: 'A fresh, bright workspace', Icon: Sun },
  { value: 'dark', label: 'Dark', description: 'A softer view after hours', Icon: Moon },
  { value: 'system', label: 'System', description: 'Follow your device', Icon: Monitor },
] as const

export function SettingsPage() {
  const { workspaceId } = useParams()
  const { preference, setPreference, storageError } = useTheme()
  const [member, setMember] = useState<TeamMember | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setMember(null)
    setError('')
    setMessage('')
    async function load() {
      try {
        const identity = JSON.parse(localStorage.getItem(`memberIdentity:${workspaceId}`) || 'null')
        if (!identity?.id) throw new Error('Join this workspace to edit your profile.')
        const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load your profile. Please try again.')
        const data = await response.json() as { members: TeamMember[] }
        const current = data.members.find((item) => item.id === identity.id)
        if (!current) throw new Error('Your membership could not be found. Please rejoin this workspace.')
        setMember(current)
        setName(current.name)
        setEmail(current.email || '')
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load your profile.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [workspaceId, retry])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!member || saving) return
    setError('')
    setMessage('')
    if (!name.trim()) { setError('Please enter your name.'); return }
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/members/${member.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save your profile.')
      setMember(result)
      setName(result.name)
      setEmail(result.email || '')
      const identity = { ...result, workspaceId }
      let stored = true
      try { localStorage.setItem(`memberIdentity:${workspaceId}`, JSON.stringify(identity)) } catch { stored = false }
      window.dispatchEvent(new CustomEvent('member-updated', { detail: identity }))
      setMessage(stored ? 'Profile saved for this workspace.' : 'Profile saved. Browser storage is unavailable; your sidebar may reset after refresh.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save your profile. Please try again.')
    } finally { setSaving(false) }
  }

  function chooseTheme(value: ThemePreference) { setPreference(value) }

  return <div className="page settings-page">
    <header className="page-heading"><div><p>MAKE IT YOURS</p><h1>Settings</h1><span>Your profile, your workspace, your way.</span></div></header>
    <section className="settings-card" aria-labelledby="appearance-title">
      <div className="settings-section-heading"><span className="settings-icon"><Sun size={21} /></span><div><h2 id="appearance-title">Appearance</h2><p>Choose how NEO looks on this device.</p></div><span className="settings-badge">Auto-saved</span></div>
      <fieldset className="theme-options"><legend className="sr-only">Color theme</legend>{modes.map(({ value, label, description, Icon }) =>
        <label className={`theme-option ${preference === value ? 'selected' : ''}`} key={value}>
          <input type="radio" name="theme" value={value} checked={preference === value} onChange={() => chooseTheme(value)} />
          <span className={`theme-preview preview-${value}`} aria-hidden="true"><span className="preview-sidebar" /><span className="preview-content"><i /><i /><i /></span></span>
          <span className="theme-option-label"><Icon size={18} />{label}</span><small>{description}</small>
        </label>)}</fieldset>
      <p className="settings-hint">Applies across NEO and stays with you when you return.</p>
      {storageError && <p role="alert" className="form-error">{storageError}</p>}
    </section>
    <section className="settings-card" aria-labelledby="profile-title">
      <div className="settings-section-heading"><span className="settings-icon"><UserRound size={21} /></span><div><h2 id="profile-title">Profile</h2><p>How your teammates see you in this workspace.</p></div></div>
      {loading ? <p role="status">Loading your profile…</p> : <form onSubmit={saveProfile}>
        {member && <><div className="settings-fields"><label>Full name<input required maxLength={80} autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setMessage('') }} /></label><label>Email address <small>(optional)</small><input type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setMessage('') }} /></label></div><div className="settings-form-footer"><p className="settings-hint">Changes apply to your current workspace.</p><button className="primary" disabled={saving || (name === member.name && email === (member.email || ''))}>{saving ? 'Saving…' : 'Save profile'}</button></div></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!member && <button type="button" className="secondary" onClick={() => setRetry((value) => value + 1)}>Retry profile</button>}
        <p className="settings-success" role="status">{message}</p>
      </form>}
    </section>
    <section className="settings-card settings-workspace" aria-labelledby="workspace-title"><div className="settings-section-heading"><span className="settings-icon"><Users size={21} /></span><div><h2 id="workspace-title">Workspace & members</h2><p>Manage workspace details, view your team, and copy an invite link.</p></div></div><Link className="secondary" to={`/workspace/${workspaceId}/app/workspace`}>Manage workspace <ArrowUpRight size={17} /></Link></section>
    <section className="settings-card settings-security" aria-labelledby="security-title"><div className="settings-section-heading"><span className="settings-icon"><ShieldCheck size={21} /></span><div><h2 id="security-title">Security & account</h2><p>This version uses workspace links to join. Password changes, two-factor authentication, and account or workspace deletion are not available yet.</p></div></div></section>
  </div>
}
