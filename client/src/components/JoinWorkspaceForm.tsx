import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { joinWorkspaceSchema } from '../schemas/workspaceSchema'

type JoinWorkspaceFormData = z.infer<typeof joinWorkspaceSchema>

type JoinWorkspaceFormProps = {
  workspaceId: string
  onJoined: () => void
}

function JoinWorkspaceForm({ workspaceId, onJoined }: JoinWorkspaceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinWorkspaceFormData>({
    resolver: zodResolver(joinWorkspaceSchema),
  })

  const onSubmit = (data: JoinWorkspaceFormData) => {
    const identity = {
      workspaceId,
      name: data.name,
      email: data.email || '',
    }

    localStorage.setItem(
      `memberIdentity:${workspaceId}`,
      JSON.stringify(identity),
    )

    console.log('Saved identity:', identity)
    onJoined()
  }

  return (
    <form className="form-card stack" onSubmit={handleSubmit(onSubmit)}>
      <header className="stack stack-sm">
        <p className="eyebrow">Workspace setup</p>
        <h2>Join Workspace</h2>
        <p className="text-muted">Workspace ID: {workspaceId}</p>
      </header>

      <label className="field">
        <span>Name</span>
        <input
          type="text"
          placeholder="Your name"
          aria-invalid={errors.name ? 'true' : 'false'}
          {...register('name')}
        />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
      </label>

      <label className="field">
        <span>Email (optional)</span>
        <input
          type="email"
          placeholder="you@neoculture.com"
          aria-invalid={errors.email ? 'true' : 'false'}
          {...register('email')}
        />
        {errors.email && <span className="form-error">{errors.email.message}</span>}
      </label>

      <button className="btn btn-primary" type="submit">
        Join Workspace
      </button>
    </form>
  )
}

export default JoinWorkspaceForm
