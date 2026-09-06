import { z } from 'zod'

export const joinWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
})

export const createWorkspaceSchema = z.object({
  workspaceName: z.string().min(1, 'Workspace name is required'),
  memberName: z.string().min(1, 'Your name is required'),
})