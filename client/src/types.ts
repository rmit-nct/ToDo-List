export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Member { id: string; name: string; initials: string; color: string }
export interface Workspace { id: string; name: string; inviteCode: string }
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: Member;
  creator: Member;
  workspaceId: string;
  createdAt: string;
}
