const mongoose = require('mongoose');

const ChatSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabledChannels: { type: [String], default: [] }, // opt-in: empty = disabled everywhere
  adminRoleId: { type: String, default: null },
  serverPersonality: {
    preset: { type: String, default: null },
    customPrompt: { type: String, default: null },
  },
});

ChatSettingsSchema.statics.getOrCreate = async function (guildId) {
  let doc = await this.findOne({ guildId });
  if (!doc) {
    doc = await this.create({ guildId });
  }
  return doc;
};

ChatSettingsSchema.statics.isChannelEnabled = async function (guildId, channelId) {
  const doc = await this.findOne({ guildId });
  if (!doc) return false;
  return doc.enabledChannels.includes(channelId);
};

module.exports = mongoose.model('ChatSettings', ChatSettingsSchema);
