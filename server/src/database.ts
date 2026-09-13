import mongoose from 'mongoose'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

type LocalMongoServer = Awaited<ReturnType<typeof startLocalMongo>>

let localMongoServer: LocalMongoServer | undefined

async function startLocalMongo() {
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const dataPath = resolve(process.cwd(), '.mongodb-data')
  await mkdir(dataPath, { recursive: true })
  return MongoMemoryServer.create({
    instance: {
      dbName: 'neo-todo',
      dbPath: dataPath,
      storageEngine: 'wiredTiger',
    },
  })
}

export async function connectDatabase() {
  let uri = process.env.MONGODB_URI?.trim()

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production.')
    }

    localMongoServer = await startLocalMongo()
    uri = localMongoServer.getUri()
    console.log('Using the local development MongoDB database')
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8_000 })
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
  await localMongoServer?.stop()
  localMongoServer = undefined
}

export function databaseIsReady() {
  return mongoose.connection.readyState === 1
}
