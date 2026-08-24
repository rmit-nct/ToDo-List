import { useMemo, useState, type ReactNode } from 'react';
import { seedTasks } from './data';
import type { Task } from './types';
import { TaskStore, type TaskStoreValue } from './taskStoreContext';

export function TaskStoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const value = useMemo<TaskStoreValue>(() => ({
    tasks,
    saveTask: (task) => setTasks((current) => current.some((item) => item.id === task.id)
      ? current.map((item) => item.id === task.id ? task : item)
      : [task, ...current]),
    deleteTask: (id) => setTasks((current) => current.filter((task) => task.id !== id)),
    moveTask: (id, status) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task)),
  }), [tasks]);
  return <TaskStore.Provider value={value}>{children}</TaskStore.Provider>;
}
