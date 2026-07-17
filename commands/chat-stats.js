const { SlashCommandBuilder } = require('discord.js');
const { getStatus } = require('../services/rateLimiter');
const { buildTextContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat-stats')
    .setDescription('View your AI chat cooldown and usage stats'),

  async execute(interaction) {
    const status = await getStatus(interaction.user.id);

    const body = [
      status.cooldownRemaining > 0
        ? `⏳ Cooldown: **${status.cooldownRemaining}s** remaining`
        : `✅ Cooldown: ready`,
      `📊 Daily usage: **${status.dailyUsed}/${status.dailyCap}**`,
      `🌐 Global usage today: **${status.globalUsed}/${status.globalCap}**`,
    ].join('\n');

    const container = buildTextContainer({
      heading: 'Your chat stats',
      body,
    });

    await interaction.reply({ components: [container], flags: V2_FLAGS, ephemeral: true });
  },
};
