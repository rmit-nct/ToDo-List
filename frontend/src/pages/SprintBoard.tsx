import { WorkspaceActions } from "../components/WorkspaceActions";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useWorkspaceMembers } from "../useWorkspaceMembers";
import { useParams } from "react-router-dom";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import { useTasks } from "../taskStoreContext";
import type { Task, TaskStatus } from "../types";

const columns: { status: TaskStatus; title: string; color: string }[] = [
  { status: "todo", title: "To do", color: "yellow" },
  { status: "in-progress", title: "In progress", color: "blue" },
  { status: "done", title: "Done", color: "green" },
];

export function SprintBoard() {
  const { workspaceId = "" } = useParams();
  const { tasks, moveTask, isLoading } = useTasks();
  const { workspaceMembers } = useWorkspaceMembers(workspaceId);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("todo");
  const [modalTask, setModalTask] = useState<Task | null | undefined>(
    undefined,
  );
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(
    () => new Set(),
  );
  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.workspaceId === workspaceId &&
          task.title.toLowerCase().includes(query.toLowerCase()) &&
          (assignee === "all" ||
            (assignee === "unassigned"
              ? !(task.assignedMemberId || task.assignee?.id)
              : (task.assignedMemberId || task.assignee?.id) === assignee)),
      ),
    [tasks, query, assignee, workspaceId],
  );
  const toggleColumn = (status: TaskStatus) =>
    setCollapsedColumns((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });

  return (
    <div className="page board-page">
      <div className="page-heading board-heading">
        <div>
          <h1>Weekly Sprint Board</h1>
          <span>Plan, share ownership, and keep work moving.</span>
        </div>
        <WorkspaceActions createDisabled={isLoading} onCreate={() => {
          setInitialStatus("todo");
          setModalTask(null);
        }} />
      </div>
      <section className="filters board-filters">
        <div className="search">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this workspace..."
            aria-label="Search board"
          />
        </div>
        <span className="filter-label">
          <SlidersHorizontal /> Filter
        </span>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          aria-label="Filter by assignee"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {workspaceMembers.map((member) => (
            <option value={member.id} key={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </section>
      {isLoading ? <LoadingSkeleton variant="board" label="Loading board" /> : <section className="kanban" aria-label="Weekly sprint board">
        {columns.map((column) => {
          const columnTasks = filtered.filter(
            (task) => task.status === column.status,
          );
          const isCollapsed = collapsedColumns.has(column.status);
          const tasksId = `${column.status}-column-tasks`;
          return (
            <div
              className={`kanban-column${isCollapsed ? " is-collapsed" : ""}${dropTarget === column.status ? " is-drop-target" : ""}`}
              data-status={column.status}
              key={column.status}
              onDragOver={(event) => { if (dragging) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(column.status); } }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/task-id");
                const task = tasks.find(item => item.id === id);
                setDragging(null); setDropTarget(null);
                if (task && task.status !== column.status) void moveTask(id, column.status).catch(() => undefined);
              }}
            >
              <div className="column-heading">
                <div>
                  <span className={`group-dot ${column.color}`} />
                  <h2>{column.title}</h2>
                  <small>{columnTasks.length}</small>
                </div>
                <button
                  className="column-toggle"
                  aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${column.title}`}
                  aria-expanded={!isCollapsed}
                  aria-controls={tasksId}
                  onClick={() => toggleColumn(column.status)}
                >
                  <ChevronDown />
                </button>
              </div>
              <div className="column-tasks" id={tasksId} hidden={isCollapsed}>
                {columnTasks.map((task) => (
                  <div
                    draggable
                    className={dragging === task.id ? "is-dragging" : undefined}
                    onDragStart={(event) => { event.dataTransfer.setData("text/task-id", task.id); event.dataTransfer.effectAllowed = "move"; setDragging(task.id); }}
                    onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                    key={task.id}
                  >
                    <TaskCard task={task} onOpen={setModalTask} />
                  </div>
                ))}
                <button
                  className="add-card"
                  aria-label={`Add task to ${column.title}`}
                  onClick={() => {
                    setInitialStatus(column.status);
                    setModalTask(null);
                  }}
                >
                  <Plus /> Add task
                </button>
              </div>
            </div>
          );
        })}
      </section>}
      {modalTask !== undefined ? (
        <TaskModal
          initialStatus={initialStatus}
          task={modalTask ?? undefined}
          workspaceId={workspaceId}
          onClose={() => setModalTask(undefined)}
        />
      ) : null}
    </div>
  );
}
