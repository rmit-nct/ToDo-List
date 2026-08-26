import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWorkspaceSchema } from '../schemas/workspaceSchema'

type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>

function CreateWorkspaceForm() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
  })

  const onSubmit = (data: CreateWorkspaceFormData) => {
    const workspaceId = crypto.randomUUID()

    const creatorIdentity = {
      workspaceId,
      name: data.memberName,
      email: '',
    }

    localStorage.setItem(
      `memberIdentity:${workspaceId}`,
      JSON.stringify(creatorIdentity)
    )

    console.log('Created workspace:', {
      workspaceId,
      workspaceName: data.workspaceName,
      creator: creatorIdentity,
    })

    navigate(`/workspace/${workspaceId}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Create Workspace</h2>

      <p>Create a new workspace for your team.</p>

      <label>
        Workspace Name
        <input
          type="text"
          placeholder="e.g. Human Resource Team"
          {...register('workspaceName')}
        />
      </label>

      {errors.workspaceName && (
        <p>{errors.workspaceName.message}</p>
      )}

      <label>
        Your Name
        <input
          type="text"
          placeholder="Your name"
          {...register('memberName')}
        />
      </label>

      {errors.memberName && (
        <p>{errors.memberName.message}</p>
      )}

      <button type="submit">
        Create Workspace
      </button>
    </form>
  )
}

export default CreateWorkspaceForm