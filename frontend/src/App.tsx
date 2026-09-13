import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import { AppShell } from './components/AppShell'
import { TodayDashboard } from './pages/TodayDashboard'
import { SprintBoard } from './pages/SprintBoard'
import { TaskStoreProvider } from './taskStore'

import './assets/app.css'

function WorkspaceApp() {
  return (
    <TaskStoreProvider>
      <AppShell>
        <Routes>
          <Route path="home" element={<HomePage />} />
          <Route path="today" element={<TodayDashboard />} />
          <Route path="board" element={<SprintBoard />} />

          <Route
            path="*"
            element={<Navigate to="home" replace />}
          />
        </Routes>
      </AppShell>
    </TaskStoreProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/tasks"
          element={<HomePage />}
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
    </BrowserRouter>
  )
}

export default App