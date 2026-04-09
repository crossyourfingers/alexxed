import { t, SenderError } from "spacetimedb/server";
import { Identity } from "spacetimedb";
import spacetimedb from "../db";
import { validateMessage } from "../lib";

export const send_message = spacetimedb.reducer(
  { text: t.string(), channel_id: t.u64() },
  (ctx, { text, channel_id }) => {
    validateMessage(text);

    // Verify channel exists
    const channelExists = ctx.db.channel.id.find(channel_id);
    if (!channelExists) {
      throw new SenderError("Channel not found");
    }

    console.info(`User ${ctx.sender} in #${channelExists.name}: ${text}`);
    ctx.db.message.insert({
      sender: ctx.sender,
      text,
      sent: ctx.timestamp,
      channel_id,
    });
  },
);

export const toggle_like = spacetimedb.reducer(
  { message_sent: t.timestamp() },
  (ctx, { message_sent }) => {
    // Find the message to check ownership
    let targetMessage = undefined;
    for (const msg of ctx.db.message.iter()) {
      if (msg.sent.microsSinceUnixEpoch === message_sent.microsSinceUnixEpoch) {
        targetMessage = msg;
        break;
      }
    }

    // Prevent self-likes (FR-C04)
    if (targetMessage && targetMessage.sender.isEqual(ctx.sender)) {
      throw new SenderError("Cannot like your own message");
    }

    let existing = undefined;
    for (const like of ctx.db.message_like.iter()) {
      if (
        like.message_sent.microsSinceUnixEpoch ===
          message_sent.microsSinceUnixEpoch &&
        like.user_identity.isEqual(ctx.sender)
      ) {
        existing = like;
        break;
      }
    }
    if (existing) {
      ctx.db.message_like.delete(existing);
    } else {
      ctx.db.message_like.insert({
        message_sent,
        user_identity: ctx.sender,
      });
    }
  },
);

export const toggle_reaction = spacetimedb.reducer(
  { message_sent: t.timestamp(), emoji: t.string() },
  (ctx, { message_sent, emoji }) => {
    // Validate emoji (allow common emoji characters)
    if (!emoji || emoji.length > 10) {
      throw new SenderError("Invalid emoji");
    }

    // Find existing reaction from this user with this emoji on this message
    let existing = undefined;
    for (const reaction of ctx.db.message_reaction.iter()) {
      if (
        reaction.message_sent.microsSinceUnixEpoch ===
          message_sent.microsSinceUnixEpoch &&
        reaction.user_identity.isEqual(ctx.sender) &&
        reaction.emoji === emoji
      ) {
        existing = reaction;
        break;
      }
    }

    if (existing) {
      // Remove the reaction
      ctx.db.message_reaction.delete(existing);
    } else {
      // Add the reaction
      ctx.db.message_reaction.insert({
        message_sent,
        user_identity: ctx.sender,
        emoji,
      });
    }
  },
);

/**
 * Reducer to manually insert system messages.
 */
export const insert_system_message = spacetimedb.reducer(
  {
    message_type: t.string(),
    channel_id: t.u64(),
    user_identity: t.identity(),
    content: t.string().optional(),
  },
  (ctx, { message_type, channel_id, user_identity, content }) => {
    // Verify channel exists
    const channel = ctx.db.channel.id.find(channel_id);
    if (!channel) {
      throw new SenderError("Channel not found");
    }

    ctx.db.system_message.insert({
      id: 0n,
      message_type,
      channel_id,
      sender: Identity.zero(),
      user_identity,
      created_at: ctx.timestamp,
      content,
    });
  },
);

// Channel management reducers
export const create_channel = spacetimedb.reducer(
  { name: t.string(), description: t.string() },
  (ctx, { name, description }) => {
    // Validate channel name
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 32);
    if (!cleanName || cleanName.length < 2) {
      throw new SenderError(
        "Channel name must be at least 2 characters (letters, numbers, dashes only)",
      );
    }

    // Check if channel name already exists
    for (const ch of ctx.db.channel.iter()) {
      if (ch.name === cleanName) {
        throw new SenderError("Channel with this name already exists");
      }
    }

    const row = ctx.db.channel.insert({
      id: 0n,
      name: cleanName,
      description: description || "",
      created_by: ctx.sender,
      created_at: ctx.timestamp,
      is_live_chat: false,
    });

    console.info(
      `User ${ctx.sender} created channel #${cleanName} (id: ${row.id})`,
    );
  },
);

export const delete_channel = spacetimedb.reducer(
  { channel_id: t.u64() },
  (ctx, { channel_id }) => {
    const channel = ctx.db.channel.id.find(channel_id);
    if (!channel) {
      throw new SenderError("Channel not found");
    }

    // Don't allow deleting the general channel
    if (channel.name === "general") {
      throw new SenderError("Cannot delete the general channel");
    }

    ctx.db.channel.id.delete(channel_id);
    console.info(`Channel #${channel.name} deleted by ${ctx.sender}`);
  },
);

/**
 * Report a message for moderation
 */
export const report_message = spacetimedb.reducer(
  { message_sent: t.timestamp() },
  (ctx, { message_sent }) => {
    // Verify message exists
    let messageExists = false;
    for (const msg of ctx.db.message.iter()) {
      if (msg.sent.microsSinceUnixEpoch === message_sent.microsSinceUnixEpoch) {
        messageExists = true;
        break;
      }
    }

    if (!messageExists) {
      throw new SenderError("Message not found");
    }

    // Check if already reported by this user
    for (const report of ctx.db.reported_message.iter()) {
      if (
        report.message_sent.microsSinceUnixEpoch ===
          message_sent.microsSinceUnixEpoch &&
        report.reporter_identity.isEqual(ctx.sender)
      ) {
        throw new SenderError("You have already reported this message");
      }
    }

    ctx.db.reported_message.insert({
      id: 0n,
      message_sent,
      reporter_identity: ctx.sender,
      reported_at: ctx.timestamp,
      status: "pending",
    });

    console.info(`Message reported by ${ctx.sender}`);
  },
);

/**
 * Mark channel as read for current user
 */
export const mark_channel_read = spacetimedb.reducer(
  { channel_id: t.u64() },
  (ctx, { channel_id }) => {
    // Verify channel exists
    const channel = ctx.db.channel.id.find(channel_id);
    if (!channel) {
      throw new SenderError("Channel not found");
    }

    // Find existing unread record for this user/channel
    let existing = undefined;
    for (const unread of ctx.db.channel_unread.iter()) {
      if (
        unread.user_identity.isEqual(ctx.sender) &&
        unread.channel_id === channel_id
      ) {
        existing = unread;
        break;
      }
    }

    if (existing) {
      // Update existing record
      ctx.db.channel_unread.delete(existing);
      ctx.db.channel_unread.insert({
        user_identity: ctx.sender,
        channel_id,
        last_read_at: ctx.timestamp,
      });
    } else {
      // Create new record
      ctx.db.channel_unread.insert({
        user_identity: ctx.sender,
        channel_id,
        last_read_at: ctx.timestamp,
      });
    }
  },
);

// Link preview return type
const LinkPreviewResult = t.object("LinkPreviewResult", {
  url: t.string(),
  title: t.string(),
  description: t.string(),
  image: t.string(),
});

// Procedure to fetch link preview metadata (requires HTTP access)
export const fetch_link_preview = spacetimedb.procedure(
  { url: t.string() },
  LinkPreviewResult,
  (ctx, { url }) => {
    // First check if we have a cached preview
    const cached = ctx.withTx((tx) => tx.db.link_preview.url.find(url));
    if (cached) {
      return {
        url: cached.url,
        title: cached.title,
        description: cached.description,
        image: cached.image,
      };
    }

    // Fetch the URL
    let title = "";
    let description = "";
    let image = "";

    try {
      const response = ctx.http.fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
        },
      });

      if (response.status === 200) {
        const html = response.text();

        // Extract Open Graph tags or fall back to standard tags
        // Title: og:title or <title>
        const ogTitleMatch = html.match(
          /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
        );
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = ogTitleMatch?.[1] || titleMatch?.[1] || "";

        // Description: og:description or meta description
        const ogDescMatch = html.match(
          /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
        );
        const descMatch = html.match(
          /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
        );
        description = ogDescMatch?.[1] || descMatch?.[1] || "";

        // Image: og:image
        const ogImageMatch = html.match(
          /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
        );
        image = ogImageMatch?.[1] || "";

        // Make relative image URLs absolute
        if (image && !image.startsWith("http")) {
          try {
            const urlObj = new URL(url);
            image = image.startsWith("/")
              ? `${urlObj.protocol}//${urlObj.host}${image}`
              : `${urlObj.protocol}//${urlObj.host}/${image}`;
          } catch {
            image = "";
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch link preview for ${url}:`, e);
    }

    // Cache the result
    ctx.withTx((tx) => {
      tx.db.link_preview.insert({
        url,
        title,
        description,
        image,
        fetched_at: ctx.timestamp,
      });
    });

    return { url, title, description, image };
  },
);

// Admin view for reported messages (only visible to streamer/admin)
const ReportedMessageView = t.object("ReportedMessageView", {
  id: t.u64(),
  message_sent: t.timestamp(),
  reporter_identity: t.identity(),
  reported_at: t.timestamp(),
  status: t.string(),
});

export const admin_reported_messages = spacetimedb.view(
  { name: "admin_reported_messages", public: true },
  t.array(ReportedMessageView),
  (ctx) => {
    // Only return reports if caller is the admin (has streamer profile)
    const profile = ctx.db.streamer_profile.id.find(ctx.sender);
    if (!profile) {
      return [];
    }

    // Return all reported messages
    return [...ctx.db.reported_message.iter()].map((r) => ({
      id: r.id,
      message_sent: r.message_sent,
      reporter_identity: r.reporter_identity,
      reported_at: r.reported_at,
      status: r.status,
    }));
  },
);
