import { useState } from "react";
import { mockTasks, mockMembers } from "../mockData";
import type { TaskStatus, TaskPriority, TeamMember } from "../types";
import "./HomePage.css"; // our new stylesheet for this page

// Sort options — same "only these exact words allowed" pattern as TaskStatus
type SortOption = "Nearest Deadline" | "Newest";

function HomePage() {
  // --- State for search/filter/sort ---
  const [search, setSearch] = useState(""); // what's typed in the search box
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Nearest Deadline");

  // --- State for team members ---
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // --- Fake loading state ---
  // Right now we have no real API, so this is always false.
  // Later, when we fetch real tasks, we'll set this to true while waiting
  // for the response, then false once data arrives.
  const [isLoading] = useState(false);

  // Step 1: filter the full task list down based on search + dropdowns
  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    // task only survives if it matches ALL three conditions
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Step 2: sort the filtered list (doesn't touch the original array)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "Nearest Deadline") {
      // smaller number (sooner date) comes first
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      // higher id (created more recently) comes first
      return Number(b.id) - Number(a.id);
    }
  });

  // Runs when the "Add Member" form is submitted
  function handleAddMember(e: React.FormEvent) {
    e.preventDefault(); // stop the page from reloading (default form behavior)

    if (newName.trim() === "") return; // ignore empty/blank names

    const newMember: TeamMember = {
      id: crypto.randomUUID(), // random unique id, since we have no DB yet
      name: newName,
      email: newEmail.trim() === "" ? undefined : newEmail, // omit if blank
    };

    setMembers([...members, newMember]); // add to the list (never mutate directly)
    setNewName("");   // clear the form
    setNewEmail("");
  }
  
function getMemberName(memberId: string): string {
  const member = members.find((m) => m.id === memberId);
  return member ? member.name : "Unassigned";
}
  return (
    <div className="homepage">
      <h1>Homepage</h1>

      {/* --- Search + Filter + Sort controls --- */}
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

      {/* --- Task list: loading, empty, or filled --- */}
      {isLoading ? (
        <p className="status-message">Loading tasks...</p>
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

      {/* --- Team Members section --- */}
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