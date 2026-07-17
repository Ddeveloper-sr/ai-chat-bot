const { SlashCommandBuilder } = require('discord.js');
const ChatMemory = require('../models/ChatMemory');
const { hasAdminAccess } = require('../utils/permissions');
const { buildTextContainer, buildErrorContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat-memory-admin')
    .setDescription("Manage another user's AI conversation history")
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription("View a user's conversation history")
        .addUserOption((option) =>
          option.setName('user').setDescription('The user to inspect').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription("Clear a user's conversation history")
        .addUserOption((option) =>
          option.setName('user').setDescription('The user to clear').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!(await hasAdminAccess(interaction.member))) {
      await interaction.reply({
        components: [buildErrorContainer('You do not have permission to manage AI chat settings.')],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user', true);

    if (sub === 'view') {
      const history = await ChatMemory.getHistory(targetUser.id);

      if (history.length === 0) {
        await interaction.reply({
          components: [buildErrorContainer(`${targetUser.username} has no saved conversation history.`)],
          flags: V2_FLAGS,
          ephemeral: true,
        });
        return;
      }

      const preview = history
        .slice(-10)
        .map((m) => `**${m.role === 'user' ? targetUser.username : 'AI'}:** ${m.content}`)
        .join('\n\n');

      await interaction.reply({
        components: [
          buildTextContainer({
            heading: `${targetUser.username}'s conversation history (last 10 messages)`,
            body: preview,
            footer: `${history.length} total messages stored`,
          }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'clear') {
      await ChatMemory.clearHistory(targetUser.id);
      await interaction.reply({
        components: [
          buildTextContainer({
            heading: 'Memory cleared',
            body: `${targetUser.username}'s conversation history has been wiped.`,
          }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
    }
  },
};
