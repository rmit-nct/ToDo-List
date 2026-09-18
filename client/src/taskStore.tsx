import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "./api";
import { TaskStore, type TaskStoreValue } from "./taskStoreContext";
import { OptimisticTasks } from "./optimisticTasks";

export function TaskStoreProvider({
  children,
  mine = false,
}: {
  children: ReactNode;
  mine?: boolean;
}) {
  const { workspaceId } = useParams();
  return <TaskStoreScope key={`${workspaceId || 'all'}:${mine}`} workspaceId={workspaceId} mine={mine}>{children}</TaskStoreScope>;
}

function TaskStoreScope({ children, workspaceId, mine }: { children: ReactNode; workspaceId?: string; mine: boolean }) {
  // Keying this scope prevents the previous workspace’s cache from leaking.
  const store = useMemo(() => new OptimisticTasks(apiRequest), []);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  useEffect(() => {
    const controller = new AbortController();
    if (!workspaceId && !mine) return;
    const refresh = () => {
      void store.refresh(
        mine
          ? "/users/me/tasks"
          : `/tasks?${new URLSearchParams({ workspaceId: workspaceId! })}`,
        controller.signal,
        mine,
      );
    };
    refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(onFocus, 30000);
    window.addEventListener("focus", onFocus);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [store, workspaceId, mine]);
  const value = useMemo<TaskStoreValue>(
    () => ({
      ...state,
      clearError: store.clearError,
      saveTask: (task) =>
        store.save({ ...task, workspaceId: task.workspaceId ?? workspaceId }),
      deleteTask: store.remove,
      moveTask: store.move,
    }),
    [state, store, workspaceId],
  );
  return <TaskStore.Provider value={value}>{children}</TaskStore.Provider>;
}
