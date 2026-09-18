import type { Task, TeamMember } from "./types";

export const mockTasks: Task[] = [
  { id: "1", title: "Set up MongoDB connection", description: "", status: "To Do", priority: "High", dueDate: "2026-08-20", assignedMemberId: "m1" },
  { id: "2", title: "Build login page UI", description: "", status: "In Progress", priority: "Medium", dueDate: "2026-08-28", assignedMemberId: "m2" },
  { id: "3", title: "Write README", description: "", status: "Done", priority: "Low", dueDate: "2026-08-26", assignedMemberId: "m1" },
];

export const mockMembers: TeamMember[] = [
  { id: "m1", name: "Alex", email: "alex@example.com" },
  { id: "m2", name: "Sam" },
];