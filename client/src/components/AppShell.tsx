import { useTheme } from '../themeContext'
import { API_BASE_URL, apiFetch } from '../api'
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
  Share2,
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

  const isWorkspaceManagePage =
  location.pathname.endsWith('/app/workspace')

  const { error, isLoading, clearError } = useTasks()

  const { dark, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const [workspaceOpen, setWorkspaceOpen] =
    useState(true)

  const [workspaceMenuOpen, setWorkspaceMenuOpen] =
    useState(false)

  const [copied, setCopied] = useState(false)

  const [workspace, setWorkspace] =
    useState<WorkspaceData | null>(null)

  const [member, setMember] =
    useState<MemberIdentity | null>(null)

  useEffect(() => {
    if (!workspaceId) {
      apiFetch(`${API_BASE_URL}/api/users/me`).then(response => response.ok ? response.json() : null).then(setMember).catch(() => setMember(null))
      setWorkspace(null)
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
        const response = await apiFetch(
          `${API_BASE_URL}/api/workspaces/${workspaceId}`
        )

        if (!response.ok) {
          throw new Error(
            'Failed to load workspace'
          )
        }

        const data = await response.json()
        if (data.ownerId) {
          setMember(data.members.find((item: MemberIdentity) => item.id === data.currentMemberId) || null)
        }

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

  const handleShareWorkspace = async () => {
    if (!workspaceId) {
      return
    }

    const shareUrl =
      `${window.location.origin}/workspace/${workspaceId}`

    try {
      await navigator.clipboard.writeText(
        shareUrl
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error(
        'Failed to copy workspace link:',
        error
      )
    }
  }

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
      <div className="brand">
        <BrandLogo />
      </div>

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
                {workspace?.name ??
                  'Loading workspace...'}
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
        <NavLink to={workspaceId ? `/workspace/${workspaceId}/app/settings` : "/account"} onClick={() => setMenuOpen(false)}><Settings />Settings</NavLink>

        <Link className="profile" aria-label="Open profile settings" to={workspaceId ? `/workspace/${workspaceId}/app/settings#profile` : "/account"} onClick={() => setMenuOpen(false)}>
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
        </Link>
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

        <div className="top-actions">
          {workspaceId && !isWorkspaceManagePage ? (
            <button
              type="button"
              className="share-workspace-button"
              onClick={
                handleShareWorkspace
              }
            >
              <Share2 />

              {copied
                ? 'Link Copied!'
                : 'Share Workspace'}
            </button>
          ) : null}

          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              toggleTheme()
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

        {isLoading ? (
          <div
            className="api-status"
            role="status"
          >
            Loading tasks...
          </div>
        ) : null}

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

        {children}
      </main>
    </div>
  )
}