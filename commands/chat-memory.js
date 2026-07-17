const { SlashCommandBuilder } = require('discord.js');
const ChatMemory = require('../models/ChatMemory');
const { buildTextContainer, buildErrorContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat-memory')
    .setDescription('Manage your own AI conversation history')
    .addSubcommand((sub) =>
      sub.setName('view').setDescription('View your conversation history')
    )
    .addSubcommand((sub) =>
      sub.setName('clear').setDescription('Clear your conversation history')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'view') {
      const history = await ChatMemory.getHistory(userId);

      if (history.length === 0) {
        await interaction.reply({
          components: [buildErrorContainer('You have no saved conversation history.')],
          flags: V2_FLAGS,
          ephemeral: true,
        });
        return;
      }

      const preview = history
        .slice(-10)
        .map((m) => `**${m.role === 'user' ? 'You' : 'AI'}:** ${m.content}`)
        .join('\n\n');

      const container = buildTextContainer({
        heading: 'Your conversation history (last 10 messages)',
        body: preview,
        footer: `${history.length} total messages stored`,
      });

      await interaction.reply({ components: [container], flags: V2_FLAGS, ephemeral: true });
      return;
    }

    if (sub === 'clear') {
      await ChatMemory.clearHistory(userId);
      await interaction.reply({
        components: [buildTextContainer({ heading: 'Memory cleared', body: 'Your conversation history has been wiped.' })],
        flags: V2_FLAGS,
        ephemeral: true,
      });
    }
  },
};
