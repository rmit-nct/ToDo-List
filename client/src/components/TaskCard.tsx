import { Calendar, MoreHorizontal } from 'lucide-react';
import type { Task } from '../types';

const dateLabel = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  return <article className="task-card" tabIndex={0} onClick={() => onOpen(task)} onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}>
    <div className="card-top"><span className={`priority ${task.priority}`}>{task.priority}</span><button aria-label={`Open ${task.title}`} onClick={(e) => { e.stopPropagation(); onOpen(task); }}><MoreHorizontal /></button></div>
    <h3>{task.title}</h3>
    {task.description ? <p>{task.description}</p> : null}
    <footer><span className="date"><Calendar /> {dateLabel(task.dueDate)}</span><span className="avatar" title={task.assignee.name} data-member={task.assignee.id}>{task.assignee.initials}</span></footer>
  </article>;
}
