const { handleChatMessage } = require('../services/chatHandler');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user.id)) return;

    // Strip the mention out of the content so it's not sent to the AI verbatim.
    const content = message.content
      .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
      .trim();

    if (!content) return;

    try {
      await message.channel.sendTyping();
    } catch {
      // Non-fatal if typing indicator fails.
    }

    const { container, flags } = await handleChatMessage({
      userId: message.author.id,
      guildId: message.guildId,
      channelId: message.channelId,
      content,
    });

    await message.reply({
      components: [container],
      flags,
      allowedMentions: { repliedUser: false },
    });
  },
};
