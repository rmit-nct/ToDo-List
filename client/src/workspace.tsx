import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "next-auth/react";
import { api } from "./api";
import { WorkspaceContext, type WorkspaceData } from "./workspaceContext";
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspaceId } = useParams();
  const { data } = useSession();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState("");
  async function reload() {
    try {
      const value = await api<WorkspaceData>(`/workspaces/${workspaceId}`);
      setWorkspace(value);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    let active = true;
    const refresh = () => {
      api<WorkspaceData>(`/workspaces/${workspaceId}`)
        .then((w) => {
          if (active) {
            setWorkspace(w);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    };
    refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(onFocus, 30000);
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [workspaceId, data?.user?.id]);
  if (error && !workspace)
    return (
      <div className="boot-screen">
        <h1>Unable to open workspace</h1>
        <p role="alert">{error}</p>
        <button className="primary" onClick={reload}>
          Try again
        </button>
        <a href="/">Your workspaces</a>
      </div>
    );
  if (!workspace)
    return (
      <div className="boot-screen" role="status">
        Loading your workspace…
      </div>
    );
  return (
    <WorkspaceContext.Provider value={{ workspace, reload, error }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
