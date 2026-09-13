import { useEffect, useState } from 'react';
import type { Member } from './types';
import { useUserProfile } from './userProfileContext';

export function useWorkspaceMembers(workspaceId: string) {
  const { currentMember } = useUserProfile();
  const [joined, setJoined] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setJoined([]);
    setError(null);
    const base = import.meta.env.VITE_API_URL ?? '/api';
    fetch(`${base}/members?${new URLSearchParams({ workspaceId })}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load workspace members. Only your account is available.');
        return response.json() as Promise<Member[]>;
      })
      .then(setJoined)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load workspace members.');
      });
    return () => controller.abort();
  }, [workspaceId]);
  return { workspaceMembers: [currentMember, ...joined.filter((member) => member.id !== currentMember.id)], error };
}
