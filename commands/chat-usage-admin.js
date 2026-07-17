const { SlashCommandBuilder } = require('discord.js');
const { GlobalUsage } = require('../models/ChatUsage');
const { GLOBAL_DAILY_CAP } = require('../services/rateLimiter');
const { hasAdminAccess } = require('../utils/permissions');
const { buildTextContainer, buildErrorContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat-usage-admin')
    .setDescription('View global AI chat usage against the daily cap'),

  async execute(interaction) {
    if (!(await hasAdminAccess(interaction.member))) {
      await interaction.reply({
        components: [buildErrorContainer('You do not have permission to view AI chat usage.')],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    const global = await GlobalUsage.getOrCreate();

    const body = [
      `🌐 Global usage today: **${global.dailyCount}/${GLOBAL_DAILY_CAP}**`,
      `♻️ Resets at: <t:${Math.floor(global.dailyResetAt.getTime() / 1000)}:t>`,
    ].join('\n');

    await interaction.reply({
      components: [buildTextContainer({ heading: 'Global usage stats', body })],
      flags: V2_FLAGS,
      ephemeral: true,
    });
  },
};
