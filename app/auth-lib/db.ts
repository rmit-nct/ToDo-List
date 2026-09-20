import { AsyncLocalStorage } from "node:async_hooks";
import type { MongoClient, Db } from "mongodb";
import { ensureInviteCodeIndex } from "./indexes";

type DatabaseScope = { client?: MongoClient; pending?: Promise<Db> };
const scope = new AsyncLocalStorage<DatabaseScope>();
// Database indexes are server state. Only sockets must remain request scoped.
let indexesReady = false;
export async function withDatabase<T>(run: () => Promise<T>): Promise<T> {
  if (scope.getStore()) return run();
  const state: DatabaseScope = {};
  return scope.run(state, async () => {
    try {
      return await run();
    } finally {
      await state.client?.close();
    }
  });
}
export async function db(): Promise<Db> {
  const state = scope.getStore();
  if (!state) throw new Error("Database access requires a request scope");
  state.pending ??= connect(state);
  return state.pending;
}
async function connect(state: DatabaseScope): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Database is not configured");
  // Load the driver inside a request: BSON initialization uses randomness.
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri, {
    maxPoolSize: 2,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    serverMonitoringMode: "poll",
    retryWrites: true,
  });
  state.client = client;
  await client.connect();
  const database = client.db(process.env.MONGODB_DB || "nct-todo");
  if (!indexesReady) {
    await Promise.all([
      database.collection("users").createIndex({ email: 1 }, { unique: true }),
      database.collection("users").createIndex({ id: 1 }, { unique: true }),
      database.collection("users").createIndex(
        { username: 1 },
        {
          unique: true,
          partialFilterExpression: { username: { $type: "string" } },
        },
      ),
      database
        .collection("workspaces")
        .createIndex({ id: 1 }, { unique: true }),
      database.collection("workspaces").createIndex({ memberIds: 1 }),
      ensureInviteCodeIndex(database),
      database.collection("tasks").createIndex({ id: 1 }, { unique: true }),
      database.collection("tasks").createIndex({ workspaceId: 1, dueDate: 1 }),
      database.collection("limits").createIndex({ key: 1 }, { unique: true }),
      database
        .collection("limits")
        .createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
    ]);
    indexesReady = true;
  }
  return database;
}
