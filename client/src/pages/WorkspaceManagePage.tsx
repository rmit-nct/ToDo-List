import { LoadingSkeleton } from "../components/LoadingSkeleton";
import {
  useEffect,
  useState,
} from 'react'
import {
  Check,
  Copy,
  Users,
} from 'lucide-react'
import { useParams } from 'react-router-dom'

import { API_BASE_URL, apiFetch } from '../api'
import type { TeamMember } from '../types'

type WorkspaceResponse = {
  id: string
  name: string
  members: TeamMember[]
}

export function WorkspaceManagePage() {
  const { workspaceId } = useParams()

  const [workspaceName, setWorkspaceName] =
    useState('')

  const [members, setMembers] =
    useState<TeamMember[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSaving, setIsSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [nameError, setNameError] =
    useState<string | null>(null)

  const [saved, setSaved] =
    useState(false)

  const [copied, setCopied] =
    useState(false)

  useEffect(() => {
    if (!workspaceId) {
      setError('Workspace ID is missing.')
      setIsLoading(false)
      return
    }

    const loadWorkspace = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await apiFetch(
          `${API_BASE_URL}/api/workspaces/${workspaceId}`
        )

        if (!response.ok) {
          const result = await response.json()

          throw new Error(
            result.error ||
              'Failed to load workspace'
          )
        }

        const workspace =
          (await response.json()) as WorkspaceResponse

        setWorkspaceName(workspace.name)
        setMembers(workspace.members ?? [])
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError(
            'Failed to load workspace'
          )
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspace()
  }, [workspaceId])

  const handleSave = async () => {
    if (!workspaceId) {
      setError(
        'Workspace ID is missing.'
      )
      return
    }

    if (workspaceName.trim() === '') {
      setNameError(
        'Workspace name is required.'
      )
      return
    }

    setNameError(null)

    try {
      setIsSaving(true)
      setError(null)
      setSaved(false)

      const response = await apiFetch(
        `${API_BASE_URL}/api/workspaces/${workspaceId}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: workspaceName.trim(),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to update workspace'
        )
      }

      setWorkspaceName(result.name)
      setSaved(true)

      window.dispatchEvent(
        new CustomEvent(
          'workspace-updated',
          {
            detail: {
              id: result.id,
              name: result.name,
            },
          }
        )
      )

      window.setTimeout(() => {
        setSaved(false)
      }, 2000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          'Failed to update workspace'
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!workspaceId) {
      return
    }

    const shareUrl =
      `${window.location.origin}/workspace/${workspaceId}`

    try {
      await navigator.clipboard.writeText(
        shareUrl
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error(
        'Failed to copy invite link:',
        error
      )

      setError(
        'Failed to copy invite link.'
      )
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <LoadingSkeleton variant="settings" label="Loading workspace" />
      </div>
    )
  }

  return (
    <div className="page workspace-manage-page">
      <div className="page-heading">
        <div>
          <p>WORKSPACE</p>

          <h1>Manage Workspace</h1>

          <span>
            Update workspace details and
            review your team members.
          </span>
        </div>
      </div>

      {error ? (
        <p className="form-error">
          {error}
        </p>
      ) : null}

      <section className="workspace-manage-card">
        <div className="workspace-manage-section">
          <h2>Workspace details</h2>

          <label>
            Workspace name

            <input
              type="text"
              value={workspaceName}
              aria-invalid={
                nameError
                  ? 'true'
                  : 'false'
              }
              onChange={(event) => {
                setWorkspaceName(
                  event.target.value
                )

                setNameError(null)
              }}
            />

            {nameError ? (
              <span className="form-error">
                {nameError}
              </span>
            ) : null}
          </label>

          <button
            type="button"
            className="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {saved ? (
              <>
                <Check />
                Saved
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              'Save changes'
            )}
          </button>
        </div>

        <div className="workspace-manage-section">
          <div className="workspace-manage-section-heading">
            <div>
              <h2>Members</h2>

              <p>
                {members.length}{' '}
                {members.length === 1
                  ? 'member'
                  : 'members'}
              </p>
            </div>

            <Users />
          </div>

          {members.length === 0 ? (
            <p className="workspace-manage-empty">
              No members yet.
            </p>
          ) : (
            <ul className="workspace-member-list">
              {members.map((member) => (
                <li key={member.id}>
                  <span className="avatar">
                    {member.name
                      .split(' ')
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>

                  <div>
                    <strong>
                      {member.name}
                    </strong>

                    <small>
                      {member.email ||
                        'No email'}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="workspace-manage-section">
          <h2>Invite members</h2>

          <p className="workspace-manage-description">
            Share this workspace link with
            your teammates.
          </p>

          <button
            type="button"
            className="secondary"
            onClick={
              handleCopyInvite
            }
          >
            <Copy />

            {copied
              ? 'Link Copied!'
              : 'Copy Invite Link'}
          </button>
        </div>
      </section>
    </div>
  )
}