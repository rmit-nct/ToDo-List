import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ListChecks, Users, TrendingUp, Check } from 'lucide-react'

import JoinWorkspaceForm from '../components/JoinWorkspaceForm'
import CreateWorkspaceForm from '../components/CreateWorkspaceForm'
import './LandingPage.css'

function LandingPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()

  const [hasJoined, setHasJoined] = useState(false)

  useEffect(() => {
    if (!workspaceId) {
      setHasJoined(false)
      return
    }

    const identity = localStorage.getItem(
      `memberIdentity:${workspaceId}`
    )

    setHasJoined(identity !== null)
  }, [workspaceId])

  return (
    <main className="landing-page">
      <section className="landing-promo">
        <div className="landing-brand">
          <div className="landing-brand-mark">N</div>

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
            hasJoined ? (
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
                    if (workspaceId) {
                      navigate(`/workspace/${workspaceId}/app/today`)
                    }
                  }}
                >
                  Enter Workspace
                </button>
              </div>
            ) : (
              <>
                <div className="landing-entry-heading">
                  <h2>Join Workspace</h2>
                  <p>Enter your details to join this workspace.</p>
                </div>

                <JoinWorkspaceForm
                  workspaceId={workspaceId}
                  onJoined={() => setHasJoined(true)}
                />
              </>
            )
          ) : (
            <>
              <div className="landing-entry-heading">
                <h2>Create Workspace</h2>
                <p>Create a workspace and invite your team.</p>
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