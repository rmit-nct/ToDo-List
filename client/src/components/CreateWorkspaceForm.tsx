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
    <form 
      className="workspace-form"
      onSubmit={handleSubmit(onSubmit)}
    >

      <label className="workspace-form-field">
        Workspace Name
        <input
          type="text"
          placeholder="e.g. Human Resource Team"
          {...register('workspaceName')}
        />
      </label>

      {errors.workspaceName && (
        <p className="form-error">
          {errors.workspaceName.message}
        </p>
      )}

      <label className="workspace-form-field">
        Your Name
        <input
          type="text"
          placeholder="Your name"
          {...register('memberName')}
        />
      </label>

      {errors.memberName && (
        <p className="form-error">
          {errors.memberName.message}
        </p>
      )}

      <button
        className="workspace-form-submit"
        type="submit"
      >
        Create Workspace
      </button>
    </form>
  )
}

export default CreateWorkspaceForm