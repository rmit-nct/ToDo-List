import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, CheckCircle2 } from "lucide-react";
import { useTasks } from "../taskStoreContext";
import { useWorkspace } from "../workspaceContext";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import type { Task } from "../types";
export default function HomePage({ mine = false }: { mine?: boolean }) {
  const { tasks, isLoading, error } = useTasks();
  const { workspace } = useWorkspace();
  const { data } = useSession();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("due");
  const [modal, setModal] = useState<Task | null | undefined>();
  const visible = tasks
    .filter(
      (t) =>
        (!mine || t.assignedMemberId === data?.user?.id) &&
        t.title.toLowerCase().includes(query.toLowerCase()) &&
        (status === "all" || t.status === status) &&
        (priority === "all" || t.priority === priority),
    )
    .sort((a, b) =>
      sort === "due"
        ? a.dueDate.localeCompare(b.dueDate)
        : (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p>{workspace.name}</p>
          <h1>{mine ? "My tasks" : "A little clarity. A lot of progress."}</h1>
          <span>
            {mine
              ? "Your responsibilities, all in one place."
              : "Everything your team is working on, together."}
          </span>
        </div>
        <button className="primary" onClick={() => setModal(null)}>
          <Plus /> New task
        </button>
      </div>
      <section className="filters" aria-label="Task filters">
        <div className="search">
          <Search />
          <input
            aria-label="Search tasks"
            placeholder="Find a task…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select
          aria-label="Filter by priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          aria-label="Sort tasks"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="due">Nearest deadline</option>
          <option value="new">Newest first</option>
        </select>
      </section>
      <div className="section-heading">
        <h2>{mine ? "Assigned to you" : "All tasks"}</h2>
        <span>{visible.length} tasks</span>
      </div>
      {visible.length ? (
        <div className="overview-grid">
          {visible.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={setModal} />
          ))}
        </div>
      ) : !isLoading && !error ? (
        <div className="empty-state roomy">
          <CheckCircle2 />
          <h2>
            {query || status !== "all" || priority !== "all"
              ? "No matching tasks"
              : "A fresh start"}
          </h2>
          <p>
            {mine
              ? "Tasks assigned to you will appear here."
              : "Create a task to turn your next idea into action."}
          </p>
          <button className="secondary" onClick={() => setModal(null)}>
            Create a task
          </button>
        </div>
      ) : null}
      {modal !== undefined && (
        <TaskModal
          task={modal ?? undefined}
          workspaceId={workspace.id}
          onClose={() => setModal(undefined)}
        />
      )}
    </div>
  );
}
