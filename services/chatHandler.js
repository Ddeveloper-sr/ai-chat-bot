const ChatMemory = require('../models/ChatMemory');
const ChatSettings = require('../models/ChatSettings');
const { getChatCompletion } = require('./groqClient');
const { checkLimits, recordUsage, COOLDOWN_SECONDS } = require('./rateLimiter');
const { resolveSystemPrompt } = require('./personality');
const {
  buildChatReplyContainer,
  buildErrorContainer,
  V2_FLAGS,
} = require('../utils/componentsV2');

/**
 * Core chat logic shared by /chat and @mention triggers.
 * Handles channel-enabled check, rate limits, memory, and the Groq call.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.guildId
 * @param {string} opts.channelId
 * @param {string} opts.content - the user's message text
 * @returns {Promise<{ container: ContainerBuilder, flags: number }>}
 */
async function handleChatMessage({ userId, guildId, channelId, content }) {
  if (guildId) {
    const enabled = await ChatSettings.isChannelEnabled(guildId, channelId);
    if (!enabled) {
      return {
        container: buildErrorContainer(
          'AI chat is not enabled in this channel. Ask a mod to run `/chat-channel enable` here.'
        ),
        flags: V2_FLAGS,
      };
    }
  }

  const limitCheck = await checkLimits(userId);
  if (!limitCheck.allowed) {
    let message;
    if (limitCheck.reason === 'global_cap') {
      message = "The bot has hit its global usage cap for today. Please try again tomorrow.";
    } else if (limitCheck.reason === 'cooldown') {
      message = `Slow down! Try again in ${limitCheck.retryAfterSeconds}s.`;
    } else if (limitCheck.reason === 'daily_cap') {
      message = "You've hit your daily message limit. Try again tomorrow.";
    } else {
      message = 'You are being rate limited. Please try again shortly.';
    }
    return { container: buildErrorContainer(message), flags: V2_FLAGS };
  }

  const history = await ChatMemory.getHistory(userId);
  const systemPrompt = await resolveSystemPrompt(userId, guildId);

  let aiReply;
  try {
    aiReply = await getChatCompletion(systemPrompt, history, content);
  } catch (err) {
    console.error('Groq completion error:', err);
    return {
      container: buildErrorContainer(
        'Something went wrong talking to the AI. Please try again in a moment.'
      ),
      flags: V2_FLAGS,
    };
  }

  await ChatMemory.appendTurn(userId, content, aiReply);
  await recordUsage(userId);

  const container = buildChatReplyContainer({
    userMessage: content,
    aiReply,
  });

  return { container, flags: V2_FLAGS };
}

module.exports = { handleChatMessage, COOLDOWN_SECONDS };
