const { SlashCommandBuilder } = require('discord.js');
const { handleChatMessage } = require('../services/chatHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with the AI')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('What do you want to say?')
        .setRequired(true)
        .setMaxLength(2000)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const content = interaction.options.getString('message', true);

    const { container, flags } = await handleChatMessage({
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      content,
    });

    await interaction.editReply({
      components: [container],
      flags,
    });
  },
};
