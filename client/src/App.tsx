import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import { AppShell } from './components/AppShell'
import { TodayDashboard } from './pages/TodayDashboard'
import { SprintBoard } from './pages/SprintBoard'
import { TaskStoreProvider } from './taskStore'
import { UserProfileProvider } from './UserProfileProvider'
import './assets/app.css'

function WorkspaceApp() {
  return (
    <TaskStoreProvider>
      <AppShell>
        <Routes>
          <Route path="today" element={<TodayDashboard />} />
          <Route path="board" element={<SprintBoard />} />
          <Route path="*" element={<Navigate to="today" replace />} />
        </Routes>
      </AppShell>
    </TaskStoreProvider>
  )
}

function App() {
  return (
    <UserProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/workspace/:workspaceId/*" element={<WorkspaceApp />} />
        </Routes>
      </BrowserRouter>
    </UserProfileProvider>
  )
}

export default App
