import { useEffect, useMemo, useState } from 'react'
import { apiRequest, readCache } from './api'
import type { Member, TeamMember } from './types'
type WorkspaceData = { id: string; name: string; members: TeamMember[]; ownerId?: string; currentMemberId?: string; inviteCode?: string }
export function useWorkspaceMembers(workspaceId: string) {
  const path = `/workspaces/${encodeURIComponent(workspaceId)}`
  const [workspace, setWorkspace] = useState<WorkspaceData | undefined>(() => readCache.peek(path))
  const [loading, setLoading] = useState(!workspace)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const cached = readCache.peek<WorkspaceData>(path)
    setLoading(!cached); setWorkspace(cached); setError(null)
    if (!workspaceId) { setLoading(false); return }
    apiRequest<WorkspaceData>(path, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setWorkspace(data) })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load workspace members.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [workspaceId, path, revision])
  const workspaceMembers: Member[] = useMemo(() => (workspace?.members || []).map(member => ({ ...member, initials: member.name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase(), color: '#4896ac' })), [workspace])
  let memberId = workspace?.currentMemberId
  if (workspace && !workspace.ownerId) {
    try { memberId = JSON.parse(localStorage.getItem(`memberIdentity:${workspaceId}`) || 'null')?.id } catch { /* No legacy identity. */ }
  }
  const currentMember = workspaceMembers.find(member => member.id === memberId) || null
  return { workspaceMembers, currentMember, workspaceInfo: { ownerId: workspace?.ownerId, inviteCode: workspace?.inviteCode }, workspace, error, loading, refresh: () => { readCache.clear(); setRevision(value => value + 1) } }
}
