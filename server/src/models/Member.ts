import mongoose, { Schema, model } from 'mongoose'

const memberSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  initials: { type: String, required: true, trim: true, uppercase: true, maxlength: 4 },
  color: { type: String, required: true, trim: true, maxlength: 20 },
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

memberSchema.index({ workspaceId: 1, email: 1 }, { unique: true, sparse: true })

export const MemberModel = mongoose.models.Member ?? model('Member', memberSchema)
