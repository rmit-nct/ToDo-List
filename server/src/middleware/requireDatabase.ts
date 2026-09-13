import type { NextFunction, Request, Response } from 'express'
import { databaseIsReady } from '../database.js'

export function requireDatabase(_req: Request, res: Response, next: NextFunction) {
  if (!databaseIsReady()) {
    res.status(503).json({ message: 'Database is not connected. Check MONGODB_URI and the server logs.' })
    return
  }

  next()
}
