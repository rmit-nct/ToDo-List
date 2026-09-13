import 'dotenv/config'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { connectDatabase, databaseIsReady, disconnectDatabase } from './database.js'
import { requireDatabase } from './middleware/requireDatabase.js'
import { memberRouter } from './routes/members.js'
import { taskRouter } from './routes/tasks.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.status(databaseIsReady() ? 200 : 503).json({
    status: databaseIsReady() ? 'ok' : 'degraded',
    database: databaseIsReady() ? 'connected' : 'disconnected',
  })
})
app.use('/api/tasks', requireDatabase, taskRouter)
app.use('/api/members', requireDatabase, memberRouter)

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Validation failed', issues: error.issues })
    return
  }
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: error.message })
    return
  }
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    res.status(409).json({ message: 'A record with those details already exists' })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'Unexpected server error' })
})

const server = app.listen(port, () => {
  console.log(`NEO API listening on http://localhost:${port}`)
})

connectDatabase()
  .then(() => console.log('MongoDB connected'))
  .catch((error: unknown) => console.error(error instanceof Error ? error.message : error))

async function shutdown() {
  server.close()
  await disconnectDatabase()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
