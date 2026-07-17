const { SlashCommandBuilder } = require('discord.js');
const { hasAdminAccess } = require('../utils/permissions');
const {
  buildAvatarUpdateContainer,
  buildErrorContainer,
  V2_FLAGS,
} = require('../utils/componentsV2');

const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription("Change the bot's avatar for this server")
    .addAttachmentOption((option) =>
      option.setName('image').setDescription('Image to use as the new avatar').setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        components: [buildErrorContainer('This command can only be used in a server.')],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (!(await hasAdminAccess(interaction.member))) {
      await interaction.reply({
        components: [buildErrorContainer('You do not have permission to change the bot avatar.')],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    const attachment = interaction.options.getAttachment('image', true);

    if (!attachment.contentType || !ALLOWED_CONTENT_TYPES.includes(attachment.contentType)) {
      await interaction.reply({
        components: [buildErrorContainer('Please upload a PNG, JPEG, WEBP, or GIF image.')],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    // Discord per-server avatars have an 8MB limit like normal attachments,
    // but keep a stricter check to avoid surprises.
    const MAX_BYTES = 8 * 1024 * 1024;
    if (attachment.size > MAX_BYTES) {
      await interaction.reply({
        components: [buildErrorContainer('Image is too large. Please use a file under 8MB.')],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      // Per-server bot avatar: sets this guild's member profile avatar,
      // distinct from the bot's global application avatar.
      await interaction.guild.members.me.setAvatar(attachment.url);
    } catch (err) {
      console.error('Failed to set per-server avatar:', err);
      await interaction.editReply({
        components: [
          buildErrorContainer(
            'Failed to update the avatar. Discord may be rate-limiting avatar changes, or this feature may not be available in this server yet.'
          ),
        ],
        flags: V2_FLAGS,
      });
      return;
    }

    await interaction.editReply({
      components: [buildAvatarUpdateContainer(attachment.url, interaction.guild.name)],
      flags: V2_FLAGS,
    });
  },
};
