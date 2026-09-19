import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { joinWorkspaceSchema } from '../schemas/workspaceSchema'
import { joinWorkspace } from '../joinWorkspace'
import type { Account } from '../auth'

type JoinWorkspaceFormData = z.infer<typeof joinWorkspaceSchema>

type JoinWorkspaceFormProps = {
  workspaceId: string
  onJoined: () => void
  account?: Account | null
}

function JoinWorkspaceForm({
  workspaceId,
  onJoined,
  account,
}: JoinWorkspaceFormProps) {
  const [serverError, setServerError] =
    useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinWorkspaceFormData>({
    resolver: zodResolver(joinWorkspaceSchema),
    defaultValues: { name: account?.name || "", email: account?.email || "" },
  })

  const onSubmit = async (
    data: JoinWorkspaceFormData
  ) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      await joinWorkspace(workspaceId, { name: account?.name || data.name, email: account?.email || data.email });
      onJoined()
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message)
      } else {
        setServerError(
          'Something went wrong while joining the workspace'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="workspace-form"
      onSubmit={handleSubmit(onSubmit)}
    >
      {!account && <><label className="workspace-form-field">
        Name

        <input
          type="text"
          placeholder="Your name"
          aria-invalid={errors.name ? 'true' : 'false'}
          {...register('name')}
        />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
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
          aria-invalid={errors.email ? 'true' : 'false'}
          {...register('email')}
        />
        {errors.email && <span className="form-error">{errors.email.message}</span>}
      </label>

      {errors.email && (
        <p className="form-error">
          {errors.email.message}
        </p>
      )}

      </>}
      {account && <p>Joining as <strong>{account.name}</strong>.</p>}
      {serverError && (
        <p className="form-error">
          {serverError}
        </p>
      )}

      <button
        className="workspace-form-submit"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Joining...'
          : 'Join Workspace'}
      </button>
    </form>
  )
}

export default JoinWorkspaceForm
