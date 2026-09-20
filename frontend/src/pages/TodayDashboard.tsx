import { WorkspaceActions } from "../components/WorkspaceActions";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useParams } from "react-router-dom";
import { useWorkspaceMembers } from "../useWorkspaceMembers";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Search,
  SlidersHorizontal,
} from "lucide-react";


import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import { useTasks } from "../taskStoreContext";
import type { Task } from "../types";

const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function TodayDashboard() {
  const { workspaceId = "" } = useParams();

  const { tasks, isLoading } = useTasks();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [modalTask, setModalTask] = useState<Task | null | undefined>(
    undefined,
  );

  const { currentMember } = useWorkspaceMembers(workspaceId);
  const memberName = currentMember?.name ?? "";

  const workspaceTasks = tasks.filter(
    (task) => task.workspaceId === workspaceId,
  );

  const filtered = useMemo(
    () =>
      workspaceTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query.toLowerCase()) &&
          (status === "all" || task.status === status) &&
          (priority === "all" || task.priority === priority),
      ),
    [workspaceTasks, query, status, priority],
  );

  const today = dayStart(new Date());
  const weekEnd = new Date();
  weekEnd.setHours(0, 0, 0, 0);
  weekEnd.setDate(weekEnd.getDate() + (7 - ((weekEnd.getDay() + 6) % 7)));
  const week = weekEnd.getTime();

  const overdue = filtered.filter(
    (task) =>
      dayStart(new Date(task.dueDate.slice(0, 10) + "T12:00:00")) < today &&
      task.status !== "done",
  );

  const dueToday = filtered.filter(
    (task) =>
      dayStart(new Date(task.dueDate.slice(0, 10) + "T12:00:00")) === today,
  );

  const thisWeek = filtered.filter((task) => {
    const date = dayStart(new Date(task.dueDate));

    return date > today && date < week;
  });

  const completed = workspaceTasks.filter(
    (task) => task.status === "done",
  ).length;

  const completion = workspaceTasks.length
    ? Math.round((completed / workspaceTasks.length) * 100)
    : 0;

  const todayLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date())
    .toUpperCase();

  if (isLoading) return <div className="page"><div className="page-heading"><h1>Today Dashboard</h1><WorkspaceActions createDisabled onCreate={() => setModalTask(null)} /></div><LoadingSkeleton variant="dashboard" label="Loading dashboard" /></div>;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p>{todayLabel}</p>

          <h1>Today Dashboard</h1>

          <span>
            Welcome back, {memberName}. Here’s what needs your attention.
          </span>
        </div>

        <WorkspaceActions createDisabled={!currentMember} onCreate={() => setModalTask(null)} />
      </div>

      <section className="stats-grid" aria-label="Task summary">
        <article>
          <span className="stat-icon navy">
            <Clock3 />
          </span>

          <div>
            <small>TOTAL TASKS</small>
            <strong>{workspaceTasks.length}</strong>
            <p>In this workspace</p>
          </div>
        </article>

        <article>
          <span className="stat-icon green">
            <CheckCircle2 />
          </span>

          <div>
            <small>COMPLETED</small>
            <strong>{completed}</strong>
            <p>{completion}% of all tasks</p>
          </div>
        </article>

        <article>
          <span className="stat-icon coral">
            <CircleAlert />
          </span>

          <div>
            <small>OVERDUE</small>

            <strong>
              {
                workspaceTasks.filter(
                  (task) =>
                    dayStart(new Date(task.dueDate)) < today &&
                    task.status !== "done",
                ).length
              }
            </strong>

            <p>Needs attention</p>
          </div>
        </article>

        <article className="progress-card">
          <div>
            <small>PROGRESS</small>
            <strong>{completion}%</strong>
            <p>All workspace tasks</p>
          </div>

          <div
            className="progress-ring"
            style={
              {
                "--progress": `${completion * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <span>{completion}%</span>
          </div>
        </article>
      </section>

      <section className="filters" aria-label="Task filters">
        <div className="search">
          <Search />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
          />
        </div>

        <span className="filter-label">
          <SlidersHorizontal />
          Filter
        </span>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>

          <option value="todo">To do</option>

          <option value="in-progress">In progress</option>

          <option value="done">Done</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>

          <option value="high">High</option>

          <option value="medium">Medium</option>

          <option value="low">Low</option>
        </select>
      </section>

      <TaskGroup
        title="Overdue"
        tone="coral"
        tasks={overdue}
        onOpen={setModalTask}
      />

      <TaskGroup
        title="Today"
        tone="yellow"
        tasks={dueToday}
        onOpen={setModalTask}
      />

      <TaskGroup
        title="This week"
        tone="blue"
        tasks={thisWeek}
        onOpen={setModalTask}
      />

      {modalTask !== undefined ? (
        <TaskModal
          task={modalTask ?? undefined}
          workspaceId={workspaceId}
          onClose={() => setModalTask(undefined)}
        />
      ) : null}
    </div>
  );
}

function TaskGroup({
  title,
  tone,
  tasks,
  onOpen,
}: {
  title: string;
  tone: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
}) {
  return (
    <section className="task-group">
      <div className="group-heading">
        <div>
          <span className={`group-dot ${tone}`} />

          <h2>{title}</h2>

          <small>{tasks.length}</small>
        </div>
      </div>

      {tasks.length ? (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard task={task} onOpen={onOpen} key={task.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CheckCircle2 />

          <p>Nothing here — you’re all caught up.</p>
        </div>
      )}
    </section>
  );
}
