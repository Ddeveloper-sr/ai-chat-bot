const { SlashCommandBuilder, ChannelType } = require('discord.js');
const ChatSettings = require('../models/ChatSettings');
const { hasAdminAccess } = require('../utils/permissions');
const { buildTextContainer, buildErrorContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat-channel')
    .setDescription('Manage which channels AI chat is enabled in')
    .addSubcommand((sub) =>
      sub
        .setName('enable')
        .setDescription('Enable AI chat in a channel')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel to enable (defaults to current channel)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('disable')
        .setDescription('Disable AI chat in a channel')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel to disable (defaults to current channel)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List enabled channels')),

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
    const guildId = interaction.guildId;
    const settings = await ChatSettings.getOrCreate(guildId);

    if (sub === 'enable') {
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      if (!settings.enabledChannels.includes(channel.id)) {
        settings.enabledChannels.push(channel.id);
        await settings.save();
      }
      await interaction.reply({
        components: [
          buildTextContainer({ heading: 'Channel enabled', body: `AI chat is now enabled in <#${channel.id}>.` }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'disable') {
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      settings.enabledChannels = settings.enabledChannels.filter((id) => id !== channel.id);
      await settings.save();
      await interaction.reply({
        components: [
          buildTextContainer({ heading: 'Channel disabled', body: `AI chat is now disabled in <#${channel.id}>.` }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'list') {
      const body =
        settings.enabledChannels.length > 0
          ? settings.enabledChannels.map((id) => `<#${id}>`).join('\n')
          : 'No channels are currently enabled. Use `/chat-channel enable` to add one.';

      await interaction.reply({
        components: [buildTextContainer({ heading: 'Enabled channels', body })],
        flags: V2_FLAGS,
        ephemeral: true,
      });
    }
  },
};
