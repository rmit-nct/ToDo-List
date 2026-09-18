import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import type { Task, TaskStatus, TaskPriority, TeamMember } from "../types";
import { API_BASE_URL } from "../api";
import { useTasks } from "../taskStoreContext";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import "./HomePage.css";

type SortOption = "Nearest Deadline" | "Newest";

function HomePage() {
  const { workspaceId } = useParams();
  const { tasks } = useTasks();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Nearest Deadline");

  const identity = workspaceId
    ? localStorage.getItem(`memberIdentity:${workspaceId}`)
    : null;

  let memberName = "there";

  if (identity) {
    try {
      const parsedIdentity = JSON.parse(identity);
      if (parsedIdentity.name) {
        memberName = parsedIdentity.name;
      }
    } catch {
      memberName = "there";
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setError("Workspace ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const workspaceRes = await fetch(
          `${API_BASE_URL}/api/workspaces/${workspaceId}`
        );

        if (!workspaceRes.ok) {
          const errorData = await workspaceRes.json();
          throw new Error(errorData.error || "Failed to load workspace.");
        }

        const workspaceData = await workspaceRes.json();
        setMembers(workspaceData.members ?? []);
      } catch (err) {
        console.error("HomePage load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load workspace.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [workspaceId]);

  const workspaceTasks = tasks.filter((task) => task.workspaceId === workspaceId);

  const filteredTasks = useMemo(
    () =>
      workspaceTasks.filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || task.status === statusFilter;
        const matchesPriority =
          priorityFilter === "All" ||
          task.priority.toLowerCase() === priorityFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [workspaceTasks, search, statusFilter, priorityFilter]
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

  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p>WORKSPACE OVERVIEW</p>
          <h1>Welcome back, {memberName}</h1>
          <span>Here's everything happening in this workspace.</span>
        </div>
      </div>

      <section className="filters" aria-label="Task filters">
        <div className="search">
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
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

        <span className="filter-label">
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

      {isLoading ? (
        <p className="status-message">Loading tasks...</p>
      ) : error ? (
        <p className="status-message" style={{ color: "#e53935" }}>
          {error}
        </p>
      ) : sortedTasks.length === 0 ? (
        <p className="status-message">No tasks match your filters.</p>
      ) : (
        <div className="task-list">
          {sortedTasks.map((task) => (
            <TaskCard task={task} onOpen={setModalTask} key={task.id} />
          ))}
        </div>
      )}

      <section className="task-group" aria-label="Team members">
        <div className="group-heading">
          <div>
            <span className="group-dot blue" />
            <h2>Team Members</h2>
            <small>{members.length}</small>
          </div>
        </div>

        {members.length === 0 ? (
          <p className="status-message">No members yet.</p>
        ) : (
          <div className="member-grid">
            {members.map((member) => (
              <div className="member-chip" key={member.id}>
                <span className="avatar">{initials(member.name)}</span>
                <div>
                  <p className="member-name">{member.name}</p>
                  {member.email ? (
                    <p className="member-email">{member.email}</p>
                  ) : null}
                </div>
              </div>
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