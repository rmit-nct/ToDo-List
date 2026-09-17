import { createContext, useContext } from "react";

import type { Task } from "./types";

export interface TaskStoreValue {
  tasks: Task[];
  error: string | null;
  isLoading: boolean;
  clearError: () => void;

  saveTask: (task: Task) => Promise<void>;

  deleteTask: (id: string) => Promise<void>;

  moveTask: (id: string, status: Task["status"]) => Promise<void>;
}

export const TaskStore = createContext<TaskStoreValue | null>(null);

export function useTasks() {
  const value = useContext(TaskStore);

  if (!value) {
    throw new Error("useTasks must be used inside TaskStoreProvider");
  }

  return value;
}
