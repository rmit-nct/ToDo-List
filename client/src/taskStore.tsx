import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { API_BASE_URL, apiFetch } from './api'
import type { Task } from './types'
import { TaskStore, type TaskStoreValue } from './taskStoreContext'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_BASE_URL}/api${path}`, {
    ...options, headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? body?.message ?? 'Unable to save changes. Please try again.')
  return body as T
}
export function TaskStoreProvider({ children, mine = false }: { children: ReactNode; mine?: boolean }) {
  const { workspaceId } = useParams()
  const { pathname } = useLocation()
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    setTasks([]); setError(null)
    if (!workspaceId && !mine) { setIsLoading(false); return }
    setIsLoading(true)
    request<Task[]>(mine ? "/users/me/tasks" : `/tasks?${new URLSearchParams({ workspaceId: workspaceId! })}`, { signal: controller.signal })
      .then(setTasks)
      .catch(() => {
        if (!controller.signal.aborted) setError('Unable to load tasks. Please refresh to try again.')
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [workspaceId, mine, pathname])
  const value = useMemo<TaskStoreValue>(() => {
    const perform = async <T,>(operation: () => Promise<T>) => {
      try { const result = await operation(); setError(null); return result }
      catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to save changes.')
        throw reason
      }
    }
    return {
      tasks, error, isLoading, clearError: () => setError(null),
      saveTask: async (task) => perform(async () => {
        const exists = tasks.some((item) => item.id === task.id)
        const saved = await request<Task>(exists ? `/tasks/${task.id}` : '/tasks', {
          method: exists ? 'PUT' : 'POST', body: JSON.stringify({ ...task, workspaceId: task.workspaceId ?? workspaceId }),
        })
        if (mine) { setTasks(await request<Task[]>("/users/me/tasks")); return }
        setTasks((current) => exists ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
      }),
      deleteTask: async (id) => perform(async () => {
        await request(`/tasks/${id}`, { method: 'DELETE' })
        setTasks((current) => current.filter((task) => task.id !== id))
      }),
      moveTask: async (id, status) => perform(async () => {
        const saved = await request<Task>(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
        setTasks((current) => current.map((task) => task.id === id ? saved : task))
      }),
    }
  }, [tasks, workspaceId, error, isLoading, mine])
  return <TaskStore.Provider value={value}>{children}</TaskStore.Provider>
}
