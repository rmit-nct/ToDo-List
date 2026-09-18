import express, { Request, Response } from "express";
import cors from "cors";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// These model files are still plain JavaScript (.js), so we import them
// the CommonJS way. Make sure tsconfig.json has "allowJs": true or this
// import will fail to type-check (see note below).
const Workspace = require("./models/Workspace");
const Task = require("./models/Task");

import { mockMembers } from "./mockData";
import type { TeamMember } from "./types";

const { router: accountRouter, optionalUser, encryptionKey } = require('./account');
type WorkspaceMember = {
  id: string;
  userId?: string;
  role?: string;
  title?: string;
  name: string;
  email?: string;
};

const app = express();
const allowedOrigins = (process.env.APP_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174').split(',').map(value => value.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '64kb' }));
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) return res.status(403).json({ error: 'Origin is not allowed.' });
    if (!req.is('application/json')) return res.status(415).json({ error: 'Use application/json.' });
  }
  next();
});
app.use(optionalUser);
app.use('/api', accountRouter);

// Enforce membership on account-backed workspaces; preserve legacy link workspaces.
app.use('/api/tasks', async (req, res, next) => {
  let workspaceId = req.query.workspaceId || req.body?.workspaceId;
  const taskId = req.path.split('/')[1];
  if (taskId) {
    const task = await Task.findOne({ id: taskId });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    workspaceId = task.workspaceId;
    req.existingTask = task;
  }
  if (typeof workspaceId !== 'string' || !workspaceId) return res.status(400).json({ error: 'Workspace ID is required.' });
  const workspace = await Workspace.findOne({ id: workspaceId, deleting: { $ne: true } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });
  if (workspace.ownerId) {
    const account = req.account;
    if (!account || !workspace.members.some((member: WorkspaceMember) => member.userId === account.id)) return res.status(403).json({ error: 'Join this workspace to access its tasks.' });
    if (req.method === 'DELETE' && workspace.ownerId !== account.id && req.existingTask?.creator?.id !== account.id) return res.status(403).json({ error: 'Only the creator or workspace owner can delete a task.' });
    if (['POST', 'PUT'].includes(req.method)) {
      const assigneeId = req.body.assignedMemberId || req.body.assignee?.id;
            const assignee = workspace.members.find((member: WorkspaceMember) => member.id === assigneeId);
      if (!assignee) return res.status(400).json({ error: 'Choose a workspace member as assignee.' });
            const initials = (name: string) => name.split(/\s+/).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase();
      req.body.assignee = { id: assignee.id, name: assignee.name, initials: initials(assignee.name), color: '#4896ac' };
      req.body.assignedMemberId = assignee.id;
            req.body.creator = req.existingTask?.creator || { id: account.id, name: account.name, initials: initials(account.name), color: '#4896ac' };
    }
  }
  if (req.existingTask && req.body) {
    req.body.workspaceId = workspaceId;
    req.body.id = req.existingTask.id;
    req.body.createdAt = req.existingTask.createdAt;
  }
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running!");
});

// --- GET /api/tasks ---
app.get("/api/tasks", async (req: Request, res: Response) => {
  try {
    const { workspaceId, search, status, priority } = req.query;

    const filter: Record<string, unknown> = {};

    if (workspaceId) filter.workspaceId = workspaceId;
    if (search) filter.title = { $regex: search, $options: "i" };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const result = await Task.find(filter);
    res.json(result);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

// --- POST /api/tasks ---
app.post("/api/tasks", async (req: Request, res: Response) => {
  try {
    const {
      workspaceId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedMemberId,
      assignee,
      creator,
      createdAt,
    } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Task title is required" });
    }
    if (!dueDate) {
      return res.status(400).json({ error: "Due date is required" });
    }

    const newTask = await Task.create({
      id: crypto.randomUUID(),
      workspaceId,
      title: title.trim(),
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      dueDate,
      assignedMemberId: assignedMemberId || "",
      assignee: assignee || undefined,
      creator: creator || undefined,
      createdAt: createdAt || new Date().toISOString(),
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// --- PUT /api/tasks/:taskId ---
app.put("/api/tasks/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// --- PATCH /api/tasks/:taskId/status ---
app.patch("/api/tasks/:taskId/status", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Move task error:", error);
    res.status(500).json({ error: "Failed to move task" });
  }
});

// --- DELETE /api/tasks/:taskId ---
app.delete("/api/tasks/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const deletedTask = await Task.findOneAndDelete({ id: taskId });

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// --- GET /api/members ---
// NOTE: this is still the OLD global in-memory member list, separate from
// Workspace.members. Flagged for the team to reconcile — see chat notes.
app.get("/api/members", (req: Request, res: Response) => {
  res.json(mockMembers);
});

// --- POST /api/members ---
app.post("/api/members", (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  const newMember: TeamMember = {
    id: Date.now().toString(),
    name,
    email: email || undefined,
  };

  mockMembers.push(newMember);
  res.status(201).json(newMember);
});

// --- POST /api/workspaces ---
app.post("/api/workspaces", async (req: Request, res: Response) => {
  try {
    const { workspaceName, creatorName, creatorEmail } = req.body;

    if (!workspaceName || workspaceName.trim() === "") {
      return res.status(400).json({ error: "Workspace name is required" });
    }
    if (!creatorName || creatorName.trim() === "") {
      return res.status(400).json({ error: "Creator name is required" });
    }

    const workspaceId = crypto.randomUUID();
    const creatorId = req.account?.id || crypto.randomUUID();

    const creator = {
      id: creatorId,
      userId: req.account?.id || '',
      role: req.account ? 'owner' : 'member',
      title: req.account?.title || '',
      name: req.account?.name || creatorName.trim(),
      email: req.account?.email || creatorEmail?.trim() || "",
    };

    const newWorkspace = await Workspace.create({
      id: workspaceId,
      name: workspaceName.trim(),
      ownerId: req.account?.id || '',
      inviteCode: 'NCT-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
      members: [creator],
    });

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error("Create workspace error:", error);
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

// --- GET /api/workspaces/:workspaceId ---
app.get("/api/workspaces/:workspaceId", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findOne({ id: workspaceId });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

      if (workspace.ownerId && !workspace.members.some((member: WorkspaceMember) => member.userId === req.account?.id)) {
      return res.json({ id: workspace.id, name: workspace.name, members: [], ownerId: workspace.ownerId });
    }
    res.json({ ...workspace.toObject(), currentMemberId: req.account?.id || '' });
  } catch (error) {
    console.error("Get workspace error:", error);
    res.status(500).json({ error: "Failed to get workspace" });
  }
});

// --- PATCH /api/workspaces/:workspaceId ---
// New in main: rename an existing workspace. Powers WorkspaceManagePage.tsx.
app.patch("/api/workspaces/:workspaceId", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;
    const workspace = await Workspace.findOne({ id: workspaceId, deleting: { $ne: true } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });
    if (!workspace.ownerId || workspace.ownerId !== req.account?.id) return res.status(403).json({ error: 'Only a verified workspace owner can change its name.' });
    if (typeof name !== 'string' || name.trim().length > 80) return res.status(400).json({ error: 'Use a workspace name of 1-80 characters.' });

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Workspace name is required" });
    }

    const updatedWorkspace = await Workspace.findOneAndUpdate(
      { id: workspaceId },
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedWorkspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json(updatedWorkspace);
  } catch (error) {
    console.error("Update workspace error:", error);
    res.status(500).json({ error: "Failed to update workspace" });
  }
});

// --- POST /api/workspaces/:workspaceId/members ---
app.post("/api/workspaces/:workspaceId/members", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { name, email } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    const workspace = await Workspace.findOne({ id: workspaceId });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (workspace.ownerId && !req.account) return res.status(401).json({ error: 'Sign in before joining this workspace.' });
    const account = req.account;
    const existingMember = account && workspace.members.find((member: WorkspaceMember) => member.userId === account.id);
    if (existingMember) return res.json(existingMember);
    const newMember = {
      userId: req.account?.id || '',
      role: 'member',
      title: req.account?.title || '',
      id: req.account?.id || crypto.randomUUID(),
      name: req.account?.name || name.trim(),
      email: req.account?.email || email?.trim() || "",
    };

    workspace.members.push(newMember);
    await workspace.save();

    res.status(201).json(newMember);
  } catch (error) {
    console.error("Join workspace error:", error);
    res.status(500).json({ error: "Failed to join workspace" });
  }
});

// --- Startup / shutdown ---
// New in main: default port 5001 (matches the frontend's fallback in
// client/src/api.ts), and if MONGODB_URI isn't set, spin up a local
// in-memory MongoDB instead of requiring everyone to have a real Atlas
// connection string just to run the app locally. Only hard-fails on a
// missing URI in production.
const PORT = Number(process.env.PORT || 5001);

let localDatabase: import("mongodb-memory-server").MongoMemoryServer | undefined;
let server: ReturnType<typeof app.listen> | undefined;

async function start() {
  encryptionKey();
  let uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is required in production");
    }

    const { MongoMemoryServer } = require("mongodb-memory-server");
    const path = require("node:path");
    const fs = require("node:fs/promises");

    const dbPath = path.join(__dirname, ".mongodb-data");
    await fs.mkdir(dbPath, { recursive: true });

    const memoryServer = await MongoMemoryServer.create({
      instance: { dbPath, dbName: "neo-workspaces", storageEngine: "wiredTiger" },
    });
    localDatabase = memoryServer;
    uri = memoryServer.getUri("neo-workspaces");
  }

  await mongoose.connect(uri as string);

  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function shutdown() {
  if (server) await new Promise((resolve) => server!.close(resolve));
  await mongoose.disconnect();
  await localDatabase?.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error("Database startup failed:", error.message);
  await mongoose.disconnect();
  await localDatabase?.stop();
  process.exit(1);
});
module.exports = { app };
