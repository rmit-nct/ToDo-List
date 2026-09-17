import { useState, type FormEvent } from "react";
import { signOut, useSession } from "next-auth/react";
import { api } from "../api";
import { useWorkspace } from "../workspaceContext";
export function SettingsPage() {
  const { data, update } = useSession();
  const { workspace, reload } = useWorkspace();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>, target: string) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const values = Object.fromEntries(new FormData(form));
      const result = await api<{ signInAgain?: boolean }>(target, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      if (result.signInAgain) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
      await update();
      await reload();
      setMessage("Changes saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function rotate() {
    if (!confirm("Replace the invite link? Previous links will stop working."))
      return;
    setBusy(true);
    setError("");
    try {
      await api(`/workspaces/${workspace.id}`, {
        method: "PATCH",
        body: JSON.stringify({ rotateInvite: true }),
      });
      await reload();
      setMessage("Invite link replaced.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page settings-page">
      <div className="page-heading">
        <div>
          <p>MAKE YOURSELF AT HOME</p>
          <h1>Settings</h1>
          <span>Your profile, preferences, and workspace.</span>
        </div>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="request-error" role="alert">
          {error}
        </p>
      )}
      <div className="settings-grid">
        <form className="panel" onSubmit={(e) => save(e, "/account")}>
          <h2>Your profile</h2>
          <p className="muted">
            Your name appears on the tasks you create and own.
          </p>
          <label>
            Display name
            <input
              name="name"
              defaultValue={data?.user?.name}
              required
              maxLength={80}
            />
          </label>
          <label>
            {data?.user?.username ? "Username" : "Email address"}
            <input
              value={data?.user?.username ?? data?.user?.email ?? ""}
              readOnly
            />
          </label>
          <label>
            Appearance
            <select name="theme" defaultValue={data?.user?.theme ?? "system"}>
              <option value="system">Use device setting</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <button className="primary" disabled={busy}>
            Save profile
          </button>
        </form>
        {!data?.user?.username && (
          <form className="panel" onSubmit={(e) => save(e, "/account")}>
            <h2>Password</h2>
            <p className="muted">
              Changing your password signs out all active sessions.
            </p>
            <label>
              Current password
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                minLength={12}
                maxLength={72}
                required
              />
            </label>
            <label>
              New password
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={72}
                required
              />
            </label>
            <button className="secondary" disabled={busy}>
              Change password
            </button>
          </form>
        )}
        {workspace.ownerId === data?.user?.id && (
          <>
            <form
              className="panel"
              onSubmit={(e) => save(e, `/workspaces/${workspace.id}`)}
            >
              <h2>Workspace</h2>
              <p className="muted">Give your team’s shared space a name.</p>
              <label>
                Workspace name
                <input
                  name="name"
                  defaultValue={workspace.name}
                  required
                  maxLength={80}
                />
              </label>
              <button className="primary" disabled={busy}>
                Save workspace
              </button>
            </form>
            <section className="panel">
              <h2>Invite your team</h2>
              <p className="muted">
                Share this private link with people you want to join. They’ll
                need to sign in first.
              </p>
              <label>
                Invite link
                <input
                  readOnly
                  value={`${window.location.origin}/join/${workspace.inviteCode}`}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/join/${workspace.inviteCode}`,
                    );
                    setMessage("Invite link copied.");
                  } catch {
                    setError("Select and copy the invite link above.");
                  }
                }}
              >
                Copy invite link
              </button>
              <button className="text-button" disabled={busy} onClick={rotate}>
                Replace invite link
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
