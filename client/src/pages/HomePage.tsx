import { useState, useEffect } from "react";
import type { Task, TaskStatus, TaskPriority, TeamMember } from "../types";
import "./HomePage.css";

type SortOption = "Nearest Deadline" | "Newest";

// Base URL for your backend — one constant, so if the port or domain
// ever changes, you only update it in one place.
const API_URL = "http://localhost:5000";

function HomePage() {
  // --- Real data, now starts empty and gets filled by fetch() ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // --- Loading and error state, now meaningful since a real network call can fail ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Search/filter/sort state, unchanged ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Nearest Deadline");

  // --- Add member form state, unchanged ---
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // useEffect runs code automatically when the component first appears on screen.
  // The empty array [] at the end means "only run this once, not on every re-render."
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both tasks and members at the same time
        const [tasksRes, membersRes] = await Promise.all([
          fetch(`${API_URL}/api/tasks`),
          fetch(`${API_URL}/api/members`),
        ]);

        if (!tasksRes.ok || !membersRes.ok) {
          throw new Error("Failed to load data from the server.");
        }

        const tasksData = await tasksRes.json();
        const membersData = await membersRes.json();

        setTasks(tasksData);
        setMembers(membersData);
      } catch (err) {
        setError("Could not connect to the server. Is it running?");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "Nearest Deadline") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      return Number(b.id) - Number(a.id);
    }
  });

  function getMemberName(memberId: string): string {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : "Unassigned";
  }

  // Now actually calls the real backend instead of just updating local state
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim() === "") return;

    try {
      const res = await fetch(`${API_URL}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail.trim() === "" ? undefined : newEmail,
        }),
      });

      if (!res.ok) throw new Error("Failed to add member.");

      const createdMember = await res.json();
      setMembers([...members, createdMember]); // add the server's response, not our own guess

      setNewName("");
      setNewEmail("");
    } catch (err) {
      setError("Could not add member. Try again.");
    }
  }

  return (
    <div className="homepage">
      <h1>Homepage</h1>

      <div className="controls">
        <label htmlFor="search-input" className="visually-hidden">Search tasks by title</label>
        <input
          id="search-input"
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "All")}>
          <option value="All">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "All")}>
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
          <option value="Nearest Deadline">Sort: Nearest Deadline</option>
          <option value="Newest">Sort: Newest</option>
        </select>
      </div>

      {/* Loading, error, empty, or filled — in that priority order */}
      {isLoading ? (
        <p className="status-message">Loading tasks...</p>
      ) : error ? (
        <p className="status-message" style={{ color: "#e53935" }}>{error}</p>
      ) : sortedTasks.length === 0 ? (
        <p className="status-message">No tasks match your filters.</p>
      ) : (
        <ul className="task-list">
          {sortedTasks.map((task) => (
            <li key={task.id} className="task-card">
              <span className="task-title">{task.title}</span>
              <span className={`task-status status-${task.status.toLowerCase().replace(/ /g, "-")}`}>
                {task.status}
              </span>
              <span className={`task-priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span className="task-due">{task.dueDate}</span>
              <span className="task-assignee">{getMemberName(task.assignedMemberId)}</span>
            </li>
          ))}
        </ul>
      )}

      <h2>Team Members</h2>

      {members.length === 0 ? (
        <p className="status-message">No members yet.</p>
      ) : (
        <ul className="member-list">
          {members.map((member) => (
            <li key={member.id}>
              {member.name}
              {member.email ? ` — ${member.email}` : ""}
            </li>
          ))}
        </ul>
      )}

      <form className="member-form" onSubmit={handleAddMember}>
        <label htmlFor="member-name" className="visually-hidden">Member name</label>
        <input
          id="member-name"
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <label htmlFor="member-email" className="visually-hidden">Member email (optional)</label>
        <input
          id="member-email"
          type="email"
          placeholder="Email (optional)"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button type="submit">Add Member</button>
      </form>
    </div>
  );
}

export default HomePage;