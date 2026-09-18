import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { ApiError, apiRequest } from "../api";
import { BrandLogo } from "../components/BrandLogo";
import CreateWorkspaceForm from "../components/CreateWorkspaceForm";
import { useTheme } from "../themeContext";
import "./SettingsPage.css";

import { signInWithUsername, type Account } from "../auth";
type WorkspaceSummary = {
  id: string;
  name: string;
  members: { id: string; name: string; email: string }[];
};

export function AccountPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [method, setMethod] = useState<"username" | "email">(
    location.pathname === "/account/email" ? "email" : "username",
  );
  const { dark, toggleTheme } = useTheme();
  const [account, setAccount] = useState<Account | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState("");
  useEffect(() => {
    let active = true;
    apiRequest<Account>("/users/me")
      .then(async (user) => {
        const list = await apiRequest<WorkspaceSummary[]>(
          "/users/me/workspaces",
        );
        if (active) {
          setAccount(user);
          setWorkspaces(list);
        }
      })
      .catch((reason) => {
        if (active && !(reason instanceof ApiError && reason.status === 401))
          setError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      const user =
        method === "username"
          ? await signInWithUsername(String(fields.username))
          : await apiRequest<Account>(
              register ? "/auth/register" : "/auth/login",
              { method: "POST", body: JSON.stringify(fields) },
            );
      const returnTo = params.get("returnTo");
      if (returnTo?.startsWith("/workspace/")) {
        navigate(returnTo);
        return;
      }
      setAccount(user);
      setWorkspaces(
        await apiRequest<WorkspaceSummary[]>("/users/me/workspaces"),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const workspace = await apiRequest<{ id: string }>(
        `/invites/${encodeURIComponent(invite.trim())}`,
      );
      const member = await apiRequest(`/workspaces/${workspace.id}/members`, {
        method: "POST",
        body: JSON.stringify({ name: account?.name, email: account?.email }),
      });
      localStorage.setItem(
        `memberIdentity:${workspace.id}`,
        JSON.stringify(member),
      );
      navigate(`/workspace/${workspace.id}/app/today`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to join.");
    } finally {
      setBusy(false);
    }
  }
  function openWorkspace(workspace: WorkspaceSummary) {
    const member = workspace.members.find((item) => item.id === account?.id);
    if (member)
      localStorage.setItem(
        `memberIdentity:${workspace.id}`,
        JSON.stringify(member),
      );
    navigate(`/workspace/${workspace.id}/app/today`);
  }
  return (
    <main className="account-page">
      <header className="account-header">
        <Link to="/" aria-label="NEO home">
          <BrandLogo />
        </Link>
        <button className="secondary" onClick={toggleTheme}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {dark ? "Light" : "Dark"}
        </button>
      </header>
      <div className="account-content">
        {loading ? (
          <p role="status">Loading your account…</p>
        ) : account ? (
          <>
            <div className="account-title">
              <div>
                <p className="settings-eyebrow">YOUR WORKSPACES</p>
                <h1>Welcome, {account.name.split(" ")[0]}.</h1>
                <p>
                  Create a workspace or use an invite code to join your team.
                </p>
              </div>
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await apiRequest("/auth/logout", {
                      method: "POST",
                      body: "{}",
                    });
                    setAccount(null);
                    setWorkspaces([]);
                  } catch {
                    setError("Could not sign out. Try again.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Sign out
              </button>
            </div>
            {workspaces.length > 0 && (
              <section className="account-workspaces">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => openWorkspace(workspace)}
                  >
                    <span className="workspace-dot">{workspace.name[0]}</span>
                    <strong>{workspace.name}</strong>
                    <ArrowRight size={18} />
                  </button>
                ))}
              </section>
            )}
            <div className="account-grid">
              <section className="settings-panel">
                <h2>Create a workspace</h2>
                <CreateWorkspaceForm account={account} />
              </section>
              <section className="settings-panel">
                <h2>Join your team</h2>
                <p>Ask a teammate for the invite code in Settings.</p>
                <form onSubmit={join}>
                  <label className="settings-field">
                    Invite code
                    <input
                      required
                      value={invite}
                      onChange={(event) => setInvite(event.target.value)}
                      placeholder="NCT-…"
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    Join workspace
                  </button>
                </form>
              </section>
            </div>
          </>
        ) : (
          <section className="settings-panel account-form">
            <p className="settings-eyebrow">YOUR TEAM. ONE BOARD.</p>
            <h1>
              {method === "email" && register
                ? "Create your account"
                : "Welcome back"}
            </h1>
            <p>Sign in to manage your profile and workspace preferences.</p>
            <div className="account-tabs" aria-label="Sign-in method">
              <button
                disabled={busy}
                aria-pressed={method === "username"}
                onClick={() => {
                  setMethod("username");
                  setError("");
                }}
              >
                Username
              </button>
              <button
                disabled={busy}
                aria-pressed={method === "email"}
                onClick={() => {
                  setMethod("email");
                  setError("");
                }}
              >
                Email
              </button>
            </div>
            {method === "email" && (
              <div className="account-tabs">
                <button
                  disabled={busy}
                  aria-pressed={!register}
                  onClick={() => {
                    setRegister(false);
                    setError("");
                  }}
                >
                  Sign in
                </button>
                <button
                  disabled={busy}
                  aria-pressed={register}
                  onClick={() => {
                    setRegister(true);
                    setError("");
                  }}
                >
                  Sign up
                </button>
              </div>
            )}
            <form key={`${method}-${register}`} onSubmit={submit}>
              {method === "username" ? (
                <label className="settings-field">
                  Username
                  <input
                    name="username"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]*"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </label>
              ) : (
                <>
                  {register && (
                    <label className="settings-field">
                      Display name
                      <input
                        name="name"
                        required
                        maxLength={80}
                        autoComplete="name"
                      />
                    </label>
                  )}
                  <label className="settings-field">
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                    />
                  </label>
                  <label className="settings-field">
                    Password
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={register ? 12 : undefined}
                      maxLength={128}
                      autoComplete={
                        register ? "new-password" : "current-password"
                      }
                    />
                  </label>
                  {register ? (
                    <p className="settings-note">Use at least 12 characters.</p>
                  ) : (
                    <label className="settings-field">
                      Authenticator code <small>(if enabled)</small>
                      <input
                        name="code"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        autoComplete="one-time-code"
                      />
                    </label>
                  )}
                </>
              )}
              <button className="primary" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : method === "email" && register
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
          </section>
        )}
        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
