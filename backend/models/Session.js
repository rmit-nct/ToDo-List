const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});
module.exports = mongoose.model('Session', schema);
