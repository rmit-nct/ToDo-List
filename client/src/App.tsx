import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/tasks" element={<HomePage />} />
        <Route path="/" element={<LandingPage />} />

        <Route 
          path="/workspace/:workspaceId" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App