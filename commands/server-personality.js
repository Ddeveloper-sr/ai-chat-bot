const { SlashCommandBuilder } = require('discord.js');
const ChatSettings = require('../models/ChatSettings');
const { PRESET_NAMES } = require('../services/personality');
const { hasAdminAccess } = require('../utils/permissions');
const { buildTextContainer, buildErrorContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-personality')
    .setDescription("Set this server's default AI personality")
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set the server default personality')
        .addStringOption((option) =>
          option
            .setName('preset')
            .setDescription('Choose a preset personality')
            .addChoices(...PRESET_NAMES.map((name) => ({ name, value: name })))
        )
        .addStringOption((option) =>
          option
            .setName('custom')
            .setDescription('Or write a custom personality prompt')
            .setMaxLength(500)
        )
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('View the current server default personality')),

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

    if (sub === 'set') {
      const preset = interaction.options.getString('preset');
      const custom = interaction.options.getString('custom');

      if (!preset && !custom) {
        await interaction.reply({
          components: [buildErrorContainer('Provide either a preset or a custom prompt.')],
          flags: V2_FLAGS,
          ephemeral: true,
        });
        return;
      }

      await ChatSettings.findOneAndUpdate(
        { guildId },
        {
          guildId,
          serverPersonality: { preset: custom ? null : preset, customPrompt: custom || null },
        },
        { upsert: true }
      );

      await interaction.reply({
        components: [
          buildTextContainer({
            heading: 'Server personality updated',
            body: custom ? `Custom personality set:\n> ${custom}` : `Preset **${preset}** applied server-wide.`,
            footer: 'Users can still override this with /personality set',
          }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'view') {
      const settings = await ChatSettings.findOne({ guildId });
      const sp = settings?.serverPersonality;

      let body = 'No server default set. Falling back to the hardcoded default.';
      if (sp?.customPrompt) body = `Custom prompt:\n> ${sp.customPrompt}`;
      else if (sp?.preset) body = `Preset: **${sp.preset}**`;

      await interaction.reply({
        components: [buildTextContainer({ heading: 'Server default personality', body })],
        flags: V2_FLAGS,
        ephemeral: true,
      });
    }
  },
};
