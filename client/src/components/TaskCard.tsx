import { Calendar, MoreHorizontal } from 'lucide-react'
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
  const assigneeName = task.assignee?.name ?? 'Unassigned'
  const assigneeId = task.assignee?.id ?? ''
  const assigneeInitials = task.assignee?.initials ?? '—'

  return (
    <article
      className="task-card"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(task)
        }
      }}
    >
      <div className="card-top">
        <span className={`priority ${task.priority}`}>
          {task.priority}
        </span>

        <MoreHorizontal />
      </div>

      <h3>{task.title}</h3>

      {task.description ? (
        <p>{task.description}</p>
      ) : null}

      <footer>
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