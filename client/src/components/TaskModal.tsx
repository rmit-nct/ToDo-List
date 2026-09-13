import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { API_BASE_URL } from '../api'
import { useTasks } from '../taskStoreContext'
import type {
  Member,
  Task,
  TaskPriority,
  TaskStatus,
} from '../types'

type FormValues = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate: string
}

type WorkspaceMember = {
  id: string
  name: string
  email?: string
}

export function TaskModal({
  task,
  workspaceId,
  onClose,
}: {
  task?: Task
  workspaceId: string
  onClose: () => void
}) {
  const { saveTask, deleteTask } = useTasks()

  const [members, setMembers] =
    useState<Member[]>([])

  const [memberError, setMemberError] =
    useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>()

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setMemberError(null)

        const response = await fetch(
          `${API_BASE_URL}/api/workspaces/${workspaceId}`
        )

        if (!response.ok) {
          throw new Error(
            'Failed to load workspace members'
          )
        }

        const workspace =
          await response.json()

        const workspaceMembers: Member[] =
          workspace.members.map(
            (
              member: WorkspaceMember,
              index: number
            ) => ({
              id: member.id,
              name: member.name,

              initials: member.name
                .split(' ')
                .filter(Boolean)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),

              color: [
                '#fbb61b',
                '#4896ac',
                '#806cc1',
                '#56a177',
              ][index % 4],
            })
          )

        setMembers(workspaceMembers)
      } catch (error) {
        console.error(
          'Load members error:',
          error
        )

        setMemberError(
          'Could not load workspace members'
        )
      }
    }

    loadMembers()
  }, [workspaceId])

  useEffect(() => {
    reset({
      title: task?.title ?? '',

      description:
        task?.description ?? '',

      status:
        task?.status ?? 'todo',

      priority:
        task?.priority ?? 'medium',

      assigneeId:
        task?.assignee?.id ??
        members[0]?.id ??
        '',

      dueDate: (
        task?.dueDate ??
        new Date().toISOString()
      ).slice(0, 10),
    })
  }, [reset, task, members])

  const submit = async (
    values: FormValues
  ) => {
    const assignee =
      members.find(
        (member) =>
          member.id === values.assigneeId
      )

    if (!assignee) {
      setMemberError(
        'Please select an assignee'
      )
      return
    }

    const creator =
      task?.creator ??
      members[0]

    if (!creator) {
      setMemberError(
        'Workspace has no members'
      )
      return
    }

    await saveTask({
      id:
        task?.id ??
        crypto.randomUUID(),

      title: values.title,

      description:
        values.description,

      status: values.status,

      priority:
        values.priority,

      dueDate: new Date(
        `${values.dueDate}T12:00:00`
      ).toISOString(),

      assignee,

      creator,

      workspaceId,

      createdAt:
        task?.createdAt ??
        new Date().toISOString(),
    })

    onClose()
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.currentTarget ===
          event.target
        ) {
          onClose()
        }
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="modal-heading">
          <div>
            <span>
              {task
                ? 'EDIT TASK'
                : 'NEW TASK'}
            </span>

            <h2 id="task-modal-title">
              {task
                ? 'Update task'
                : 'Create a new task'}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(submit)}
        >
          <label className="full">
            Title

            <input
              autoFocus
              {...register('title', {
                required:
                  'A title is required',
              })}
            />

            {errors.title ? (
              <small className="error">
                {errors.title.message}
              </small>
            ) : null}
          </label>

          <label className="full">
            Description

            <textarea
              rows={3}
              {...register(
                'description'
              )}
            />
          </label>

          <label>
            Status

            <select
              {...register('status')}
            >
              <option value="todo">
                To do
              </option>

              <option value="in-progress">
                In progress
              </option>

              <option value="done">
                Done
              </option>
            </select>
          </label>

          <label>
            Priority

            <select
              {...register('priority')}
            >
              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>
            </select>
          </label>

          <label>
            Assignee

            <select
              {...register(
                'assigneeId'
              )}
            >
              {members.map(
                (member) => (
                  <option
                    value={member.id}
                    key={member.id}
                  >
                    {member.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Due date

            <input
              type="date"
              {...register('dueDate', {
                required: true,
              })}
            />
          </label>

          {memberError ? (
            <small className="error full">
              {memberError}
            </small>
          ) : null}

          <div className="modal-actions">
            {task ? (
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  await deleteTask(
                    task.id
                  )
                  onClose()
                }}
              >
                Delete task
              </button>
            ) : (
              <span />
            )}

            <div>
              <button
                type="button"
                className="secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
                disabled={
                  members.length === 0
                }
              >
                {task
                  ? 'Save changes'
                  : 'Create task'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}