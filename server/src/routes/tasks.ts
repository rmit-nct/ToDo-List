import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { TaskModel } from '../models/Task.js'

export const taskRouter = Router()

const memberSnapshot = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(100),
  initials: z.string().trim().min(1).max(4),
  color: z.string().trim().min(1).max(20),
})

const taskInput = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(2_000).default(''),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.coerce.date(),
  assignee: memberSnapshot,
  creator: memberSnapshot,
  workspaceId: z.string().trim().min(1).max(80),
})

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

taskRouter.get('/', async (req, res, next) => {
  try {
    const query = z.object({
      workspaceId: z.string().trim().min(1).max(80),
      status: z.enum(['todo', 'in-progress', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      q: z.string().trim().max(140).optional(),
      sort: z.enum(['dueDate', 'newest', 'title']).default('dueDate'),
    }).parse(req.query)

    const filter: Record<string, unknown> = { workspaceId: query.workspaceId }
    if (query.status) filter.status = query.status
    if (query.priority) filter.priority = query.priority
    if (query.q) filter.title = { $regex: escapeRegex(query.q), $options: 'i' }

    const sort: Record<string, 1 | -1> = query.sort === 'newest' ? { createdAt: -1 }
      : query.sort === 'title' ? { title: 1 as const }
        : { dueDate: 1 as const }
    const tasks = await TaskModel.find(filter).sort(sort)
    res.json(tasks)
  } catch (error) {
    next(error)
  }
})

taskRouter.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid task id' })
      return
    }
    const task = await TaskModel.findById(req.params.id)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.json(task)
  } catch (error) {
    next(error)
  }
})

taskRouter.post('/', async (req, res, next) => {
  try {
    const input = taskInput.parse(req.body)
    const task = await TaskModel.create(input)
    res.status(201).json(task)
  } catch (error) {
    next(error)
  }
})

taskRouter.put('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid task id' })
      return
    }
    const input = taskInput.parse(req.body)
    const task = await TaskModel.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true })
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.json(task)
  } catch (error) {
    next(error)
  }
})

taskRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid task id' })
      return
    }
    const input = taskInput.partial().parse(req.body)
    const task = await TaskModel.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true })
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.json(task)
  } catch (error) {
    next(error)
  }
})

taskRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid task id' })
      return
    }
    const task = await TaskModel.findByIdAndDelete(req.params.id)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
