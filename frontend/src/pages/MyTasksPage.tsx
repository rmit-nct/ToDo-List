import { LoadingSkeleton, SkeletonLine } from "../components/LoadingSkeleton";
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api'
import { useTasks } from '../taskStoreContext'
import { TaskModal } from '../components/TaskModal'
import type { Task, TaskStatus } from '../types'
import './MyTasksPage.css'

const filters: { value: 'all' | TaskStatus; label: string }[] = [{ value: 'all', label: 'All' }, { value: 'todo', label: 'To Do' }, { value: 'in-progress', label: 'In Progress' }, { value: 'done', label: 'Done' }]
export function MyTasksPage() {
  const { tasks, isLoading, error, refreshTasks } = useTasks()
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [selected, setSelected] = useState<Task | null>(null)
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    const controller = new AbortController()
    apiRequest<{ id: string; name: string }[]>('/users/me/workspaces', { signal: controller.signal }).then(setWorkspaces).catch(() => {})
    return () => controller.abort()
  }, [])
  const visible = tasks.filter(task => filter === 'all' || task.status === filter)
  return <div className="page my-tasks-page">
    <header className="my-tasks-heading"><div><h1>My Tasks</h1><p>Your assigned tasks across all workspaces.</p></div><Link className="secondary" to="/account">Your workspaces</Link></header>
    {isLoading ? <SkeletonLine width="200px" /> : error && tasks.length === 0 ? null : <>    <p className="my-tasks-count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} assigned to you</p>
    <div className="my-tasks-filters" role="group" aria-label="Filter tasks by status">{filters.map(item => <button key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{tasks.filter(task => item.value === 'all' || task.status === item.value).length}</span></button>)}</div></>}
    {isLoading ? <LoadingSkeleton label="Loading your tasks" /> : error && tasks.length === 0 ? <div className="my-tasks-error" role="alert"><h2>Assignments couldn’t be loaded</h2><p>{error}</p><div><button className="secondary" onClick={refreshTasks}>Retry</button><Link to="/account">Your account and workspaces</Link></div></div> : visible.length === 0 ? <div className="my-tasks-empty"><h2>{filter === 'all' ? 'No tasks assigned yet' : 'No tasks with this status'}</h2><p>Tasks assigned to you in any of your workspaces will appear here.</p></div> : <ul className="my-tasks-list">{visible.map(task => <li key={task.id}><button className="my-task-row" onClick={() => setSelected(task)}><span className={`my-task-indicator ${task.status}`} aria-hidden="true" /><span className="my-task-title"><strong>{task.title}</strong><small>{workspaces.find(workspace => workspace.id === task.workspaceId)?.name || 'Workspace'}</small></span><span className="my-task-status">{filters.find(item => item.value === task.status)?.label}</span><span className={`priority ${task.priority}`}>{task.priority}</span><time dateTime={task.dueDate}>{task.dueDate && !Number.isNaN(Date.parse(task.dueDate)) ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}</time></button></li>)}</ul>}
    {selected?.workspaceId && <TaskModal task={selected} workspaceId={selected.workspaceId} onClose={() => setSelected(null)} />}
  </div>
}
