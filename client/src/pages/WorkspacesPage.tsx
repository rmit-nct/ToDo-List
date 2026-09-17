import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession, signOut } from "next-auth/react";
import { ArrowRight, Plus, LogOut, Layers3 } from "lucide-react";
import { api } from "../api";
import { BrandLogo } from "../components/BrandLogo";
type Workspace = { id: string; name: string };
export function WorkspacesPage() {
  const { code } = useParams();
  const { data } = useSession();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Workspace[]>("/workspaces")
      .then(setWorkspaces)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>, join: boolean) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const raw = String(values.code || "");
      const result = await api<Workspace>(
        join ? "/workspaces/join" : "/workspaces",
        {
          method: "POST",
          body: JSON.stringify(
            join
              ? {
                  code: raw.includes("/join/")
                    ? raw.split("/join/").pop()?.split(/[?#]/)[0]
                    : raw,
                }
              : values,
          ),
        },
      );
      navigate(`/workspace/${result.id}/app/today`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="workspace-hub">
      <header className="hub-header">
        <BrandLogo tone="on-light" />
        <button
          className="secondary"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut size={16} /> Sign out
        </button>
      </header>
      <main className="hub-main">
        <span className="eyebrow">A SPACE FOR YOUR TEAM</span>
        <h1>Hello, {data?.user?.name.split(" ")[0]}.</h1>
        <p className="muted">
          Pick up where you left off, or start something together.
        </p>
        {error && (
          <p role="alert" className="request-error">
            {error}
          </p>
        )}
        <div className="workspace-grid">
          {loading ? (
            <p role="status">Loading workspaces…</p>
          ) : (
            workspaces.map((w) => (
              <button
                key={w.id}
                className="workspace-card"
                onClick={() => navigate(`/workspace/${w.id}/app/today`)}
              >
                <span className="workspace-icon">
                  <Layers3 />
                </span>
                <strong>{w.name}</strong>
                <span>
                  Open workspace <ArrowRight size={18} />
                </span>
              </button>
            ))
          )}
        </div>
        <div className="hub-forms">
          <form className="panel" onSubmit={(e) => submit(e, false)}>
            <Plus className="panel-icon" />
            <h2>Start a workspace</h2>
            <p className="muted">A shared home for your team’s tasks.</p>
            <label>
              Workspace name
              <input
                name="name"
                required
                maxLength={80}
                placeholder="e.g. Web Dev Team"
              />
            </label>
            <button className="primary" disabled={busy}>
              Create workspace <ArrowRight />
            </button>
          </form>
          <form className="panel" onSubmit={(e) => submit(e, true)}>
            <Layers3 className="panel-icon" />
            <h2>Join your team</h2>
            <p className="muted">
              Use the invite shared by your workspace owner.
            </p>
            <label>
              Invite link or code
              <input
                name="code"
                required
                defaultValue={code ?? ""}
                placeholder="Paste your invite here"
              />
            </label>
            <button className="secondary" disabled={busy}>
              Join workspace <ArrowRight />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
