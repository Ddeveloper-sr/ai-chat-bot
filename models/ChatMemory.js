const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  messages: { type: [MessageSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

// Max number of messages (user+assistant turns combined) kept per user.
const MAX_MESSAGES = 20;

/**
 * Appends a user message + assistant reply to a user's memory,
 * trimming to the rolling window cap. Creates the doc if missing.
 */
ChatMemorySchema.statics.appendTurn = async function (userId, userContent, assistantContent) {
  const doc = await this.findOneAndUpdate(
    { userId },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', content: userContent, timestamp: new Date() },
            { role: 'assistant', content: assistantContent, timestamp: new Date() },
          ],
          $slice: -MAX_MESSAGES,
        },
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, new: true }
  );
  return doc;
};

ChatMemorySchema.statics.getHistory = async function (userId) {
  const doc = await this.findOne({ userId });
  return doc ? doc.messages : [];
};

ChatMemorySchema.statics.clearHistory = async function (userId) {
  await this.deleteOne({ userId });
};

module.exports = mongoose.model('ChatMemory', ChatMemorySchema);
