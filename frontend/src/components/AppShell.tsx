import { useWorkspaceMembers } from "../useWorkspaceMembers"
import { SkeletonLine } from "./LoadingSkeleton"
import { useTheme } from '../themeContext'
import { apiRequest } from '../api'
import { useTasks } from '../taskStoreContext'

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  CalendarDays,
  ChevronDown,
  Home,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Moon,
  Settings,
  SlidersHorizontal,
  Sun,
  UserRoundCheck,
  X,
} from 'lucide-react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
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
  const navigate = useNavigate()
  const location = useLocation()


  const { error, clearError, pendingCount } = useTasks()

  const { dark, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const [workspaceOpen, setWorkspaceOpen] =
    useState(true)

  const [workspaceMenuOpen, setWorkspaceMenuOpen] =
    useState(false)


  const [identityLoading, setIdentityLoading] = useState(true)

  const [workspace, setWorkspace] =
    useState<WorkspaceData | null>(null)

  const [member, setMember] =
    useState<MemberIdentity | null>(null)

  const workspaceData = useWorkspaceMembers(workspaceId || '')
  useEffect(() => {
    if (workspaceId) {
      setIdentityLoading(workspaceData.loading)
      setWorkspace(workspaceData.workspace ? { id: workspaceData.workspace.id, name: workspaceData.workspace.name } : null)
      setMember(workspaceData.currentMember ? { ...workspaceData.currentMember, workspaceId } : null)
      return
    }
    const controller = new AbortController()
    apiRequest<MemberIdentity>('/users/me', { signal: controller.signal }).then(setMember).catch(() => {}).finally(() => { if (!controller.signal.aborted) setIdentityLoading(false) })
    return () => controller.abort()
  }, [workspaceId, workspaceData.workspace, workspaceData.loading, workspaceData.currentMember])

  useEffect(() => {
    const handleWorkspaceUpdated = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<WorkspaceData>

      if (
        customEvent.detail.id ===
        workspaceId
      ) {
        setWorkspace({
          id: customEvent.detail.id,
          name: customEvent.detail.name,
        })
      }
    }

    window.addEventListener(
      'workspace-updated',
      handleWorkspaceUpdated
    )

    return () => {
      window.removeEventListener(
        'workspace-updated',
        handleWorkspaceUpdated
      )
    }
  }, [workspaceId])

  useEffect(() => {
    const onMemberUpdated = (event: Event) => {
      const identity = (event as CustomEvent<MemberIdentity>).detail
      setMember(identity)
    }
    window.addEventListener('member-updated', onMemberUpdated)
    return () => window.removeEventListener('member-updated', onMemberUpdated)
  }, [])

  useEffect(() => { setMenuOpen(false); setWorkspaceMenuOpen(false) }, [location.pathname])

  const handleManageWorkspace = () => {
    if (!workspaceId) {
      return
    }

    setWorkspaceMenuOpen(false)

    navigate(
      `/workspace/${workspaceId}/app/workspace`
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
      <Link className="brand brand-home-link" to="/" aria-label="NEO home" onClick={() => setMenuOpen(false)}>
        <BrandLogo />
      </Link>

      <nav aria-label="Main navigation">
        <p className="nav-label">
          OVERVIEW
        </p>

        <NavLink
          to={workspaceId ? `/workspace/${workspaceId}/app/home` : "/account"}
        >
          <Home />
          Home
        </NavLink>

        <NavLink to={workspaceId ? `/workspace/${workspaceId}/app/my-tasks` : "/tasks"} onClick={() => setMenuOpen(false)}>
          <UserRoundCheck />
          My Tasks
        </NavLink>

        {workspaceId && <div className="workspace-select-container">
          <div className="workspace-select central-workspace">
            <button
              type="button"
              className="workspace-main-button"
              aria-label={workspace?.name || "Workspace"}
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

              <span className="workspace-name">
                {workspace?.name ?? (identityLoading ? <SkeletonLine width="85px" /> : "Workspace unavailable")}
              </span>
            </button>

            <button
              type="button"
              className="workspace-more-button"
              aria-label="Workspace options"
              aria-expanded={workspaceMenuOpen}
              onClick={() =>
                setWorkspaceMenuOpen(
                  (value) => !value
                )
              }
            >
              <MoreHorizontal />
            </button>

            <span className="workspace-action-divider" />

            <button
              type="button"
              className="workspace-chevron-button"
              aria-label={
                workspaceOpen
                  ? 'Collapse workspace'
                  : 'Expand workspace'
              }
              onClick={() =>
                setWorkspaceOpen(
                  (value) => !value
                )
              }
            >
              <ChevronDown
                className={
                  workspaceOpen
                    ? 'rotate'
                    : ''
                }
              />
            </button>
          </div>

          {workspaceMenuOpen ? (
            <div className="workspace-menu">
              <button
                type="button"
                onClick={
                  handleManageWorkspace
                }
              >
                <SlidersHorizontal />
                Manage Workspace
              </button>
            </div>
          ) : null}
        </div>}

        {workspaceOpen && workspaceId ? (
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
        <NavLink className="profile account-settings-link" aria-label="Account settings" to={workspaceId ? `/workspace/${workspaceId}/app/settings` : "/account"} onClick={() => setMenuOpen(false)}>
          <span className="avatar" aria-hidden="true">{getInitials(member?.name)}</span>
          <div><strong>{!member && identityLoading ? <SkeletonLine width="100px" /> : member?.name ?? 'Your account'}</strong><small>Account &amp; settings</small></div>
          <Settings aria-hidden="true" />
        </NavLink>
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

          <Link to="/" aria-label="NEO home" onClick={() => setMenuOpen(false)}><BrandLogo compact /></Link>

          <button
            type="button"
            aria-label="Toggle color theme"
            onClick={() =>
              toggleTheme()
            }
          >
            {dark ? (
              <Sun />
            ) : (
              <Moon />
            )}
          </button>
        </header>

        <div className="sync-messages">
        {pendingCount > 0 && <div className="api-status" role="status">Saving {pendingCount === 1 ? "change" : `${pendingCount} changes`}…</div>}


        {error ? (
          <div
            className="api-status api-status-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              onClick={clearError}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        ) : null}

        </div>
        {children}
      </main>
    </div>
  )
}