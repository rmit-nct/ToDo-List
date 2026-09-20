import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  CircleX,
} from 'lucide-react'

import JoinWorkspaceForm from '../components/JoinWorkspaceForm'
import CreateWorkspaceForm from '../components/CreateWorkspaceForm'
import { ApiError, apiRequest } from '../api'
import type { Account } from '../auth'

import './LandingPage.css'
import { LandingPromo } from '../components/LandingPromo'

function LandingPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()

  const [hasJoined, setHasJoined] = useState(false)
  const [workspaceExists, setWorkspaceExists] =
    useState<boolean | null>(null)

  const [account, setAccount] = useState<Account | null>(null)
  const [requiresAccount, setRequiresAccount] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setWorkspaceExists(null); setHasJoined(false); setLoadError('')
    if (!workspaceId) return
    Promise.all([
      apiRequest<{ ownerId?: string; currentMemberId?: string; members: { id: string }[] }>(`/workspaces/${encodeURIComponent(workspaceId)}`, { signal: controller.signal }),
      apiRequest<Account>('/users/me', { signal: controller.signal }).catch(reason => {
        if (reason instanceof ApiError && reason.status === 401) return null
        throw reason
      }),
    ]).then(([workspace, user]) => {
      if (controller.signal.aborted) return
      setAccount(user); setRequiresAccount(!!workspace.ownerId)
      let joined = !!workspace.members.find(member => member.id === workspace.currentMemberId)
      if (!workspace.ownerId) {
        try { const saved = JSON.parse(localStorage.getItem(`memberIdentity:${workspaceId}`) || 'null'); joined = workspace.members.some(member => member.id === saved?.id) } catch { /* No local membership. */ }
      }
      setHasJoined(joined); setWorkspaceExists(true)
    }).catch(reason => {
      if (controller.signal.aborted) return
      if (reason instanceof ApiError && reason.status === 404) setWorkspaceExists(false)
      else setLoadError('Unable to load this invitation. Check your connection and try again.')
    })
    return () => controller.abort()
  }, [workspaceId, retry])

  return (
    <main className="landing-page">
      <LandingPromo />

      <section className="landing-entry">
        <div className="landing-entry-card">
          {workspaceId ? (
            loadError ? <div role="alert"><p>{loadError}</p><button className="workspace-enter-button" onClick={() => { setLoadError(''); setRetry(value => value + 1) }}>Retry invitation</button></div> : workspaceExists === null ? (
              <LoadingSkeleton variant="account" label="Loading workspace" />
            ) : workspaceExists === false ? (
              <div className="workspace-joined">
                <div className="workspace-joined-icon workspace-error-icon">
                  <CircleX />
                </div>

                <h2>Workspace Not Found!</h2>

                <p>
                  This workspace does not exist or may have been removed.
                </p>

                <button
                  className="workspace-enter-button"
                  type="button"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </button>
              </div>
            ) : hasJoined ? (
              <div className="workspace-joined">
                <div className="workspace-joined-icon">
                  <Check />
                </div>

                <h2>You're in!</h2>

                <p>
                  You have joined this workspace successfully.
                </p>

                <button
                  className="workspace-enter-button"
                  type="button"
                  onClick={() => {
                    navigate(
                      `/workspace/${workspaceId}/app/home`
                    )
                  }}
                >
                  Enter Workspace
                </button>
              </div>
            ) : (
              <>
                <div className="landing-entry-heading">
                  <h2>Join Workspace</h2>

                  <p>
                    {requiresAccount && !account ? 'Sign in to join your team and keep your work saved.' : account ? 'Join this workspace with your account.' : 'Enter your details to join this workspace.'}
                  </p>
                </div>

                {requiresAccount && !account ? <p className="settings-entry-link"><Link to={`/account?returnTo=${encodeURIComponent(`/workspace/${workspaceId}`)}`}>Sign in to join workspace</Link></p> : <JoinWorkspaceForm
                  account={account}
                  workspaceId={workspaceId}
                  onJoined={() =>
                    setHasJoined(true)
                  }
                />}
              </>
            )
          ) : (
            <>
              <div className="landing-entry-heading">
                <h2>Create Workspace</h2>

                <p>
                  Create a workspace and invite your team.
                </p>
              </div>

              <p className="settings-entry-link"><Link to="/account">Sign in or create an account</Link> to manage your profile and workspace security.</p>
              <CreateWorkspaceForm />
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default LandingPage
