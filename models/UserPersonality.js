const mongoose = require('mongoose');

const UserPersonalitySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  preset: { type: String, default: null },
  customPrompt: { type: String, default: null },
});

module.exports = mongoose.model('UserPersonality', UserPersonalitySchema);
