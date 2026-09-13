import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { joinWorkspaceSchema } from '../schemas/workspaceSchema'
import { API_BASE_URL } from '../api'

type JoinWorkspaceFormData = z.infer<typeof joinWorkspaceSchema>

type JoinWorkspaceFormProps = {
  workspaceId: string
  onJoined: () => void
}

type MemberResponse = {
  id: string
  name: string
  email?: string
}

function JoinWorkspaceForm({
  workspaceId,
  onJoined,
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
  })

  const onSubmit = async (
    data: JoinWorkspaceFormData
  ) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      const response = await fetch(
        `${API_BASE_URL}/api/workspaces/${workspaceId}/members`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name: data.name,
            email: data.email || undefined,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to join workspace'
        )
      }

      const member = result as MemberResponse

      const identity = {
        workspaceId,
        id: member.id,
        name: member.name,
        email: member.email ?? '',
      }

      localStorage.setItem(
        `memberIdentity:${workspaceId}`,
        JSON.stringify(identity)
      )

      console.log('Joined workspace:', identity)

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
      <label className="workspace-form-field">
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
