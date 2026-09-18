// Pull in the tools we installed
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();

const Workspace = require("./models/Workspace");
const Task = require("./models/Task");

// Pull in our mock data (destructuring, same idea as on the frontend)
const { mockMembers, } = require("./mockData");

const { router: accountRouter, optionalUser, encryptionKey, issueSession, publicUser } = require('./account');
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
app.post('/api/username-session', async (req, res) => {
  if (!req.usernameAccount) return res.status(401).json({ error: 'Please enter your username again.' });
  await issueSession(res, req.usernameAccount.id);
  res.json(publicUser(req.usernameAccount));
});

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
    if (!req.account || !workspace.members.some(member => member.userId === req.account.id)) return res.status(403).json({ error: 'Join this workspace to access its tasks.' });
    if (req.method === 'DELETE' && workspace.ownerId !== req.account.id && req.existingTask?.creator?.id !== req.account.id) return res.status(403).json({ error: 'Only the creator or workspace owner can delete a task.' });
    if (['POST', 'PUT'].includes(req.method)) {
      const assigneeId = req.body.assignedMemberId || req.body.assignee?.id;
      const assignee = workspace.members.find(member => member.id === assigneeId);
      if (!assignee) return res.status(400).json({ error: 'Choose a workspace member as assignee.' });
      const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      req.body.assignee = { id: assignee.id, name: assignee.name, initials: initials(assignee.name), color: '#4896ac' };
      req.body.assignedMemberId = assignee.id;
      req.body.creator = req.existingTask?.creator || { id: req.account.id, name: req.account.name, initials: initials(req.account.name), color: '#4896ac' };
    }
  }
  if (req.existingTask && req.body) {
    req.body.workspaceId = workspaceId;
    req.body.id = req.existingTask.id;
    req.body.createdAt = req.existingTask.createdAt;
  }
  next();
});

// --- GET /api/tasks ---
// Supports optional query params: ?workspaceId=&search=&status=&priority=
// Example: /api/tasks?workspaceId=abc123&status=To Do&priority=High
app.get("/api/tasks", async (req, res) => {
  try {
    // req.query holds whatever comes after the "?" in the URL, as an object
    const { workspaceId, search, status, priority } = req.query;

    const filter = {};

    if (workspaceId) {
      filter.workspaceId = workspaceId;
    }

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const result = await Task.find(filter);

    // res.json() sends the data back as JSON, and sets the right headers automatically
    res.json(result);
  } catch (error) {
    console.error("Get tasks error:", error);

    res.status(500).json({
      error: "Failed to get tasks",
    });
  }
});

// --- POST /api/tasks ---
// Create a new task for a workspace
app.post("/api/tasks", async (req, res) => {
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
      return res.status(400).json({
        error: "Workspace ID is required",
      });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        error: "Task title is required",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        error: "Due date is required",
      });
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

    res.status(500).json({
      error: "Failed to create task",
    });
  }
});

// --- PUT /api/tasks/:taskId ---
// Update an existing task
app.put("/api/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId },
      req.body,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      error: "Failed to update task",
    });
  }
});

// --- PATCH /api/tasks/:taskId/status ---
// Move a task to another status
app.patch("/api/tasks/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId },
      { status },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Move task error:", error);

    res.status(500).json({
      error: "Failed to move task",
    });
  }
});

// --- DELETE /api/tasks/:taskId ---
// Delete a task
app.delete("/api/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const deletedTask = await Task.findOneAndDelete({
      id: taskId,
    });

    if (!deletedTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      error: "Failed to delete task",
    });
  }
});

// --- GET /api/members ---
// Just returns the whole list, no filtering needed per the spec
app.get("/api/members", (req, res) => {
  res.json(mockMembers);
});

// --- POST /api/members ---
// Adds a new member to the (currently in-memory) list
app.post("/api/members", (req, res) => {
  // req.body holds the JSON data sent by whoever called this route
  const { name, email } = req.body;

  // Basic validation: reject the request if name is missing
  if (!name || name.trim() === "") {
    // 400 = "Bad Request" — the client sent something invalid
    return res.status(400).json({ error: "Name is required" });
  }

  const newMember = {
    id: Date.now().toString(), // simple unique-ish id for now, since there's no real DB yet
    name,
    email: email || undefined,
  };

  mockMembers.push(newMember); // add it to our in-memory array

  // 201 = "Created" — the standard status code for a successful POST that made something new
  res.status(201).json(newMember);
});

// --- POST /api/workspaces ---
// Create a new workspace
app.post("/api/workspaces", async (req, res) => {
  try {
    const { workspaceName, creatorName, creatorEmail } = req.body;

    if (!workspaceName || workspaceName.trim() === "") {
      return res.status(400).json({
        error: "Workspace name is required",
      });
    }

    if (!creatorName || creatorName.trim() === "") {
      return res.status(400).json({
        error: "Creator name is required",
      });
    }

    const workspaceId = crypto.randomUUID();
    const creatorId = req.account?.id || crypto.randomUUID();

    const creator = {
      id: creatorId,
      userId: req.account?.id || '',
      role: req.account ? 'owner' : 'member',
      title: req.account?.title || '',
      name: req.account?.name || creatorName.trim(),
      email: req.account?.authMode === "username" ? "" : req.account?.email || creatorEmail?.trim() || "",
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

    res.status(500).json({
      error: "Failed to create workspace",
    });
  }
});


// --- GET /api/workspaces/:workspaceId ---
// Find one workspace using its ID
app.get("/api/workspaces/:workspaceId", async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findOne({
      id: workspaceId,
      deleting: { $ne: true },
    });

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    if (workspace.ownerId && !workspace.members.some(member => member.userId === req.account?.id)) {
      return res.json({ id: workspace.id, name: workspace.name, members: [], ownerId: workspace.ownerId });
    }
    res.json({ ...workspace.toObject(), currentMemberId: req.account?.id || '' });
  } catch (error) {
    console.error("Get workspace error:", error);

    res.status(500).json({
      error: "Failed to get workspace",
    });
  }
});


// --- PATCH /api/workspaces/:workspaceId ---
// Update an existing workspace
app.patch("/api/workspaces/:workspaceId", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;
    const workspace = await Workspace.findOne({ id: workspaceId, deleting: { $ne: true } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });
    if (!workspace.ownerId || workspace.ownerId !== req.account?.id) return res.status(403).json({ error: 'Only a verified workspace owner can change its name.' });
    if (typeof name !== 'string' || name.trim().length > 80) return res.status(400).json({ error: 'Use a workspace name of 1-80 characters.' });

    if (!name || name.trim() === "") {
      return res.status(400).json({
        error: "Workspace name is required",
      });
    }

    const updatedWorkspace = await Workspace.findOneAndUpdate(
      {
        id: workspaceId,
      },
      {
        name: name.trim(),
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!updatedWorkspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    res.json(updatedWorkspace);
  } catch (error) {
    console.error("Update workspace error:", error);

    res.status(500).json({
      error: "Failed to update workspace",
    });
  }
});


// --- POST /api/workspaces/:workspaceId/members ---
// Join an existing workspace
app.post("/api/workspaces/:workspaceId/members", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, email } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    const workspace = await Workspace.findOne({
      id: workspaceId,
      deleting: { $ne: true },
    });

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    if (workspace.ownerId && !req.account) return res.status(401).json({ error: 'Sign in before joining this workspace.' });
    const existingMember = req.account && workspace.members.find(member => member.userId === req.account.id);
    if (existingMember) return res.json(existingMember);
    const newMember = {
      userId: req.account?.id || '',
      role: 'member',
      title: req.account?.title || '',
      id: req.account?.id || crypto.randomUUID(),
      name: req.account?.name || name.trim(),
      email: req.account?.authMode === "username" ? "" : req.account?.email || email?.trim() || "",
    };

    const updated = await Workspace.findOneAndUpdate(
      { id: workspace.id, 'members.id': { $ne: newMember.id }, deleting: { $ne: true } },
      { $push: { members: newMember } }, { returnDocument: 'after', runValidators: true }
    );
    if (!updated) {
      const latest = await Workspace.findOne({ id: workspace.id, deleting: { $ne: true } });
      const existing = latest?.members.find(member => member.id === newMember.id);
      if (existing) return res.json(existing);
      return res.status(409).json({ error: 'Workspace changed. Please try again.' });
    }

    res.status(201).json(newMember);
  } catch (error) {
    console.error("Join workspace error:", error);

    res.status(500).json({
      error: "Failed to join workspace",
    });
  }
});

app.get('/api/invites/:code', async (req, res) => {
  const workspace = await Workspace.findOne({ inviteCode: req.params.code.toUpperCase(), deleting: { $ne: true } });
  if (!workspace) return res.status(404).json({ error: 'Invite code not found.' });
  res.json({ id: workspace.id, name: workspace.name });
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.status === 400 ? 400 : 500).json({ error: 'The request could not be completed. Please try again.' });
});

const PORT = Number(process.env.PORT || 5001);
let localDatabase;
let server;

async function start() {
  encryptionKey();
  let uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    if (process.env.NODE_ENV === "production") throw new Error("MONGODB_URI is required in production");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const path = require("node:path");
    const fs = require("node:fs/promises");
    const dbPath = path.join(__dirname, process.env.LOCAL_DB_DIRECTORY || ".mongodb-data");
    await fs.mkdir(dbPath, { recursive: true });
    localDatabase = await MongoMemoryServer.create({
      instance: { dbPath, dbName: "neo-workspaces", storageEngine: "wiredTiger" },
    });
    uri = localDatabase.getUri("neo-workspaces");
  }
  await mongoose.connect(uri);
  server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

async function shutdown() {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await localDatabase?.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
if (require.main === module) start().catch(async (error) => {
  console.error("Database startup failed:", error.message);
  await mongoose.disconnect();
  await localDatabase?.stop();
  process.exit(1);
});
module.exports = { app };
