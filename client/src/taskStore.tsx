import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { taskApi } from './api/tasks';
import { seedTasks } from './data';
import type { Task } from './types';
import { TaskStore, type TaskStoreValue } from './taskStoreContext';

export function TaskStoreProvider({ children }: { children: ReactNode }) {
  const { workspaceId = 'web-dev' } = useParams();
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    taskApi.list(workspaceId, controller.signal)
      .then((loadedTasks) => {
        setTasks(loadedTasks);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError('Backend unavailable - showing demo tasks. Start the API and connect MongoDB to save changes.');
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [workspaceId]);

  const reportError = useCallback((reason: unknown) => {
    const message = reason instanceof Error ? reason.message : 'The task request failed';
    setError(message);
    return reason;
  }, []);

  const saveTask = useCallback(async (task: Task, isNew: boolean) => {
    try {
      const { id: _id, createdAt: _createdAt, ...payload } = task;
      const saved = isNew ? await taskApi.create(payload) : await taskApi.update(task.id, payload);
      setTasks((current) => isNew
        ? [saved, ...current]
        : current.map((item) => item.id === saved.id ? saved : item));
      setError(null);
    } catch (reason) {
      throw reportError(reason);
    }
  }, [reportError]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await taskApi.delete(id);
      setTasks((current) => current.filter((task) => task.id !== id));
      setError(null);
    } catch (reason) {
      throw reportError(reason);
    }
  }, [reportError]);

  const moveTask = useCallback(async (id: string, status: Task['status']) => {
    try {
      const saved = await taskApi.move(id, status);
      setTasks((current) => current.map((task) => task.id === id ? saved : task));
      setError(null);
    } catch (reason) {
      throw reportError(reason);
    }
  }, [reportError]);

  const value = useMemo<TaskStoreValue>(() => ({
    tasks,
    isLoading,
    error,
    clearError: () => setError(null),
    saveTask,
    deleteTask,
    moveTask,
  }), [deleteTask, error, isLoading, moveTask, saveTask, tasks]);
  return <TaskStore.Provider value={value}>{children}</TaskStore.Provider>;
}
