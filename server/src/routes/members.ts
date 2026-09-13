import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { MemberModel } from '../models/Member.js'

export const memberRouter = Router()

const memberInput = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  initials: z.string().trim().min(1).max(4),
  color: z.string().trim().min(1).max(20),
  workspaceId: z.string().trim().min(1).max(80),
})

memberRouter.get('/', async (req, res, next) => {
  try {
    const { workspaceId } = z.object({ workspaceId: z.string().trim().min(1).max(80) }).parse(req.query)
    res.json(await MemberModel.find({ workspaceId }).sort({ name: 1 }))
  } catch (error) {
    next(error)
  }
})

memberRouter.post('/', async (req, res, next) => {
  try {
    const member = await MemberModel.create(memberInput.parse(req.body))
    res.status(201).json(member)
  } catch (error) {
    next(error)
  }
})

memberRouter.put('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid member id' })
      return
    }
    const member = await MemberModel.findByIdAndUpdate(req.params.id, memberInput.parse(req.body), { new: true, runValidators: true })
    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }
    res.json(member)
  } catch (error) {
    next(error)
  }
})

memberRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid member id' })
      return
    }
    const member = await MemberModel.findByIdAndDelete(req.params.id)
    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
