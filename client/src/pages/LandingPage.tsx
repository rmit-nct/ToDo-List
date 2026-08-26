import { useState } from 'react'
import { useParams } from 'react-router-dom'
import JoinWorkspaceForm from '../components/JoinWorkspaceForm'

function LandingPage() {
  const { workspaceId } = useParams()

  const [hasJoined, setHasJoined] = useState(() => {
    if (!workspaceId) return false

    return localStorage.getItem(`memberIdentity:${workspaceId}`) !== null
  })

  return (
    <main>
      <section>
        <h1>Your team. One board.</h1>

        <p>
          A collaborative task-management space for student teams and club committees.
        </p>
      </section>

      <section>
        {workspaceId ? (
          hasJoined ? (
            <>
              <h2>Workspace</h2>
              <p>You have joined this workspace.</p>
            </>
          ) : (
            <>
              <h2>Join Workspace</h2>
              <p>Workspace ID: {workspaceId}</p>

              <JoinWorkspaceForm
                workspaceId={workspaceId}
                onJoined={() => setHasJoined(true)}
              />
            </>
          )
        ) : (
          <>
            <h2>Get started</h2>
            <p>Create a workspace to begin.</p>
          </>
        )}
      </section>
    </main>
  )
}

export default LandingPage