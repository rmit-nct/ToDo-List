import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarRange,
  Users,
  ArrowUpRight,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  Sun,
  UserRoundCheck,
  X,
  LogOut,
  ArrowLeft,
  Link2,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { signOut, useSession } from "next-auth/react";
import { BrandLogo } from "./BrandLogo";
import { useWorkspace } from "../workspaceContext";
import { useTasks } from "../taskStoreContext";
import { api } from "../api";
export function AppShell({ children }: { children: ReactNode }) {
  const { workspace, error: workspaceError, reload } = useWorkspace();
  const { data, update } = useSession();
  const { error, isLoading } = useTasks();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [systemDark, setSystemDark] = useState(false);
  const location = useLocation();
  const menuOpen = menuPath === location.pathname;
  const setMenuOpen = (open: boolean) =>
    setMenuPath(open ? location.pathname : null);
  const theme = data?.user?.theme ?? "system";
  const dark = theme === "dark" || (theme === "system" && systemDark);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPath(null);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  async function toggleTheme() {
    try {
      await api("/account", {
        method: "PATCH",
        body: JSON.stringify({ theme: dark ? "light" : "dark" }),
      });
      await update();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/join/${workspace.inviteCode}`,
      );
      setMessage(
        "Invite link copied. Anyone with this link can join after signing in.",
      );
    } catch {
      setMessage("Could not copy. Open Settings to view your invite link.");
    }
  }
  const base = `/workspace/${workspace.id}/app`;
  return (
    <div className={dark ? "app theme-dark" : "app"}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <BrandLogo />
          <span className="product-label">NCT / PLANNER</span>
        </div>
        <NavLink className="back-workspaces" to="/">
          <ArrowLeft size={14} /> Your workspaces
        </NavLink>
        <div className="workspace-heading">
          <span className="workspace-dot">
            {workspace.name.slice(0, 1).toUpperCase()}
          </span>
          <strong>{workspace.name}</strong>
        </div>
        <nav aria-label="Main navigation">
          <p className="nav-label">WORKSPACE</p>
          <NavLink to={`${base}/home`}>
            <Home /> Overview
          </NavLink>
          <NavLink to={`${base}/my-tasks`}>
            <UserRoundCheck /> My tasks
          </NavLink>
          <NavLink to={`${base}/today`}>
            <CalendarDays /> Today
          </NavLink>
          <NavLink to={`${base}/board`}>
            <LayoutDashboard /> Sprint board
          </NavLink>
          <NavLink to={`${base}/calendar`}>
            <CalendarRange /> Calendar
          </NavLink>
          <NavLink to={`${base}/team`}>
            <Users /> Team workload
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <a
            className="club-link"
            href="https://rmitnct.club"
            target="_blank"
            rel="noreferrer"
          >
            rmitnct.club <ArrowUpRight size={15} />
          </a>
          <NavLink to={`${base}/settings`}>
            <Settings /> Settings
          </NavLink>
          <button onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut /> Sign out
          </button>
          <div className="profile">
            <span className="avatar">
              {data?.user?.name
                .split(/\s+/)
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div>
              <strong>{data?.user?.name}</strong>
              <small>
                {data?.user?.username
                  ? `@${data.user.username}`
                  : data?.user?.email}
              </small>
            </div>
          </div>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="scrim"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <main className="main" id="main-content">
        <header className="mobile-header">
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <BrandLogo compact />
          <button aria-label="Toggle color theme" onClick={toggleTheme}>
            {dark ? <Sun /> : <Moon />}
          </button>
        </header>
        <div className="top-actions">
          {workspace.inviteCode && (
            <button className="share-workspace-button" onClick={share}>
              <Link2 /> Invite team
            </button>
          )}
          <button className="theme-toggle" onClick={toggleTheme}>
            {dark ? <Sun /> : <Moon />}
            {dark ? "Light" : "Dark"}
          </button>
        </div>
        {workspaceError && (
          <div className="api-status" role="alert">
            <span>{workspaceError}</span>
            <button onClick={reload}>Retry</button>
          </div>
        )}
        {message && (
          <div className="api-status" role="status">
            <span>{message}</span>
            <button onClick={() => setMessage("")} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}
        {isLoading && (
          <div className="api-status" role="status">
            Loading your tasks…
          </div>
        )}
        {error && (
          <div className="api-status api-status-error" role="alert">
            <span>{error}</span>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
