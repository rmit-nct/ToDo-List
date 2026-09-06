export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedMemberId: string; // now references a TeamMember's id, not a raw name
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
}