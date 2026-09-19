import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowRight, LoaderCircle, Moon, Sun } from "lucide-react";
import { ApiError, apiRequest, readCache } from "../api";
import { BrandLogo } from "../components/BrandLogo";
import CreateWorkspaceForm from "../components/CreateWorkspaceForm";
import { useTheme } from "../themeContext";
import { LandingPromo } from "../components/LandingPromo";
import "./SettingsPage.css";
import "./AccountWelcome.css";

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
  const [access, setAccess] = useState<"username" | "email" | "signup">(
    location.pathname === "/account/email" ? "email" : "username",
  );
  const { dark, toggleTheme } = useTheme();
  const [account, setAccount] = useState<Account | null>(() => readCache.peek<Account>("/users/me") || null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(() => readCache.peek<WorkspaceSummary[]>("/users/me/workspaces") || []);
  const [loading, setLoading] = useState(!readCache.peek("/users/me"));
  const method = access === "username" ? "username" : "email";
  const register = access === "signup";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState("");
  const [workspacesLoading, setWorkspacesLoading] = useState(!readCache.peek("/users/me/workspaces"));
  const [workspaceError, setWorkspaceError] = useState("");
  const [openingWorkspace, setOpeningWorkspace] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const loadGeneration = useRef(0);
  useEffect(() => {
    let active = true;
    const generation = ++loadGeneration.current;
    const isCurrent = () => active && generation === loadGeneration.current;
    apiRequest<Account>("/users/me")
      .then(user => { if (isCurrent()) setAccount(user); })
      .catch(reason => {
        if (isCurrent()) { setAccount(null); setWorkspaces([]); if (!(reason instanceof ApiError && reason.status === 401)) setError(reason.message); }
      })
      .finally(() => { if (isCurrent()) setLoading(false); });
    apiRequest<WorkspaceSummary[]>("/users/me/workspaces")
      .then(list => { if (isCurrent()) { setWorkspaces(list); setWorkspaceError(""); } })
      .catch(reason => { if (isCurrent() && !(reason instanceof ApiError && reason.status === 401)) setWorkspaceError(reason.message); })
      .finally(() => { if (isCurrent()) setWorkspacesLoading(false); });
    return () => {
      active = false;
    };
  }, [retry]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    loadGeneration.current++;
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
      setWorkspacesLoading(true);
      setWorkspaceError("");
      setAccount(user);
      setWorkspaces(
        await apiRequest<WorkspaceSummary[]>("/users/me/workspaces").catch(reason => { setWorkspaceError(reason.message); return []; }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
      setWorkspacesLoading(false);
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
  async function openWorkspace(workspace: WorkspaceSummary) {
    if (openingWorkspace) return;
    setOpeningWorkspace(workspace.id);
    setWorkspaceError("");
    try {
      await apiRequest(`/workspaces/${encodeURIComponent(workspace.id)}`);
      const member = workspace.members.find(item => item.id === account?.id);
      if (member) {
        try { localStorage.setItem(`memberIdentity:${workspace.id}`, JSON.stringify(member)); } catch { /* The server session is authoritative. */ }
      }
      navigate(`/workspace/${workspace.id}/app/today`);
    } catch (reason) {
      setWorkspaceError(reason instanceof Error ? reason.message : "Unable to open workspace. Please try again.");
      setOpeningWorkspace(null);
    }
  }
  return (
    <main className={`account-page${!account ? " account-welcome" : ""}`}>
      {!account && <LandingPromo />}
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
          <LoadingSkeleton variant="account" label="Loading your account" />
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
                disabled={busy || !!openingWorkspace}
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
            {workspacesLoading ? <LoadingSkeleton variant="list" label="Loading your workspaces" /> : workspaces.length > 0 && (
              <section className="account-workspaces">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    disabled={!!openingWorkspace}
                    aria-busy={openingWorkspace === workspace.id}
                    onClick={() => openWorkspace(workspace)}
                  >
                    <span className="workspace-dot" aria-hidden="true">{workspace.name[0]}</span>
                    <strong>{workspace.name}</strong>
                    {openingWorkspace === workspace.id ? <span className="workspace-opening" role="status"><LoaderCircle size={16} aria-hidden="true" />Opening…</span> : <ArrowRight size={18} />}
                  </button>
                ))}
              </section>
            )}
            {workspaceError && <div className="settings-error" role="alert">{workspaceError}<button type="button" className="secondary" onClick={() => { readCache.clear(); setWorkspacesLoading(true); setWorkspaceError(""); setRetry(value => value + 1); }}>Retry</button></div>}
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
                    {busy ? "Joining…" : "Join workspace"}
                  </button>
                </form>
              </section>
            </div>
          </>
        ) : (
          <section className="settings-panel account-form">
            <p className="settings-eyebrow">YOUR TEAM. ONE BOARD.</p>
            <h2>
              {method === "email" && register
                ? "Create your account"
                : "Welcome back"}
            </h2>
            <p className="account-intro">
              {register ? "Create an email account to save your work and collaborate." : method === "email" ? "Sign in with your email and password to continue." : "Use your username to return to your team’s workspaces."}
            </p>
            <div className="account-tabs" role="group" aria-label="Account access">
              {([
                { value: "username", label: "Username" },
                { value: "email", label: "Email" },
                { value: "signup", label: "Sign up" },
              ] as const).map(option => <button
                key={option.value}
                type="button"
                disabled={busy}
                aria-pressed={access === option.value}
                aria-controls="account-access-form"
                onClick={() => { setAccess(option.value); setError(""); }}
              >{option.label}</button>)}
            </div>
            <form id="account-access-form" key={access} onSubmit={submit}>
              {method === "username" ? (
                <label className="settings-field">
                  Username
                  <input
                    name="username"
                    placeholder="e.g. alex.chen"
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
                        placeholder="Your name"
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
                      placeholder="you@example.com"
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
                      placeholder={register ? "Create a password (12+ characters)" : "Enter your password"}
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
                      <span>Authenticator code <small>(if enabled)</small></span>
                      <input
                        name="code"
                        placeholder="6-digit code"
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
