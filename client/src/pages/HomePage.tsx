import TaskStatusChart from "../components/TaskStatusChart";
import { WorkspaceActions } from "../components/WorkspaceActions";
import { LoadingSkeleton, SkeletonLine } from "../components/LoadingSkeleton";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Users, Search } from "lucide-react";
import { useTasks } from "../taskStoreContext";
import { useWorkspaceMembers } from "../useWorkspaceMembers";
import { TaskModal } from "../components/TaskModal";
import { apiRequest } from "../api";
import type { Task } from "../types";
import "./HomePage.css";

const statuses: Record<string, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

export default function HomePage() {
  const { workspaceId = "" } = useParams();
  const { tasks, isLoading, error } = useTasks();
  const {
    workspaceMembers,
    workspaceInfo,
    currentMember,
    error: memberError,
    refresh,
  } = useWorkspaceMembers(workspaceId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("due");
  const [selected, setSelected] = useState<Task | null | undefined>();
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberFailure, setMemberFailure] = useState("");
  const visible = tasks
    .filter(
      (task) =>
        task.title.toLowerCase().includes(search.toLowerCase()) &&
        (status === "all" || status === task.status) &&
        (priority === "all" || priority === task.priority) &&
        (assignee === "all" ||
          (task.assignedMemberId || task.assignee?.id || "") === assignee),
    )
    .sort((a, b) =>
      sort === "due"
        ? a.dueDate.localeCompare(b.dueDate)
        : (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  const filtered =
    search || status !== "all" || assignee !== "all" || priority !== "all";
  return (
    <div className="workspace-overview">
      <header className="overview-heading">
        <div>
          <p className="overview-eyebrow">WORKSPACE OVERVIEW</p>
          <h1>Team tasks</h1>
          <p>Plan the work. Give every task a clear owner.</p>
        </div>
        <WorkspaceActions createDisabled={!currentMember} onCreate={() => setSelected(null)} />
      </header>
      {isLoading ? <div className="overview-summary" aria-hidden="true"><SkeletonLine width="120px" /><SkeletonLine width="100px" /><SkeletonLine width="100px" /></div> : <div className="overview-summary">
        <span>
          <strong>
            {tasks.filter((task) => task.status !== "done").length}
          </strong>{" "}
          open tasks
        </span>
        <span>
          <strong>
            {
              tasks.filter(
                (task) => !task.assignedMemberId && !task.assignee?.id,
              ).length
            }
          </strong>{" "}
          unassigned
        </span>
        <span>
          <Users size={16} /> {workspaceMembers.length} teammates
        </span>
        <Link to={`/workspace/${workspaceId}/app/settings`}>
          Invite teammates
        </Link>
      </div>}

      {!isLoading && <div className="task-status-charts-row">
        <TaskStatusChart title="My Progress" tasks={tasks.filter(task => (task.assignedMemberId || task.assignee?.id) === currentMember?.id)} />
        <TaskStatusChart title="Workspace Progress" tasks={tasks} />
      </div>}
      <section className="overview-filters" aria-label="Filter team tasks">
        <label className="overview-search">
          <Search size={18} />
          <input
            aria-label="Search tasks"
            placeholder="Search tasks…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter by assignee"
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
        >
          <option value="all">All assignees</option>
          <option value="">Unassigned</option>
          {workspaceMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
              {member.id === currentMember?.id ? " (you)" : ""}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="all">All priorities</option>
          {["low", "medium", "high"].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort tasks"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="due">Due date</option>
          <option value="new">Newest first</option>
        </select>
      </section>
      {isLoading ? (
        <LoadingSkeleton label="Loading tasks" />
      ) : (error && tasks.length === 0) || memberError ? (
        <div role="alert">
          <p>{error || memberError}</p>
          <button
            className="secondary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="overview-empty">
          <h2>
            {filtered ? "No matching tasks" : "Your next project starts here"}
          </h2>
          <p>
            {filtered
              ? "Try another assignee or clear the filters to see your team’s work."
              : "Create your first task, then assign it to yourself or a teammate."}
          </p>
          {filtered ? (
            <button
              className="secondary"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setAssignee("all");
                setPriority("all");
              }}
            >
              Clear filters
            </button>
          ) : (
            <button
              className="primary"
              disabled={!currentMember}
              onClick={() => setSelected(null)}
            >
              Create first task
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="overview-result-count" role="status">
            {visible.length} of {tasks.length} tasks
          </p>
          <ul className="overview-task-list">
            {visible.map((task) => {
              const member = workspaceMembers.find(
                (item) =>
                  item.id === (task.assignedMemberId || task.assignee?.id),
              );
              const name = member?.name || task.assignee?.name || "Unassigned";
              return (
                <li key={task.id}>
                  <button
                    className="overview-task"
                    aria-label={`Edit ${task.title}`}
                    onClick={() => setSelected(task)}
                  >
                    <span className={`overview-status-dot ${task.status}`} />
                    <span className="overview-task-title">
                      <strong>{task.title}</strong>
                      <small>{statuses[task.status]}</small>
                    </span>
                    <span className={`priority ${task.priority}`}>
                      {task.priority}
                    </span>
                    <span className="overview-assignee">
                      <span className="overview-initials" aria-hidden="true">
                        {member?.initials || "—"}
                      </span>
                      {name}
                    </span>
                    <time dateTime={task.dueDate}>
                      {new Date(
                        task.dueDate.slice(0, 10) + "T12:00:00",
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {!workspaceInfo.ownerId && currentMember && (
        <form
          className="overview-legacy-members"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fields = Object.fromEntries(new FormData(form));
            setMemberBusy(true);
            setMemberFailure("");
            try {
              await apiRequest(`/workspaces/${workspaceId}/members`, {
                method: "POST",
                body: JSON.stringify(fields),
              });
              form.reset();
              refresh();
            } catch (reason) {
              setMemberFailure(
                reason instanceof Error
                  ? reason.message
                  : "Unable to add member.",
              );
            } finally {
              setMemberBusy(false);
            }
          }}
        >
          <h2>Add a workspace member</h2>
          <label>
            Name
            <input name="name" placeholder="Teammate’s name" required maxLength={80} />
          </label>
          <label>
            Email (optional)
            <input name="email" placeholder="teammate@example.com" type="email" />
          </label>
          <button className="secondary" disabled={memberBusy}>
            Add member
          </button>
          {memberFailure && <p role="alert">{memberFailure}</p>}
        </form>
      )}
      {selected !== undefined && (
        <TaskModal
          task={selected || undefined}
          workspaceId={workspaceId}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}
