import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  CircleX,
} from 'lucide-react'

import JoinWorkspaceForm from '../components/JoinWorkspaceForm'
import CreateWorkspaceForm from '../components/CreateWorkspaceForm'
import { API_BASE_URL, apiFetch } from '../api'

import './LandingPage.css'
import { LandingPromo } from '../components/LandingPromo'

function LandingPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()

  const [hasJoined, setHasJoined] = useState(false)
  const [workspaceExists, setWorkspaceExists] =
    useState<boolean | null>(null)

  useEffect(() => {
    if (!workspaceId) {
      setHasJoined(false)
      setWorkspaceExists(null)
      return
    }

    const identity = localStorage.getItem(`memberIdentity:${workspaceId}`)

    setHasJoined(identity !== null)

    const checkWorkspace = async () => {
      try {
        const response = await apiFetch(
          `${API_BASE_URL}/api/workspaces/${workspaceId}`
        )

        if (response.status === 404) {
          setWorkspaceExists(false)
          return
        }

        if (!response.ok) {
          throw new Error(
            'Failed to check workspace'
          )
        }

        const workspace = await response.json()
        if (workspace.ownerId) {
          const member = workspace.members.find((item: { id: string }) => item.id === workspace.currentMemberId)
          setHasJoined(!!member)
          if (member) localStorage.setItem(`memberIdentity:${workspaceId}`, JSON.stringify(member))
        }
        setWorkspaceExists(true)
      } catch (error) {
        console.error(
          'Workspace check error:',
          error
        )

        setWorkspaceExists(false)
      }
    }

    checkWorkspace()
  }, [workspaceId])

  return (
    <main className="landing-page">
      <LandingPromo />

      <section className="landing-entry">
        <div className="landing-entry-card">
          {workspaceId ? (
            workspaceExists === null ? (
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
                    Enter your details to join this workspace.
                  </p>
                </div>

                <p className="settings-entry-link"><Link to={`/account?returnTo=${encodeURIComponent(`/workspace/${workspaceId}`)}`}>Sign in to your account</Link> before joining an account-backed workspace.</p>
                <JoinWorkspaceForm
                  workspaceId={workspaceId}
                  onJoined={() =>
                    setHasJoined(true)
                  }
                />
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
