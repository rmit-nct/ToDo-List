import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { API_BASE_URL, apiFetch } from '../api'

const createWorkspaceSchema = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(1, 'Workspace name is required'),

  creatorName: z
    .string()
    .trim()
    .min(1, 'Your name is required'),

  creatorEmail: z
    .union([
      z.email('Please enter a valid email'),
      z.literal(''),
    ])
    .optional(),
})

type CreateWorkspaceFormData =
  z.infer<typeof createWorkspaceSchema>

type WorkspaceResponse = {
  id: string
  name: string
  members: {
    id: string
    name: string
    email?: string
  }[]
}

function CreateWorkspaceForm() {
  const navigate = useNavigate()

  const [serverError, setServerError] =
    useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
  })

  const onSubmit = async (
    data: CreateWorkspaceFormData
  ) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      const response = await apiFetch(
        `${API_BASE_URL}/api/workspaces`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            workspaceName: data.workspaceName,
            creatorName: data.creatorName,
            creatorEmail:
              data.creatorEmail || undefined,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to create workspace'
        )
      }

      const workspace =
        result as WorkspaceResponse

      const creator =
        workspace.members[0]

      if (!creator) {
        throw new Error(
          'Workspace creator was not returned'
        )
      }

      localStorage.setItem(
        `memberIdentity:${workspace.id}`,
        JSON.stringify(creator)
      )

      navigate(
        `/workspace/${workspace.id}/app/home`
      )
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message)
      } else {
        setServerError(
          'Something went wrong'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid = () => {
    setServerError(null)
  }

  return (
    <form
      className="workspace-form"
      onSubmit={handleSubmit(
        onSubmit,
        onInvalid
      )}
    >
      <label className="workspace-form-field">
        Workspace Name

        <input
          type="text"
          placeholder="e.g. Human Resource Team"
          aria-invalid={
            errors.workspaceName
              ? 'true'
              : 'false'
          }
          {...register('workspaceName', {
            onChange: () =>
              setServerError(null),
          })}
        />

        {errors.workspaceName && (
          <span className="form-error">
            {errors.workspaceName.message}
          </span>
        )}
      </label>

      <label className="workspace-form-field">
        Your Name

        <input
          type="text"
          placeholder="Your name"
          aria-invalid={
            errors.creatorName
              ? 'true'
              : 'false'
          }
          {...register('creatorName', {
            onChange: () =>
              setServerError(null),
          })}
        />

        {errors.creatorName && (
          <span className="form-error">
            {errors.creatorName.message}
          </span>
        )}
      </label>

      <label className="workspace-form-field">
        Email (optional)

        <input
          type="email"
          placeholder="you@example.com"
          aria-invalid={
            errors.creatorEmail
              ? 'true'
              : 'false'
          }
          {...register('creatorEmail', {
            onChange: () =>
              setServerError(null),
          })}
        />

        {errors.creatorEmail && (
          <span className="form-error">
            {errors.creatorEmail.message}
          </span>
        )}
      </label>

      {serverError && (
        <p className="form-error">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        className="workspace-form-submit"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Creating...'
          : 'Create Workspace'}
      </button>
    </form>
  )
}

export default CreateWorkspaceForm