import { Calendar, MoreHorizontal } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTasks } from '../taskStoreContext'
import './TaskCardActions.css'
import type { Task } from '../types'

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))

export function TaskCard({
  task,
  onOpen,
}: {
  task: Task
  onOpen: (task: Task) => void
}) {
  const { moveTask, deleteTask } = useTasks()
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const popupId = useId()
  const close = () => { setPosition(null); trigger.current?.focus() }
  useEffect(() => {
    if (!position) return
    popup.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!popup.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setPosition(null)
    }
    const reposition = () => setPosition(null)
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [position])
  const runAction = async (action: () => Promise<void>) => {
    setBusy(true); setActionError(null)
    try { await action(); close() }
    catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to update task.') }
    finally { setBusy(false) }
  }
  const assigneeName =
    task.assignee?.name ?? 'Unassigned'

  const assigneeId =
    task.assignee?.id ?? ''

  const assigneeInitials =
    task.assignee?.initials ?? '—'

  return (
    <article
      className="task-card"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault()
          onOpen(task)
        }
      }}
    >
      <div className="card-top">
        <span
          className={`priority ${task.priority}`}
        >
          {task.priority}
        </span>

        <button
          type="button"
          className="task-more-button"
          ref={trigger}
          aria-label={`Quick actions for ${task.title}`}
          aria-haspopup="dialog"
          aria-expanded={!!position}
          aria-controls={position ? popupId : undefined}
          title="Quick actions"
          onClick={(event) => {
            event.stopPropagation()
            if (position) { close(); return }
            const rect = event.currentTarget.getBoundingClientRect()
            setActionError(null)
            setPosition({ left: Math.max(8, Math.min(rect.right - 210, window.innerWidth - 218)), top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 290)) })
          }}
        >
          <MoreHorizontal />
        </button>
        {position ? createPortal(<div
          id={popupId}
          ref={popup}
          className={`task-quick-actions${trigger.current?.closest('.theme-dark') ? ' task-quick-actions--dark' : ''}`}
          role="dialog"
          aria-label={`Quick actions for ${task.title}`}
          style={position}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === 'Escape') { event.preventDefault(); close() }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPosition(null)
          }}
        >
          <button disabled={busy} onClick={() => { close(); onOpen(task) }}>Edit task</button>
          <span className="task-quick-actions__label">Move to</span>
          {(['todo', 'in-progress', 'done'] as const).filter((status) => status !== task.status).map((status) => <button key={status} disabled={busy} onClick={() => void runAction(() => moveTask(task.id, status))}>{status === 'todo' ? 'To do' : status === 'in-progress' ? 'In progress' : 'Done'}</button>)}
          <button className="task-quick-actions__delete" disabled={busy} onClick={() => {
            if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) void runAction(() => deleteTask(task.id))
          }}>Delete task</button>
          {busy ? <span role="status">Saving…</span> : null}
          {actionError ? <span role="alert">{actionError}</span> : null}
        </div>, document.body) : null}
      </div>

      <div className="task-card-content">
        <h3>{task.title}</h3>

        {task.description ? (
          <p>{task.description}</p>
        ) : (
          <p className="task-card-no-description">
            No description
          </p>
        )}
      </div>

      <footer className="task-card-footer">
        <span className="date">
          <Calendar />
          {dateLabel(task.dueDate)}
        </span>

        <span
          className="avatar"
          title={assigneeName}
          data-member={assigneeId}
        >
          {assigneeInitials}
        </span>
      </footer>
    </article>
  )
}
