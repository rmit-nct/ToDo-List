import { createContext, useContext } from "react";
import type { Member } from "./types";
export type WorkspaceData = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode?: string;
  members: (Member & { email: string })[];
};
export const WorkspaceContext = createContext<{
  workspace: WorkspaceData;
  reload: () => Promise<void>;
  error: string;
} | null>(null);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace provider is missing");
  return value;
}
