import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ListChecks,
  Users,
  TrendingUp,
  Check,
  CircleX,
} from 'lucide-react'

import JoinWorkspaceForm from '../components/JoinWorkspaceForm'
import CreateWorkspaceForm from '../components/CreateWorkspaceForm'
import { API_BASE_URL } from '../api'

import './LandingPage.css'

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

    const identity = localStorage.getItem(
      `memberIdentity:${workspaceId}`
    )

    setHasJoined(identity !== null)

    const checkWorkspace = async () => {
      try {
        const response = await fetch(
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
      <section className="landing-promo">
        <div className="landing-brand">
          <div className="landing-brand-mark">
            N
          </div>

          <div className="landing-brand-text">
            <strong>NEO</strong>
            <span>To-do</span>
          </div>
        </div>

        <div className="landing-promo-content">
          <div className="landing-kicker">
            COLLABORATIVE TASK MANAGEMENT
          </div>

          <h1>
            Your team.
            <br />
            <span>One board.</span>
          </h1>

          <div className="landing-title-line" />

          <p className="landing-description">
            A collaborative task-management space for student teams
            and club committees.
          </p>
        </div>

        <div className="landing-features">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <ListChecks />
            </div>

            <h3>Stay organized</h3>

            <div className="landing-feature-line" />

            <p>
              Keep your team's tasks structured and easy to manage.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Users />
            </div>

            <h3>Work together</h3>

            <div className="landing-feature-line" />

            <p>
              Collaborate with your team and keep everyone aligned.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <TrendingUp />
            </div>

            <h3>Stay on track</h3>

            <div className="landing-feature-line" />

            <p>
              Follow progress and see what needs your attention next.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-entry">
        <div className="landing-entry-card">
          {workspaceId ? (
            workspaceExists === null ? (
              <>
                <div className="landing-entry-heading">
                  <h2>Loading Workspace</h2>

                  <p>
                    Checking workspace details...
                  </p>
                </div>
              </>
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

              <CreateWorkspaceForm />
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default LandingPage