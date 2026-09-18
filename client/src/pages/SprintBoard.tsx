import { useMemo, useState } from 'react';
import { ChevronDown, Copy, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useWorkspaceMembers } from '../useWorkspaceMembers';
import { useParams } from 'react-router-dom';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { useTasks } from '../taskStoreContext';
import type { Task, TaskStatus } from '../types';

const columns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'todo', title: 'To do', color: 'yellow' }, { status: 'in-progress', title: 'In progress', color: 'blue' }, { status: 'done', title: 'Done', color: 'green' },
];

export function SprintBoard() {
  const { workspaceId = 'web-dev' } = useParams();
  const { tasks, moveTask } = useTasks();
  const { workspaceMembers } = useWorkspaceMembers(workspaceId);
  const [query, setQuery] = useState('');
  const [assignee, setAssignee] = useState('all');
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(() => new Set());
  const filtered = useMemo(() => tasks.filter((task) => task.workspaceId === workspaceId && task.title.toLowerCase().includes(query.toLowerCase()) && (assignee === 'all' || task.assignee?.id === assignee)), [tasks, query, assignee, workspaceId]);
  const toggleColumn = (status: TaskStatus) => setCollapsedColumns((current) => {
    const next = new Set(current);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    return next;
  });

  return <div className="page board-page">
    <div className="page-heading board-heading"><div><h1>Weekly Sprint Board</h1><span>Plan, share ownership, and keep work moving.</span></div><div className="board-actions"><button className="invite"><Copy /> NEO-WEB-24</button><button className="primary" onClick={() => setModalTask(null)}><Plus /> New task</button></div></div>
    <section className="filters board-filters"><div className="search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this workspace..." aria-label="Search board" /></div><span className="filter-label"><SlidersHorizontal /> Filter</span><select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filter by assignee"><option value="all">All assignees</option>{workspaceMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></section>
    <section className="kanban" aria-label="Weekly sprint board">{columns.map((column) => {
      const columnTasks = filtered.filter((task) => task.status === column.status);
      const isCollapsed = collapsedColumns.has(column.status);
      const tasksId = `${column.status}-column-tasks`;
      return <div className={`kanban-column${isCollapsed ? ' is-collapsed' : ''}`} data-status={column.status} key={column.status} onDragOver={(e) => e.preventDefault()} onDrop={(e) => void moveTask(e.dataTransfer.getData('text/task-id'), column.status).catch(() => undefined)}><div className="column-heading"><div><span className={`group-dot ${column.color}`} /><h2>{column.title}</h2><small>{columnTasks.length}</small></div><button className="column-toggle" aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${column.title}`} aria-expanded={!isCollapsed} aria-controls={tasksId} onClick={() => toggleColumn(column.status)}><ChevronDown /></button></div><div className="column-tasks" id={tasksId} hidden={isCollapsed}>{columnTasks.map((task) => <div draggable onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)} key={task.id}><TaskCard task={task} onOpen={setModalTask} /></div>)}<button className="add-card" onClick={() => setModalTask(null)}><Plus /> Add task</button></div></div>;
    })}</section>
    {modalTask !== undefined ? <TaskModal task={modalTask ?? undefined} workspaceId={workspaceId} onClose={() => setModalTask(undefined)} /> : null}
  </div>;
}
