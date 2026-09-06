import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { joinWorkspaceSchema } from '../schemas/workspaceSchema'

type JoinWorkspaceFormData = z.infer<typeof joinWorkspaceSchema>

type JoinWorkspaceFormProps = {
  workspaceId: string
  onJoined: () => void
}

function JoinWorkspaceForm({
  workspaceId,
  onJoined,
}: JoinWorkspaceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinWorkspaceFormData>({
    resolver: zodResolver(joinWorkspaceSchema),
  })

  const onSubmit = (data: JoinWorkspaceFormData) => {
    const identity = {
      workspaceId: workspaceId,
      name: data.name,
      email: data.email || '',
    }

    localStorage.setItem(
      `memberIdentity:${workspaceId}`,
      JSON.stringify(identity)
    )

    console.log('Saved identity:', identity)

    onJoined()
  }

  return (
    <form
      className="workspace-form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <label className="workspace-form-field">
        Name

        <input
          type="text"
          placeholder="Your name"
          {...register('name')}
        />
      </label>

      {errors.name && (
        <p className="form-error">
          {errors.name.message}
        </p>
      )}

      <label className="workspace-form-field">
        Email (optional)

        <input
          type="email"
          placeholder="you@neoculture.com"
          {...register('email')}
        />
      </label>

      {errors.email && (
        <p className="form-error">
          {errors.email.message}
        </p>
      )}

      <button
        className="workspace-form-submit"
        type="submit"
      >
        Join Workspace
      </button>
    </form>
  )
}

export default JoinWorkspaceForm