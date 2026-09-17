import { useSession } from "next-auth/react";
import { useWorkspace } from "./workspaceContext";
export function useWorkspaceMembers(_workspaceId: string) {
  const { workspace } = useWorkspace();
  const { data } = useSession();
  return {
    workspaceMembers: workspace.members,
    currentMember:
      workspace.members.find((member) => member.id === data?.user?.id) ?? null,
    error: null,
  };
}
