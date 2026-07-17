const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ChatSettings = require('../models/ChatSettings');
const { canManageAdminRole } = require('../utils/permissions');
const { buildTextContainer, buildErrorContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat-admin-role')
    .setDescription('Configure which role can manage the AI chat bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set the admin role')
        .addRoleOption((option) =>
          option.setName('role').setDescription('Role to grant admin access').setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('View the current admin role')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // Belt-and-suspenders: even though setDefaultMemberPermissions gates this,
    // explicitly re-check so a role/permission change mid-session can't slip through.
    if (!canManageAdminRole(interaction.member)) {
      await interaction.reply({
        components: [buildErrorContainer('You need the **Manage Guild** permission to use this command.')],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guildId;

    if (sub === 'set') {
      const role = interaction.options.getRole('role', true);
      await ChatSettings.findOneAndUpdate(
        { guildId },
        { guildId, adminRoleId: role.id },
        { upsert: true }
      );

      await interaction.reply({
        components: [
          buildTextContainer({
            heading: 'Admin role updated',
            body: `<@&${role.id}> can now manage the AI chat bot in this server.`,
          }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'view') {
      const settings = await ChatSettings.findOne({ guildId });

      const body = settings?.adminRoleId
        ? `Current admin role: <@&${settings.adminRoleId}>`
        : 'No custom admin role is set. Falling back to the **Manage Guild** permission.';

      await interaction.reply({
        components: [buildTextContainer({ heading: 'Admin role', body })],
        flags: V2_FLAGS,
        ephemeral: true,
      });
    }
  },
};
