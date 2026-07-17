/**
 * Registers slash commands with Discord.
 *
 * IMPORTANT: Uses individual rest.post() calls per command, NEVER
 * rest.put() bulk overwrite — this app's commands may share the
 * application with other bots/processes, and a bulk PUT would
 * clobber commands registered elsewhere.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARN] Skipping ${file}: missing "data" or "execute" export.`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} application (/) commands individually...`);

    const guildId = process.env.GUILD_ID; // optional: register to one guild for fast iteration
    const clientId = process.env.CLIENT_ID;

    for (const command of commands) {
      const route = guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId);

      await rest.post(route, { body: command });
      console.log(`  ✔ Registered /${command.name}`);
    }

    console.log('All commands registered successfully.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
