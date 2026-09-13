import { useState, type ReactNode } from 'react';
import { CalendarDays, ChevronDown, Home, LayoutDashboard, Menu, Moon, Settings, Sun, UserRoundCheck, X } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import { useTasks } from '../taskStoreContext';
import { useUserProfile } from '../userProfileContext';
import { BrandLogo } from './BrandLogo';

export function AppShell({ children }: { children: ReactNode }) {
  const { workspaceId = 'web-dev' } = useParams();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const { error, isLoading, clearError } = useTasks();
  const { profile, currentMember } = useUserProfile();

  const nav = (
    <>
      <div className="brand"><BrandLogo /></div>
      <nav aria-label="Main navigation">
        <p className="nav-label">OVERVIEW</p>
        <span className="future-nav"><Home /> Home</span>
        <span className="future-nav"><UserRoundCheck /> My Tasks</span>
        <button className="workspace-select central-workspace" onClick={() => setWorkspaceOpen((v) => !v)} aria-expanded={workspaceOpen}>
          <span className="workspace-dot">W</span><span>Web Dev Team</span><ChevronDown className={workspaceOpen ? 'rotate' : ''} />
        </button>
        {workspaceOpen ? <div className="workspace-nav">
          <NavLink to={`/workspace/${workspaceId}/today`}><CalendarDays /> Today Dashboard</NavLink>
          <NavLink to={`/workspace/${workspaceId}/board`}><LayoutDashboard /> Weekly Sprint Board</NavLink>
        </div> : null}
      </nav>
      <div className="sidebar-footer">
        <span className="future-nav"><Settings /> Settings</span>
        <div className="profile"><span className="avatar" data-member={currentMember.id}>{currentMember.initials}</span><div><strong>{profile.name}</strong><small>{profile.email || 'Workspace member'}</small></div><ChevronDown /></div>
      </div>
    </>
  );

  return <div className={dark ? 'app theme-dark' : 'app'}>
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>{nav}</aside>
    {menuOpen ? <button className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} /> : null}
    <main className="main">
      <header className="mobile-header"><button aria-label="Open menu" onClick={() => setMenuOpen(true)}>{menuOpen ? <X /> : <Menu />}</button><BrandLogo compact /><button aria-label="Toggle color theme" onClick={() => setDark((v) => !v)}>{dark ? <Sun /> : <Moon />}</button></header>
      <button className="theme-toggle" onClick={() => setDark((v) => !v)}>{dark ? <Sun /> : <Moon />} {dark ? 'Light' : 'Dark'}</button>
      {isLoading ? <div className="api-status" role="status">Loading tasks...</div> : null}
      {error ? <div className="api-status api-status-error" role="alert"><span>{error}</span><button onClick={clearError} aria-label="Dismiss message">×</button></div> : null}
      {children}
    </main>
  </div>;
}
