import mongoose from "mongoose";
let pending: Promise<typeof mongoose> | undefined;
let indexes: Promise<unknown> | undefined;
export async function db() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Database is not configured");
  pending ??= mongoose
    .connect(uri, {
      dbName: process.env.MONGODB_DB || "nct-todo",
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    });
  await pending;
  const database = mongoose.connection.db!;
  indexes ??= Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("users").createIndex({ id: 1 }, { unique: true }),
    database
      .collection("users")
      .createIndex(
        { username: 1 },
        {
          unique: true,
          partialFilterExpression: { username: { $type: "string" } },
        },
      ),
    database.collection("workspaces").createIndex({ id: 1 }, { unique: true }),
    database.collection("workspaces").createIndex({ memberIds: 1 }),
    database
      .collection("workspaces")
      .createIndex({ inviteCode: 1 }, { unique: true }),
    database.collection("tasks").createIndex({ id: 1 }, { unique: true }),
    database.collection("tasks").createIndex({ workspaceId: 1, dueDate: 1 }),
    database.collection("limits").createIndex({ key: 1 }, { unique: true }),
    database
      .collection("limits")
      .createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
  ]).catch((error) => {
    indexes = undefined;
    throw error;
  });
  await indexes;
  return database;
}
