const mongoose = require('mongoose');

const ChatUsageSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  lastMessageAt: { type: Date, default: null },
  dailyCount: { type: Number, default: 0 },
  dailyResetAt: { type: Date, default: null },
});

// Global usage doc uses a fixed, well-known _id.
const GLOBAL_ID = 'global';

const GlobalUsageSchema = new mongoose.Schema({
  _id: { type: String, default: GLOBAL_ID },
  dailyCount: { type: Number, default: 0 },
  dailyResetAt: { type: Date, default: null },
});

function nextMidnightUTC() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next;
}

ChatUsageSchema.statics.getOrCreate = async function (userId) {
  let doc = await this.findOne({ userId });
  if (!doc) {
    doc = await this.create({ userId, dailyResetAt: nextMidnightUTC() });
  }
  if (doc.dailyResetAt && doc.dailyResetAt <= new Date()) {
    doc.dailyCount = 0;
    doc.dailyResetAt = nextMidnightUTC();
    await doc.save();
  }
  return doc;
};

ChatUsageSchema.statics.recordUsage = async function (userId) {
  const doc = await this.getOrCreate(userId);
  doc.lastMessageAt = new Date();
  doc.dailyCount += 1;
  await doc.save();
  return doc;
};

const ChatUsage = mongoose.model('ChatUsage', ChatUsageSchema);

const GlobalUsage = mongoose.model('GlobalUsage', GlobalUsageSchema);

GlobalUsage.getOrCreate = async function () {
  let doc = await this.findById(GLOBAL_ID);
  if (!doc) {
    doc = await this.create({ _id: GLOBAL_ID, dailyResetAt: nextMidnightUTC() });
  }
  if (doc.dailyResetAt && doc.dailyResetAt <= new Date()) {
    doc.dailyCount = 0;
    doc.dailyResetAt = nextMidnightUTC();
    await doc.save();
  }
  return doc;
};

GlobalUsage.recordUsage = async function () {
  const doc = await this.getOrCreate();
  doc.dailyCount += 1;
  await doc.save();
  return doc;
};

module.exports = { ChatUsage, GlobalUsage, nextMidnightUTC };
