const { PermissionFlagsBits } = require('discord.js');
const ChatSettings = require('../models/ChatSettings');

/**
 * Checks if a guild member has admin access to chat-bot management commands.
 * Resolution:
 *  1. If the guild has a configured adminRoleId, member must have that role.
 *  2. If no adminRoleId is configured, fall back to ManageGuild permission.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<boolean>}
 */
async function hasAdminAccess(member) {
  if (!member) return false;

  const settings = await ChatSettings.findOne({ guildId: member.guild.id });

  if (settings && settings.adminRoleId) {
    return member.roles.cache.has(settings.adminRoleId);
  }

  return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

/**
 * Only ManageGuild holders may change the admin role itself,
 * regardless of whether a custom admin role is already set.
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function canManageAdminRole(member) {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

module.exports = { hasAdminAccess, canManageAdminRole };
