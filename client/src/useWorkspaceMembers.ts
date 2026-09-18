import { useEffect, useState } from 'react'
import { API_BASE_URL, apiFetch } from './api'
import type { Member, TeamMember } from './types'
export function useWorkspaceMembers(workspaceId: string) {
  const [workspaceMembers, setMembers] = useState<Member[]>([])
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [workspaceInfo, setWorkspaceInfo] = useState<{ ownerId?: string; inviteCode?: string }>({})
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setMembers([]); setCurrentMember(null); setWorkspaceInfo({}); setError(null)
    apiFetch(`${API_BASE_URL}/api/workspaces/${encodeURIComponent(workspaceId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load workspace members.')
        return response.json() as Promise<{ members: TeamMember[]; ownerId?: string; currentMemberId?: string; inviteCode?: string }>
      })
      .then((workspace) => {
        if (controller.signal.aborted) return
        const members = workspace.members.map((member) => ({
          ...member, initials: member.name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), color: '#4896ac',
        }))
        setMembers(members)
        setWorkspaceInfo({ ownerId: workspace.ownerId, inviteCode: workspace.inviteCode })
        if (workspace.ownerId) {
          setCurrentMember(members.find(member => member.id === workspace.currentMemberId) ?? null)
          return
        }
        try {
          const saved = JSON.parse(localStorage.getItem(`memberIdentity:${workspaceId}`) ?? 'null')
          setCurrentMember(members.find((member) => member.id === saved?.id) ?? null)
        } catch { setCurrentMember(null) }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load workspace members.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [workspaceId, revision])
  return { workspaceMembers, currentMember, workspaceInfo, error, loading, refresh: () => setRevision(value => value + 1) }
}
