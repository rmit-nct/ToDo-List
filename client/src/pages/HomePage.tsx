import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TeamMember,
} from "../types";
import { API_BASE_URL } from "../api";
import { useTasks } from "../taskStoreContext";
import "./HomePage.css";

type SortOption = "Nearest Deadline" | "Newest";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function HomePage() {
  const { workspaceId } = useParams();
  const { tasks } = useTasks();

  // --- Real data, now starts empty and gets filled by fetch() ---
  const [members, setMembers] = useState<TeamMember[]>([]);

  // --- Loading and error state, now meaningful since a real network call can fail ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Search/filter/sort state, unchanged ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] =
    useState<TaskPriority | "All">("All");
  const [sortBy, setSortBy] =
    useState<SortOption>("Nearest Deadline");

  // --- Add member form state, unchanged ---
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // useEffect runs code automatically when the component first appears on screen.
  // The empty array [] at the end means "only run this once, not on every re-render."
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

          throw new Error(
            errorData.error || "Failed to load workspace."
          );
        }

        const workspaceData = await workspaceRes.json();

        setMembers(workspaceData.members ?? []);
      } catch (err) {
        console.error("HomePage load error:", err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load workspace.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [workspaceId]);

  const normalizeStatus = (status: TaskStatus) => {
    return status;
  };

  const normalizePriority = (
    priority: TaskPriority
  ) => {
    return priority.toLowerCase();
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      normalizeStatus(task.status) ===
        normalizeStatus(statusFilter);

    const matchesPriority =
      priorityFilter === "All" ||
      normalizePriority(task.priority) ===
        normalizePriority(priorityFilter);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  const sortedTasks = [...filteredTasks].sort(
    (a, b) => {
      if (sortBy === "Nearest Deadline") {
        return (
          new Date(a.dueDate).getTime() -
          new Date(b.dueDate).getTime()
        );
      }

      return (
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
      );
    }
  );

  function getTaskMemberName(
    task: Task
  ): string {
    if (task.assignee?.name) {
      return task.assignee.name;
    }

    if (task.assignedMemberId) {
      const member = members.find(
        (member) =>
          member.id === task.assignedMemberId
      );

      return member
        ? member.name
        : "Unassigned";
    }

    return "Unassigned";
  }

  // Now actually calls the real backend instead of just updating local state
  async function handleAddMember(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      newName.trim() === "" ||
      !workspaceId
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/workspaces/${workspaceId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: newName,
            email:
              newEmail.trim() === ""
                ? undefined
                : newEmail,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to add member."
        );
      }

      const createdMember =
        await res.json();

      setMembers([
        ...members,
        createdMember,
      ]);

      setNewName("");
      setNewEmail("");
    } catch {
      setError(
        "Could not add member. Try again."
      );
    }
  }

  return (
    <div className="homepage">
      <h1>Homepage</h1>

      <div className="controls">
        <label
          htmlFor="search-input"
          className="visually-hidden"
        >
          Search tasks by title
        </label>

        <input
          id="search-input"
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as
                | TaskStatus
                | "All"
            )
          }
        >
          <option value="All">
            All Statuses
          </option>
          <option value="todo">
            To Do
          </option>
          <option value="in-progress">
            In Progress
          </option>
          <option value="done">
            Done
          </option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(
              e.target.value as
                | TaskPriority
                | "All"
            )
          }
        >
          <option value="All">
            All Priorities
          </option>
          <option value="low">
            Low
          </option>
          <option value="medium">
            Medium
          </option>
          <option value="high">
            High
          </option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value as SortOption
            )
          }
        >
          <option value="Nearest Deadline">
            Sort: Nearest Deadline
          </option>
          <option value="Newest">
            Sort: Newest
          </option>
        </select>
      </div>

      {/* Loading, error, empty, or filled — in that priority order */}
      {isLoading ? (
        <p className="status-message">
          Loading tasks...
        </p>
      ) : error ? (
        <p
          className="status-message"
          style={{ color: "#e53935" }}
        >
          {error}
        </p>
      ) : sortedTasks.length === 0 ? (
        <p className="status-message">
          No tasks match your filters.
        </p>
      ) : (
        <ul className="task-list">
          {sortedTasks.map((task) => (
            <li
              key={task.id}
              className="task-card"
            >
              <span className="task-title">
                {task.title}
              </span>

              <span
                className={`task-status status-${normalizeStatus(
                  task.status
                )}`}
              >
                {task.status}
              </span>

              <span
                className={`task-priority priority-${normalizePriority(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>

              <span className="task-due">
                {formatDate(
                  task.dueDate
                )}
              </span>

              <span className="task-assignee">
                {getTaskMemberName(
                  task
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2>Team Members</h2>

      {members.length === 0 ? (
        <p className="status-message">
          No members yet.
        </p>
      ) : (
        <ul className="member-list">
          {members.map(
            (member) => (
              <li key={member.id}>
                {member.name}
                {member.email
                  ? ` — ${member.email}`
                  : ""}
              </li>
            )
          )}
        </ul>
      )}

      <form
        className="member-form"
        onSubmit={handleAddMember}
      >
        <label
          htmlFor="member-name"
          className="visually-hidden"
        >
          Member name
        </label>

        <input
          id="member-name"
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) =>
            setNewName(
              e.target.value
            )
          }
        />

        <label
          htmlFor="member-email"
          className="visually-hidden"
        >
          Member email (optional)
        </label>

        <input
          id="member-email"
          type="email"
          placeholder="Email (optional)"
          value={newEmail}
          onChange={(e) =>
            setNewEmail(
              e.target.value
            )
          }
        />

        <button type="submit">
          Add Member
        </button>
      </form>
    </div>
  );
}

export default HomePage;
