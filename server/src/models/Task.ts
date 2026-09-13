import mongoose, { Schema, model } from 'mongoose'

const memberSnapshotSchema = new Schema({
  id: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  initials: { type: String, required: true, trim: true, maxlength: 4 },
  color: { type: String, required: true, trim: true, maxlength: 20 },
}, { _id: false })

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 2_000, default: '' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], required: true, default: 'todo', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true, default: 'medium', index: true },
  dueDate: { type: Date, required: true, index: true },
  assignee: { type: memberSnapshotSchema, required: true },
  creator: { type: memberSnapshotSchema, required: true },
  workspaceId: { type: String, required: true, trim: true, maxlength: 80, index: true },
}, {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform: (_document, value) => {
      const json = value as unknown as Record<string, unknown>
      json.id = String(json._id)
      delete json._id
      return json
    },
  },
})

taskSchema.index({ workspaceId: 1, status: 1, dueDate: 1 })
taskSchema.index({ workspaceId: 1, priority: 1 })

export const TaskModel = mongoose.models.Task ?? model('Task', taskSchema)
