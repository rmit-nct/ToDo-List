import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import type { Task, TaskStatus, TaskPriority } from "../types";
import { useTasks } from "../taskStoreContext";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import TaskStatusChart from "../components/TaskStatusChart";
import "./HomePage.css";

type SortOption = "Nearest Deadline" | "Newest";

function HomePage() {
  const { workspaceId } = useParams();
  const { tasks } = useTasks();

  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Nearest Deadline");

  const identity = workspaceId
    ? localStorage.getItem(`memberIdentity:${workspaceId}`)
    : null;

  let memberName = "there";
  let memberId: string | null = null;

  if (identity) {
    try {
      const parsedIdentity = JSON.parse(identity);
      if (parsedIdentity.name) memberName = parsedIdentity.name;
      if (parsedIdentity.id) memberId = parsedIdentity.id;
    } catch {
      memberName = "there";
    }
  }

  const myTasks = tasks.filter(
    (task) =>
      task.workspaceId === workspaceId &&
      (task.assignedMemberId === memberId || task.assignee?.id === memberId)
  );

  const filteredTasks = useMemo(
    () =>
      myTasks.filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || task.status === statusFilter;
        const matchesPriority =
          priorityFilter === "All" ||
          task.priority.toLowerCase() === priorityFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [myTasks, search, statusFilter, priorityFilter]
  );

  const sortedTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) => {
        if (sortBy === "Nearest Deadline") {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }),
    [filteredTasks, sortBy]
  );

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p>WORKSPACE OVERVIEW</p>
          <h1>Welcome back, {memberName}</h1>
          <span>Here's what's on your plate in this workspace.</span>
        </div>
      </div>

      <div className="task-status-charts-row">
        <TaskStatusChart title="My Progress" tasks={myTasks} />
        <TaskStatusChart title="Workspace Progress" tasks={tasks} />
      </div>

      <section className="filters" aria-label="Task filters">
        <div className="search">
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my tasks..."
            aria-label="Search tasks by title"
          />
        </div>

        <span className="filter-label">
          <SlidersHorizontal />
          Filter
        </span>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "All")}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "All")}
          aria-label="Filter by priority"
        >
          <option value="All">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <span className="filter-label sort-label">
          <ArrowUpDown />
          Sort
        </span>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label="Sort tasks"
        >
          <option value="Nearest Deadline">Nearest deadline</option>
          <option value="Newest">Newest</option>
        </select>
      </section>

      <section className="task-group" aria-label="My tasks">
        <div className="group-heading">
          <div>
            <span className="group-dot blue" />
            <h2>My Tasks</h2>
            <small>{sortedTasks.length}</small>
          </div>
        </div>

        {!memberId ? (
          <p className="status-message">
            We couldn't find your identity in this workspace. Try rejoining to see your tasks.
          </p>
        ) : sortedTasks.length === 0 ? (
          <p className="status-message">No tasks assigned to you match your filters.</p>
        ) : (
          <div className="task-list">
            {sortedTasks.map((task) => (
              <TaskCard task={task} onOpen={setModalTask} key={task.id} />
            ))}
          </div>
        )}
      </section>

      {modalTask !== undefined ? (
        <TaskModal
          task={modalTask ?? undefined}
          workspaceId={workspaceId ?? ""}
          onClose={() => setModalTask(undefined)}
        />
      ) : null}
    </div>
  );
}

export default HomePage;