import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import JoinWorkspaceForm from '../components/JoinWorkspaceForm'
import CreateWorkspaceForm from '../components/CreateWorkspaceForm'
import './LandingPage.css'

function LandingPage() {
  const { workspaceId } = useParams()
  const [hasJoined, setHasJoined] = useState(false)

  useEffect(() => {
    if (!workspaceId) {
      setHasJoined(false)
      return
    }

    const identity = localStorage.getItem(`memberIdentity:${workspaceId}`)

    setHasJoined(identity !== null)
  }, [workspaceId])

  return (
    <main className="landing-page">
      <section className="landing-copy">
        <p className="eyebrow">NEO To-Do List</p>
        <h1>
          Your team. <span>One board.</span>
        </h1>

        <p className="lead">
          A collaborative task-management space for student teams and club committees.
        </p>
      </section>

      <section className="workspace-panel">
        {workspaceId ? (
          hasJoined ? (
            <div className="surface stack">
              <p className="eyebrow">Workspace</p>
              <h2>You are ready to collaborate.</h2>
              <p className="text-muted">You have joined this workspace.</p>
            </div>
          ) : (
            <JoinWorkspaceForm
              workspaceId={workspaceId}
              onJoined={() => setHasJoined(true)}
            />
          )
        ) : (
          <CreateWorkspaceForm />
        )}
      </section>
    </main>
  )
}

export default LandingPage
