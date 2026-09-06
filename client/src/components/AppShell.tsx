import { useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  Share2,
  Sun,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { NavLink, useParams } from 'react-router-dom'

import { members } from '../data'
import { BrandLogo } from './BrandLogo'

export function AppShell({ children }: { children: ReactNode }) {
  const { workspaceId } = useParams()

  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(true)

  const handleShareWorkspace = async () => {
    if (!workspaceId) {
      return
    }

    const shareUrl =
      `${window.location.origin}/workspace/${workspaceId}`

    await navigator.clipboard.writeText(shareUrl)
  }

  const nav = (
    <>
      <div className="brand">
        <BrandLogo />
      </div>

      <nav aria-label="Main navigation">
        <p className="nav-label">
          OVERVIEW
        </p>

        <span className="future-nav">
          <Home />
          Home
        </span>

        <span className="future-nav">
          <UserRoundCheck />
          My Tasks
        </span>

        <button
          type="button"
          className="workspace-select central-workspace"
          onClick={() =>
            setWorkspaceOpen((value) => !value)
          }
          aria-expanded={workspaceOpen}
        >
          <span className="workspace-dot">
            W
          </span>

          <span>
            Web Dev Team
          </span>

          <ChevronDown
            className={workspaceOpen ? 'rotate' : ''}
          />
        </button>

        {workspaceOpen ? (
          <div className="workspace-nav">
            <NavLink
              to={`/workspace/${workspaceId}/app/today`}
            >
              <CalendarDays />
              Today Dashboard
            </NavLink>

            <NavLink
              to={`/workspace/${workspaceId}/app/board`}
            >
              <LayoutDashboard />
              Weekly Sprint Board
            </NavLink>
          </div>
        ) : null}
      </nav>

      <div className="sidebar-footer">
        <span className="future-nav">
          <Settings />
          Settings
        </span>

        <button type="button">
          <CircleHelp />
          Help & support
        </button>

        <div className="profile">
          <span
            className="avatar"
            data-member={members[0]?.id ?? ''}
          >
            MN
          </span>

          <div>
            <strong>
              My Ngoc
            </strong>

            <small>
              myngoc@neo.app
            </small>
          </div>

          <ChevronDown />
        </div>
      </div>
    </>
  )

  return (
    <div className={dark ? 'app theme-dark' : 'app'}>
      <aside
        className={
          menuOpen
            ? 'sidebar open'
            : 'sidebar'
        }
      >
        {nav}
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="scrim"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="main">
        <header className="mobile-header">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <BrandLogo compact />

          <button
            type="button"
            aria-label="Toggle color theme"
            onClick={() =>
              setDark((value) => !value)
            }
          >
            {dark ? <Sun /> : <Moon />}
          </button>
        </header>

        <div className="top-actions">
          <button
            type="button"
            className="share-workspace-button"
            onClick={handleShareWorkspace}
          >
            <Share2 />
            Share Workspace
          </button>

          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setDark((value) => !value)
            }
          >
            {dark ? <Sun /> : <Moon />}
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}