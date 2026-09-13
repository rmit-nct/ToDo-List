import type { Task, TaskStatus } from '../types'

type TaskPayload = Omit<Task, 'id' | 'createdAt'>

const apiBase = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const taskApi = {
  list(workspaceId: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ workspaceId })
    return request<Task[]>(`/tasks?${params}`, { signal })
  },
  create(task: TaskPayload) {
    return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) })
  },
  update(id: string, task: TaskPayload) {
    return request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) })
  },
  move(id: string, status: TaskStatus) {
    return request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },
  delete(id: string) {
    return request<void>(`/tasks/${id}`, { method: 'DELETE' })
  },
}
