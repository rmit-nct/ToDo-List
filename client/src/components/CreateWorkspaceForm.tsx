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
      JSON.stringify(creatorIdentity),
    )

    console.log('Created workspace:', {
      workspaceId,
      workspaceName: data.workspaceName,
      creator: creatorIdentity,
    })

    navigate(`/workspace/${workspaceId}`)
  }

  return (
    <form className="form-card stack" onSubmit={handleSubmit(onSubmit)}>
      <header className="stack stack-sm">
        <p className="eyebrow">Workspace setup</p>
        <h2>Create Workspace</h2>
        <p className="text-muted">Create a new workspace for your team.</p>
      </header>

      <label className="field">
        <span>Workspace Name</span>
        <input
          type="text"
          placeholder="e.g. Human Resource Team"
          aria-invalid={errors.workspaceName ? 'true' : 'false'}
          {...register('workspaceName')}
        />
        {errors.workspaceName && (
          <span className="form-error">{errors.workspaceName.message}</span>
        )}
      </label>

      <label className="field">
        <span>Your Name</span>
        <input
          type="text"
          placeholder="Your name"
          aria-invalid={errors.memberName ? 'true' : 'false'}
          {...register('memberName')}
        />
        {errors.memberName && (
          <span className="form-error">{errors.memberName.message}</span>
        )}
      </label>

      <button className="btn btn-primary" type="submit">
        Create Workspace
      </button>
    </form>
  )
}

export default CreateWorkspaceForm
