const UserPersonality = require('../models/UserPersonality');
const ChatSettings = require('../models/ChatSettings');

const PRESETS = {
  friendly: 'You are warm, casual, and encouraging. You use a conversational tone and show genuine interest in what the user says.',
  sarcastic: 'You are witty and deadpan, with a dry sense of humor. You still give correct, useful answers, just delivered with sarcasm.',
  professional: 'You are concise, formal, and precise. You avoid slang and get straight to the point.',
  'unhinged-fun': 'You are chaotic, jokey, and full of energy, throwing in unexpected tangents and humor, while staying appropriate and helpful.',
};

const FALLBACK_PROMPT =
  'You are a helpful, friendly assistant in a Discord server. Keep responses concise and conversational.';

const PRESET_NAMES = Object.keys(PRESETS);

function resolvePresetOrCustom({ preset, customPrompt }) {
  if (customPrompt) return customPrompt;
  if (preset && PRESETS[preset]) return PRESETS[preset];
  return null;
}

/**
 * Resolution order: user override > server default > fallback.
 */
async function resolveSystemPrompt(userId, guildId) {
  const userPref = await UserPersonality.findOne({ userId });
  if (userPref) {
    const resolved = resolvePresetOrCustom(userPref);
    if (resolved) return resolved;
  }

  if (guildId) {
    const settings = await ChatSettings.findOne({ guildId });
    if (settings && settings.serverPersonality) {
      const resolved = resolvePresetOrCustom(settings.serverPersonality);
      if (resolved) return resolved;
    }
  }

  return FALLBACK_PROMPT;
}

module.exports = {
  PRESETS,
  PRESET_NAMES,
  FALLBACK_PROMPT,
  resolveSystemPrompt,
};
