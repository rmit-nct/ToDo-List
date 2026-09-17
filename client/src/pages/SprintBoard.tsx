import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useWorkspaceMembers } from "../useWorkspaceMembers";
import { useWorkspace } from "../workspaceContext";
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
  const { workspace } = useWorkspace();
  const workspaceId = workspace.id;
  const { tasks, moveTask } = useTasks();
  const { workspaceMembers } = useWorkspaceMembers(workspaceId);
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [range, setRange] = useState("all");
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("todo");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const weekStart = start.getTime();
  const weekEnd = end.getTime();
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
          (assignee === "all" || task.assignee?.id === assignee) &&
          (range === "all" ||
            (new Date(task.dueDate.slice(0, 10) + "T12:00:00").getTime() >=
              weekStart &&
              new Date(task.dueDate.slice(0, 10) + "T12:00:00").getTime() <
                weekEnd)),
      ),
    [tasks, query, assignee, workspaceId, range, weekStart, weekEnd],
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
        <div className="board-actions">
          <button
            className="primary"
            onClick={() => {
              setInitialStatus("todo");
              setModalTask(null);
            }}
          >
            <Plus /> New task
          </button>
        </div>
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
          {workspaceMembers.map((member) => (
            <option value={member.id} key={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Task date range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="all">All dates</option>
          <option value="week">This week</option>
        </select>
      </section>
      <section className="kanban" aria-label="Weekly sprint board">
        {columns.map((column) => {
          const columnTasks = filtered.filter(
            (task) => task.status === column.status,
          );
          const isCollapsed = collapsedColumns.has(column.status);
          const tasksId = `${column.status}-column-tasks`;
          return (
            <div
              className={`kanban-column${isCollapsed ? " is-collapsed" : ""}`}
              data-status={column.status}
              key={column.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) =>
                void moveTask(
                  e.dataTransfer.getData("text/task-id"),
                  column.status,
                ).catch(() => undefined)
              }
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
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/task-id", task.id)
                    }
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
      </section>
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
