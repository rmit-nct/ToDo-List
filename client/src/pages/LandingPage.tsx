import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import JoinWorkspaceForm from '../components/JoinWorkspaceForm'
import CreateWorkspaceForm from '../components/CreateWorkspaceForm'

function LandingPage() {
  const { workspaceId } = useParams()
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
          <CreateWorkspaceForm />
        )}
      </section>
    </main>
  )
}

export default LandingPage