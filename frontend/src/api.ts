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
  try { return await performRequest<T>(path, init) }
  catch (error) {
    const transient = error instanceof TypeError || (error instanceof ApiError && [500, 502, 503, 504].includes(error.status))
    if ((init?.method?.toUpperCase() || 'GET') !== 'GET' || !transient || init?.signal?.aborted) throw error
    await new Promise(resolve => setTimeout(resolve, 250))
    init?.signal?.throwIfAborted()
    return performRequest<T>(path, init)
  }
}

async function performRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (path === '/auth/logout') {
    const { csrfToken } = await apiRequest<{ csrfToken: string }>('/username/csrf')
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
  if (body === null) throw new ApiError(typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'The API did not return JSON. Run npm run dev from the repository root; the Vite client needs the Next.js API on port 3000.' : 'The server returned an unexpected response. Please try again.', response.ok ? 502 : response.status)
  if (!response.ok) throw new ApiError(body?.error || 'Unable to complete this request. Please try again.', response.status)
  return body as T
}
