import type { Task } from "./types";

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Set up MongoDB connection",
    status: "todo",
    priority: "high",
    dueDate: "2026-08-20",
    assignedMemberId: "m1",
  },
  {
    id: "2",
    title: "Build login page UI",
    status: "in-progress",
    priority: "medium",
    dueDate: "2026-08-28",
    assignedMemberId: "m2",
  },
  {
    id: "3",
    title: "Write README",
    status: "done",
    priority: "low",
    dueDate: "2026-08-26",
    assignedMemberId: "m1",
  },
];