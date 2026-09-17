import { Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTasks } from "../taskStoreContext";
import { useWorkspace } from "../workspaceContext";
import { useWorkspaceMembers } from "../useWorkspaceMembers";
import { dateKey } from "../planning";
export function TeamPage() {
  const { workspace } = useWorkspace();
  const { tasks } = useTasks();
  const { workspaceMembers, error } = useWorkspaceMembers(workspace.id);
  const today = dateKey(new Date());
  const open = tasks.filter((t) => t.status !== "done");
  const unassigned = open.filter((t) => !t.assignee?.id);
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">BETTER TOGETHER</p>
          <h1>Team workload</h1>
          <span>Share the work. Make space for everyone to contribute.</span>
        </div>
        <Link className="secondary" to="../settings">
          <Users size={18} /> Team settings
        </Link>
      </div>
      <div className="insight-grid">
        <div>
          <span>Team members</span>
          <strong>{workspaceMembers.length}</strong>
        </div>
        <div>
          <span>Open tasks</span>
          <strong>{open.length}</strong>
        </div>
        <div>
          <span>Unassigned</span>
          <strong>{unassigned.length}</strong>
        </div>
        <div>
          <span>Overdue</span>
          <strong>
            {open.filter((t) => t.dueDate.slice(0, 10) < today).length}
          </strong>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <section className="workload-list" aria-label="Member workloads">
        {workspaceMembers.map((member) => {
          const owned = tasks.filter((t) => t.assignee?.id === member.id);
          const remaining = owned.filter((t) => t.status !== "done");
          const done = owned.length - remaining.length;
          const overdue = remaining.filter(
            (t) => t.dueDate.slice(0, 10) < today,
          ).length;
          return (
            <article className="workload-row" key={member.id}>
              <span className="member-monogram">
                {member.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="workload-person">
                <h2>{member.name}</h2>
                <span>
                  {remaining.length} open · {done} completed
                  {overdue ? ` · ${overdue} overdue` : ""}
                </span>
                <progress
                  max={owned.length || 1}
                  value={done}
                  aria-label={`${member.name}: ${done} of ${owned.length} completed`}
                />
              </div>
              <Link
                to={`../board?assignee=${encodeURIComponent(member.id)}`}
                aria-label={`View tasks for ${member.name}`}
              >
                View tasks <ArrowUpRight size={16} />
              </Link>
            </article>
          );
        })}
      </section>
      {unassigned.length > 0 && (
        <div className="assignment-callout">
          <div>
            <h2>Give the next step an owner.</h2>
            <p>
              {unassigned.length} open{" "}
              {unassigned.length === 1 ? "task is" : "tasks are"} waiting for
              someone to take the lead.
            </p>
          </div>
          <Link className="secondary" to="../board?assignee=unassigned">
            Review unassigned <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
