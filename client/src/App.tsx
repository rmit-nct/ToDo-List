import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import { MyTasksPage } from './pages/MyTasksPage'
import HomePage from './pages/HomePage'
import { AppShell } from './components/AppShell'
import { TodayDashboard } from './pages/TodayDashboard'
import { SprintBoard } from './pages/SprintBoard'
import { TaskStoreProvider } from './taskStore'

import { ThemeProvider } from './theme'
import { SettingsPage } from './pages/SettingsPage'
import { AccountPage } from './pages/AccountPage'
import './assets/app.css'
import './assets/theme.css'

function WorkspaceApp() {
  const location = useLocation()
  return (
    <TaskStoreProvider mine={location.pathname.endsWith('/my-tasks')}>
      <AppShell>
        <Routes>
          <Route path="my-tasks" element={<MyTasksPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="home"
            element={<HomePage />}
          />

          <Route
            path="today"
            element={<TodayDashboard />}
          />

          <Route
            path="board"
            element={<SprintBoard />}
          />

          <Route
            path="workspace"
            element={<SettingsPage />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="home"
                replace
              />
            }
          />
        </Routes>
      </AppShell>
    </TaskStoreProvider>
  )
}

function App() {
  return (
    <ThemeProvider><BrowserRouter>
      <Routes>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<AccountPage />} />
        <Route path="/account/email" element={<AccountPage />} />
        <Route
          path="/"
          element={<AccountPage />}
        />

        <Route
          path="/tasks"
          element={<TaskStoreProvider mine><AppShell><MyTasksPage /></AppShell></TaskStoreProvider>}
        />

        <Route
          path="/workspace/:workspaceId"
          element={<LandingPage />}
        />

        <Route
          path="/workspace/:workspaceId/app/*"
          element={<WorkspaceApp />}
        />
      </Routes>
    </BrowserRouter></ThemeProvider>
  )
}

export default App