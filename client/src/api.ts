export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, credentials: 'include' })
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_BASE_URL}/api${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'Unable to complete this request. Please try again.')
  return body as T
}
