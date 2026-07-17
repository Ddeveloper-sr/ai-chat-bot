const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ThumbnailBuilder,
  MessageFlags,
  SeparatorSpacingSize,
} = require('discord.js');

/**
 * Builds a simple Components v2 container with a heading and body text.
 * @param {object} opts
 * @param {string} opts.heading - bold heading line (markdown supported)
 * @param {string} opts.body - main body text (markdown supported)
 * @param {string} [opts.footer] - smaller footer/note text
 */
function buildTextContainer({ heading, body, footer }) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${heading}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  if (footer) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${footer}`)
    );
  }

  return container;
}

/**
 * Builds a Components v2 container for an error/limit message.
 */
function buildErrorContainer(message) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ⚠️ ${message}`)
  );
  return container;
}

/**
 * Builds a container showing a new avatar image alongside confirmation text.
 * @param {string} imageUrl
 * @param {string} guildName
 */
function buildAvatarUpdateContainer(imageUrl, guildName) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ✅ Server avatar updated for **${guildName}**`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(imageUrl)
    )
  );

  return container;
}

/**
 * Wraps a chat reply (user message + AI response) in a Components v2 container.
 */
function buildChatReplyContainer({ userMessage, aiReply, personalityLabel }) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`**You:** ${userMessage}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(aiReply));

  if (personalityLabel) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# personality: ${personalityLabel}`)
    );
  }

  return container;
}

const V2_FLAGS = MessageFlags.IsComponentsV2;

module.exports = {
  buildTextContainer,
  buildErrorContainer,
  buildAvatarUpdateContainer,
  buildChatReplyContainer,
  V2_FLAGS,
};
