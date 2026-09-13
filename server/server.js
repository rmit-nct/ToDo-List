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

const app = express();

app.use(cors());
app.use(express.json());

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
        new: true,
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
        new: true,
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
    const creatorId = crypto.randomUUID();

    const creator = {
      id: creatorId,
      name: creatorName.trim(),
      email: creatorEmail?.trim() || "",
    };

    const newWorkspace = await Workspace.create({
      id: workspaceId,
      name: workspaceName.trim(),
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
    });

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error("Get workspace error:", error);

    res.status(500).json({
      error: "Failed to get workspace",
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
    });

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    const newMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email?.trim() || "",
    };

    workspace.members.push(newMember);

    await workspace.save();

    res.status(201).json(newMember);
  } catch (error) {
    console.error("Join workspace error:", error);

    res.status(500).json({
      error: "Failed to join workspace",
    });
  }
});

const PORT = Number(process.env.PORT || 5001);
let localDatabase;
let server;

async function start() {
  let uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    if (process.env.NODE_ENV === "production") throw new Error("MONGODB_URI is required in production");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const path = require("node:path");
    const fs = require("node:fs/promises");
    const dbPath = path.join(__dirname, ".mongodb-data");
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
start().catch(async (error) => {
  console.error("Database startup failed:", error.message);
  await mongoose.disconnect();
  await localDatabase?.stop();
  process.exit(1);
});
