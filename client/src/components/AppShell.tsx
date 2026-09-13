import { API_BASE_URL } from '../api'

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
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
import {
  NavLink,
  useParams,
} from 'react-router-dom'

import { BrandLogo } from './BrandLogo'

type WorkspaceData = {
  id: string
  name: string
}

type MemberIdentity = {
  workspaceId: string
  id: string
  name: string
  email?: string
}

export function AppShell({
  children,
}: {
  children: ReactNode
}) {
  const { workspaceId } = useParams()

  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] =
    useState(true)

  const [workspace, setWorkspace] =
    useState<WorkspaceData | null>(null)

  const [member, setMember] =
    useState<MemberIdentity | null>(null)

  useEffect(() => {
    if (!workspaceId) {
      return
    }

    const savedIdentity = localStorage.getItem(
      `memberIdentity:${workspaceId}`
    )

    if (savedIdentity) {
      try {
        const parsedIdentity =
          JSON.parse(savedIdentity)

        setMember(parsedIdentity)
      } catch {
        setMember(null)
      }
    }

    const loadWorkspace = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/workspaces/${workspaceId}`
        )

        if (!response.ok) {
          throw new Error(
            'Failed to load workspace'
          )
        }

        const data = await response.json()

        setWorkspace({
          id: data.id,
          name: data.name,
        })
      } catch (error) {
        console.error(
          'Workspace load error:',
          error
        )
      }
    }

    loadWorkspace()
  }, [workspaceId])

  const handleShareWorkspace = async () => {
    if (!workspaceId) {
      return
    }

    const shareUrl =
      `${window.location.origin}/workspace/${workspaceId}`

    await navigator.clipboard.writeText(
      shareUrl
    )
  }

  const getInitials = (name?: string) => {
    if (!name) {
      return '?'
    }

    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
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

        <NavLink to={`/workspace/${workspaceId}/app/home`}>
          <Home />
          Homepage
        </NavLink>

        <span className="future-nav">
          <UserRoundCheck />
          My Tasks
        </span>

        <button
          type="button"
          className="workspace-select central-workspace"
          onClick={() =>
            setWorkspaceOpen(
              (value) => !value
            )
          }
          aria-expanded={workspaceOpen}
        >
          <span className="workspace-dot">
            {getInitials(
              workspace?.name
            ).slice(0, 1)}
          </span>

          <span>
            {workspace?.name ??
              'Loading workspace...'}
          </span>

          <ChevronDown
            className={
              workspaceOpen
                ? 'rotate'
                : ''
            }
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
          <span className="avatar">
            {getInitials(member?.name)}
          </span>

          <div>
            <strong>
              {member?.name ??
                'Workspace Member'}
            </strong>

            <small>
              {member?.email ||
                'No email'}
            </small>
          </div>

          <ChevronDown />
        </div>
      </div>
    </>
  )

  return (
    <div
      className={
        dark
          ? 'app theme-dark'
          : 'app'
      }
    >
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
          onClick={() =>
            setMenuOpen(false)
          }
        />
      ) : null}

      <main className="main">
        <header className="mobile-header">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() =>
              setMenuOpen(true)
            }
          >
            {menuOpen ? (
              <X />
            ) : (
              <Menu />
            )}
          </button>

          <BrandLogo compact />

          <button
            type="button"
            aria-label="Toggle color theme"
            onClick={() =>
              setDark(
                (value) => !value
              )
            }
          >
            {dark ? (
              <Sun />
            ) : (
              <Moon />
            )}
          </button>
        </header>

        <div className="top-actions">
          <button
            type="button"
            className="share-workspace-button"
            onClick={
              handleShareWorkspace
            }
          >
            <Share2 />
            Share Workspace
          </button>

          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setDark(
                (value) => !value
              )
            }
          >
            {dark ? (
              <Sun />
            ) : (
              <Moon />
            )}

            {dark
              ? 'Light'
              : 'Dark'}
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}