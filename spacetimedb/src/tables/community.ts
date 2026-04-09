import { t, table } from "spacetimedb/server";

// Channel table for Discord-like text channels
export const channel = table(
  {
    name: "channel",
    public: true,
    indexes: [{ name: "channel_name", algorithm: "btree", columns: ["name"] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string(),
    description: t.string(),
    created_by: t.identity(),
    created_at: t.timestamp(),
    is_live_chat: t.bool(),
  },
);

export const message = table(
  {
    name: "message",
    public: true,
    indexes: [
      {
        name: "message_channel_id",
        algorithm: "btree",
        columns: ["channel_id"],
      },
    ],
  },
  {
    sender: t.identity(),
    sent: t.timestamp(),
    text: t.string(),
    channel_id: t.u64(),
  },
);

export const message_like = table(
  { name: "message_like", public: true },
  {
    message_sent: t.timestamp(),
    user_identity: t.identity(),
  },
);

// Emoji reactions for messages (multiple emoji types per message)
export const message_reaction = table(
  {
    name: "message_reaction",
    public: true,
    indexes: [
      {
        name: "message_reaction_message_sent",
        algorithm: "btree",
        columns: ["message_sent"],
      },
    ],
  },
  {
    message_sent: t.timestamp(),
    user_identity: t.identity(),
    emoji: t.string(),
  },
);

// Cache for link preview metadata
export const link_preview = table(
  { name: "link_preview", public: true },
  {
    url: t.string().primaryKey(),
    title: t.string(),
    description: t.string(),
    image: t.string(),
    fetched_at: t.timestamp(),
  },
);

/**
 * System messages table for connection/disconnection events.
 *
 * These messages are automatically inserted when users connect or disconnect,
 * and are broadcast to ALL channels. The `sender` is always `Identity.zero()`
 * to distinguish system messages from user messages.
 */
export const system_message = table(
  {
    name: "system_message",
    public: true,
    indexes: [
      {
        name: "system_message_channel_id",
        algorithm: "btree",
        columns: ["channel_id"],
      },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    message_type: t.string(),
    channel_id: t.u64(),
    sender: t.identity(),
    user_identity: t.identity(),
    created_at: t.timestamp(),
    content: t.string().optional(),
  },
);

/**
 * Moderation queue - reported messages (admin-only view)
 */
export const reported_message = table(
  {
    name: "reported_message",
    public: false, // Private - accessed via admin-only view
    indexes: [
      {
        name: "reported_message_status",
        algorithm: "btree",
        columns: ["status"],
      },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    message_sent: t.timestamp(), // Reference to message by timestamp
    reporter_identity: t.identity(),
    reported_at: t.timestamp(),
    status: t.string(), // 'pending', 'reviewed', 'resolved'
  },
);

/**
 * Channel unread tracking - per user/channel last read timestamp
 */
export const channel_unread = table(
  {
    name: "channel_unread",
    public: false, // Private per-user
    indexes: [
      {
        name: "channel_unread_user",
        algorithm: "btree",
        columns: ["user_identity"],
      },
    ],
  },
  {
    user_identity: t.identity(),
    channel_id: t.u64(),
    last_read_at: t.timestamp(),
  },
);
