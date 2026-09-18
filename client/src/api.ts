export const API_BASE_URL = ''

export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, credentials: 'include' })
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
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
  if (!response.ok) throw new Error(body?.error || 'Unable to complete this request. Please try again.')
  return body as T
}
