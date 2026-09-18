const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    userId: { type: String, default: '' },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    title: { type: String, default: '' },
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const workspaceSchema = new mongoose.Schema(
  {
    ownerId: { type: String, default: '', index: true },
    inviteCode: { type: String, unique: true, sparse: true },
    deleting: { type: Boolean, default: false },
    id: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    members: {
      type: [memberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Workspace = mongoose.model(
  "Workspace",
  workspaceSchema
);

module.exports = Workspace;
