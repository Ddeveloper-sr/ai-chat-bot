const { ChatUsage, GlobalUsage } = require('../models/ChatUsage');

// Tune these as needed.
const COOLDOWN_SECONDS = 8;
const USER_DAILY_CAP = 30;
const GLOBAL_DAILY_CAP = 500;

/**
 * Checks whether a user is allowed to send a chat message right now.
 * Does NOT record usage — call recordUsage() separately after a
 * successful AI response, so failed calls don't burn quota.
 *
 * @returns {Promise<{allowed: boolean, reason?: string, retryAfterSeconds?: number}>}
 */
async function checkLimits(userId) {
  const global = await GlobalUsage.getOrCreate();
  if (global.dailyCount >= GLOBAL_DAILY_CAP) {
    return {
      allowed: false,
      reason: 'global_cap',
    };
  }

  const user = await ChatUsage.getOrCreate(userId);

  if (user.lastMessageAt) {
    const elapsedMs = Date.now() - user.lastMessageAt.getTime();
    const remainingMs = COOLDOWN_SECONDS * 1000 - elapsedMs;
    if (remainingMs > 0) {
      return {
        allowed: false,
        reason: 'cooldown',
        retryAfterSeconds: Math.ceil(remainingMs / 1000),
      };
    }
  }

  if (user.dailyCount >= USER_DAILY_CAP) {
    return {
      allowed: false,
      reason: 'daily_cap',
    };
  }

  return { allowed: true };
}

async function recordUsage(userId) {
  await ChatUsage.recordUsage(userId);
  await GlobalUsage.recordUsage();
}

async function getStatus(userId) {
  const user = await ChatUsage.getOrCreate(userId);
  const global = await GlobalUsage.getOrCreate();

  let cooldownRemaining = 0;
  if (user.lastMessageAt) {
    const elapsedMs = Date.now() - user.lastMessageAt.getTime();
    const remainingMs = COOLDOWN_SECONDS * 1000 - elapsedMs;
    cooldownRemaining = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  return {
    cooldownRemaining,
    dailyUsed: user.dailyCount,
    dailyCap: USER_DAILY_CAP,
    dailyRemaining: Math.max(0, USER_DAILY_CAP - user.dailyCount),
    globalUsed: global.dailyCount,
    globalCap: GLOBAL_DAILY_CAP,
  };
}

module.exports = {
  checkLimits,
  recordUsage,
  getStatus,
  COOLDOWN_SECONDS,
  USER_DAILY_CAP,
  GLOBAL_DAILY_CAP,
};
