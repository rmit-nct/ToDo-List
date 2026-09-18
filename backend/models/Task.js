const mongoose = require("../runtime-mongoose");

const memberSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    initials: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    workspaceId: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "todo",
        "in-progress",
        "done",
      ],
      required: true,
    },

    priority: {
      type: String,
      enum: [
        "low",
        "medium",
        "high",
      ],
      required: true,
    },

    dueDate: {
      type: String,
      required: true,
    },

    assignedMemberId: {
      type: String,
      default: "",
    },

    assignee: {
      type: memberSchema,
      required: false,
    },

    creator: {
      type: memberSchema,
      required: false,
    },

    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model(
  "Task",
  taskSchema
);

module.exports = Task;