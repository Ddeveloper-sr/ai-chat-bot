# AI Chat Bot

Self-hosted Discord AI chat bot using Groq, MongoDB (Mongoose), and Discord Components v2.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN` / `CLIENT_ID` — from the Discord Developer Portal
   - `MONGODB_URI` — your MongoDB connection string
   - `GROQ_API_KEY` — from console.groq.com
   - `GUILD_ID` — optional, for instant command registration during dev

3. **Enable required intents** in the Discord Developer Portal:
   - `MESSAGE CONTENT INTENT` (required for @mention chat)

4. **Register slash commands**
   ```bash
   npm run deploy-commands
   ```
   This registers each command individually via `rest.post()` — it will
   **never** use a bulk `rest.put()` overwrite, so it's safe to run
   alongside other bots/processes sharing the same application.

5. **Start the bot**
   ```bash
   npm start
   ```

## Commands

**User**
- `/chat <message>` — chat with the AI (also works via @mention in enabled channels)
- `/chat-memory view|clear` — manage your own conversation history
- `/chat-stats` — your cooldown + usage
- `/personality set|clear|view` — your personal personality override

**Admin** (custom role via `/chat-admin-role`, falls back to Manage Guild)
- `/chat-admin-role set|view` — configure the admin role (Manage Guild required)
- `/chat-channel enable|disable|list` — per-channel opt-in for AI chat
- `/chat-memory-admin view|clear <user>` — manage any user's history
- `/server-personality set|view` — server-wide default personality
- `/chat-usage-admin` — global usage vs. daily cap
- `/profile <image>` — change the bot's per-server avatar

## Notes

- **Channel opt-in**: AI chat is disabled in all channels by default. An
  admin must run `/chat-channel enable` in each channel where it should work.
- **Personality resolution order**: user override → server default → hardcoded fallback.
- **Rate limits** (tune in `services/rateLimiter.js`):
  - 8s cooldown per user
  - 30 messages/day per user
  - 500 messages/day bot-wide (protects your Groq quota)
- **Per-server avatar** uses Discord's guild-member avatar feature
  (`guild.members.me.setAvatar()`), distinct from the bot's global avatar.
- All command responses use **Components v2** (`ContainerBuilder` /
  `TextDisplayBuilder` / etc. with `MessageFlags.IsComponentsV2`) — no
  legacy embeds anywhere in this feature set.
