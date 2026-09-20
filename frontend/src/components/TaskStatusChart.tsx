import type { Task } from '../types';
import './TaskStatusChart.css';

// Preserve the team's My Progress / Workspace Progress charts without loading
// a charting runtime. Counts are also exposed as text for assistive technology.
export default function TaskStatusChart({ title, tasks }: { title: string; tasks: Task[] }) {
  const counts = [
    { label: 'To do', status: 'todo', color: 'var(--teal)' },
    { label: 'In progress', status: 'in-progress', color: 'var(--yellow)' },
    { label: 'Done', status: 'done', color: 'var(--green)' },
  ].map(item => ({ ...item, count: tasks.filter(task => task.status === item.status).length }));
  const total = tasks.length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = tasks.filter(task => task.status !== 'done' && new Date(`${task.dueDate.slice(0, 10)}T12:00:00`) < today).length;
  let end = 0;
  const slices = counts.map(item => {
    const start = end; end += total ? item.count / total * 100 : 0;
    return `${item.color} ${start}% ${end}%`;
  });
  return <section className="task-status-chart" aria-label={title}>
    <div className="task-status-chart-heading"><h2>{title}</h2>{overdue > 0 && <span>{overdue} overdue</span>}</div>
    <div className="task-status-chart-content">
      <div className="task-status-ring" aria-hidden="true" style={{ background: total ? `conic-gradient(${slices.join(',')})` : 'var(--line)' }}><span>{total ? `${Math.round(counts[2].count / total * 100)}%` : '—'}<small>done</small></span></div>
      <ul>{counts.map(item => <li key={item.status}><i aria-hidden="true" style={{ background: item.color }} />{item.label}<strong>{item.count}</strong></li>)}</ul>
    </div>
  </section>;
}
