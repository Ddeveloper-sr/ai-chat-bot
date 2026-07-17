const { SlashCommandBuilder } = require('discord.js');
const UserPersonality = require('../models/UserPersonality');
const { PRESETS, PRESET_NAMES, resolveSystemPrompt } = require('../services/personality');
const { buildTextContainer, buildErrorContainer, V2_FLAGS } = require('../utils/componentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('personality')
    .setDescription('Manage your personal AI personality override')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set your personal personality')
        .addStringOption((option) =>
          option
            .setName('preset')
            .setDescription('Choose a preset personality')
            .addChoices(...PRESET_NAMES.map((name) => ({ name, value: name })))
        )
        .addStringOption((option) =>
          option
            .setName('custom')
            .setDescription('Or write your own custom personality prompt')
            .setMaxLength(500)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('clear').setDescription('Clear your override and use the server default')
    )
    .addSubcommand((sub) =>
      sub.setName('view').setDescription('View your currently active personality')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

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

      await UserPersonality.findOneAndUpdate(
        { userId },
        { userId, preset: custom ? null : preset, customPrompt: custom || null },
        { upsert: true }
      );

      await interaction.reply({
        components: [
          buildTextContainer({
            heading: 'Personality updated',
            body: custom
              ? `Custom personality set:\n> ${custom}`
              : `Preset **${preset}** applied.`,
          }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'clear') {
      await UserPersonality.deleteOne({ userId });
      await interaction.reply({
        components: [
          buildTextContainer({
            heading: 'Personality reset',
            body: 'Your override was cleared. You will now use the server default (or the fallback if none is set).',
          }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'view') {
      const active = await resolveSystemPrompt(userId, interaction.guildId);
      await interaction.reply({
        components: [
          buildTextContainer({
            heading: 'Your active personality',
            body: `> ${active}`,
          }),
        ],
        flags: V2_FLAGS,
        ephemeral: true,
      });
    }
  },
};
