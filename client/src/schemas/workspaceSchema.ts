import { z } from 'zod'

export const joinWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
})