import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useParams } from 'react-router-dom'

import { API_BASE_URL } from './api'
import type { Task } from './types'
import {
  TaskStore,
  type TaskStoreValue,
} from './taskStoreContext'

export function TaskStoreProvider({
  children,
}: {
  children: ReactNode
}) {
  const { workspaceId } = useParams()

  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!workspaceId) {
      setTasks([])
      return
    }

    const loadTasks = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/tasks?workspaceId=${workspaceId}`
        )

        if (!response.ok) {
          throw new Error('Failed to load tasks')
        }

        const data = await response.json()

        setTasks(data)
      } catch (error) {
        console.error('Load tasks error:', error)
      }
    }

    loadTasks()
  }, [workspaceId])

  const value = useMemo<TaskStoreValue>(
    () => ({
      tasks,

      saveTask: async (task) => {
        try {
          const existingTask = tasks.some(
            (item) => item.id === task.id
          )

          if (existingTask) {
            const response = await fetch(
              `${API_BASE_URL}/api/tasks/${task.id}`,
              {
                method: 'PUT',

                headers: {
                  'Content-Type': 'application/json',
                },

                body: JSON.stringify(task),
              }
            )

            if (!response.ok) {
              throw new Error(
                'Failed to update task'
              )
            }

            const updatedTask =
              await response.json()

            setTasks((current) =>
              current.map((item) =>
                item.id === updatedTask.id
                  ? updatedTask
                  : item
              )
            )

            return
          }

          const response = await fetch(
            `${API_BASE_URL}/api/tasks`,
            {
              method: 'POST',

              headers: {
                'Content-Type': 'application/json',
              },

              body: JSON.stringify({
                ...task,
                workspaceId:
                  task.workspaceId ??
                  workspaceId,
              }),
            }
          )

          if (!response.ok) {
            throw new Error(
              'Failed to create task'
            )
          }

          const createdTask =
            await response.json()

          setTasks((current) => [
            createdTask,
            ...current,
          ])
        } catch (error) {
          console.error(
            'Save task error:',
            error
          )
        }
      },

      deleteTask: async (id) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/tasks/${id}`,
            {
              method: 'DELETE',
            }
          )

          if (!response.ok) {
            throw new Error(
              'Failed to delete task'
            )
          }

          setTasks((current) =>
            current.filter(
              (task) => task.id !== id
            )
          )
        } catch (error) {
          console.error(
            'Delete task error:',
            error
          )
        }
      },

      moveTask: async (id, status) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/tasks/${id}/status`,
            {
              method: 'PATCH',

              headers: {
                'Content-Type': 'application/json',
              },

              body: JSON.stringify({
                status,
              }),
            }
          )

          if (!response.ok) {
            throw new Error(
              'Failed to move task'
            )
          }

          const updatedTask =
            await response.json()

          setTasks((current) =>
            current.map((task) =>
              task.id === id
                ? updatedTask
                : task
            )
          )
        } catch (error) {
          console.error(
            'Move task error:',
            error
          )
        }
      },
    }),
    [tasks, workspaceId]
  )

  return (
    <TaskStore.Provider value={value}>
      {children}
    </TaskStore.Provider>
  )
}