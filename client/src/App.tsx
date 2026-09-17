import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { useSession } from "next-auth/react";
import { AuthPage } from "./pages/AuthPage";
import { WorkspacesPage } from "./pages/WorkspacesPage";
import HomePage from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AppShell } from "./components/AppShell";
import { TodayDashboard } from "./pages/TodayDashboard";
import { SprintBoard } from "./pages/SprintBoard";
import { TaskStoreProvider } from "./taskStore";
import { WorkspaceProvider } from "./workspace";
function WorkspaceApp() {
  const { workspaceId } = useParams();
  return (
    <WorkspaceProvider key={workspaceId}>
      <TaskStoreProvider>
        <AppShell>
          <Routes>
            <Route path="home" element={<HomePage />} />
            <Route path="my-tasks" element={<HomePage mine />} />
            <Route path="today" element={<TodayDashboard />} />
            <Route path="board" element={<SprintBoard />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </AppShell>
      </TaskStoreProvider>
    </WorkspaceProvider>
  );
}
function Router() {
  const { data, status } = useSession();
  const location = useLocation();
  if (status === "loading" && !data)
    return (
      <div className="boot-screen" role="status">
        Opening NEO…
      </div>
    );
  if (!data?.user)
    return (
      <AuthPage
        returnTo={
          location.pathname.startsWith("/join/") ? location.pathname : "/"
        }
      />
    );
  return (
    <Routes>
      <Route path="/" element={<WorkspacesPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/join/:code" element={<WorkspacesPage />} />
      <Route path="/workspace/:workspaceId/app/*" element={<WorkspaceApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}
