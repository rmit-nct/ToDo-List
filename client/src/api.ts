import { ReadCache } from './readCache'
export const readCache = new ReadCache()
export const API_BASE_URL = ''

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, credentials: 'include' })
  const method = init?.method?.toUpperCase() || 'GET'
  if ((response.ok && method !== 'GET' && method !== 'HEAD') || response.status === 401 || response.status === 403) {
    readCache.clear()
    if (typeof window !== 'undefined') {
      const path = String(input)
      if (response.status === 401 || /\/(auth\/(login|register|logout)|username-session)/.test(path) || (method === 'DELETE' && path.endsWith('/users/me'))) window.dispatchEvent(new Event('session-changed'))
    }
  }
  return response
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() || 'GET'
  const cacheable = method === 'GET' && (/^\/workspaces(?:\/[^/]+)?$/.test(path) || path === '/users/me' || path === '/users/me/workspaces')
  if (!cacheable) return request<T>(path, init)
  // An unmount must not cancel a request another mounted consumer shares.
  const value = await readCache.read<T>(path, () => request<T>(path, { ...init, signal: undefined }))
  if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return value
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (path === '/auth/logout') {
    const csrfResponse = await apiFetch('/api/username/csrf')
    const { csrfToken } = await csrfResponse.json()
    const signout = await apiFetch('/api/username/signout', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, json: 'true' }),
    })
    if (!signout.ok) throw new Error('Could not sign out. Please try again.')
  }
  const response = await apiFetch(`${API_BASE_URL}/api${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(body?.error || 'Unable to complete this request. Please try again.', response.status)
  return body as T
}
