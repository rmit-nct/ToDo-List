import { apiRequest } from './api';

export async function joinWorkspace(workspaceId: string, identity: { name?: string; email?: string }) {
  const member = await apiRequest<{ id: string; name: string; email?: string }>(`/workspaces/${encodeURIComponent(workspaceId)}/members`, {
    method: 'POST', body: JSON.stringify(identity),
  });
  try { localStorage.setItem(`memberIdentity:${workspaceId}`, JSON.stringify({ ...member, workspaceId })); }
  catch { /* Account membership is persisted by the server even if storage is unavailable. */ }
  return member;
}
