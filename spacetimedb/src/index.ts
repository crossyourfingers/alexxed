// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import { schema, t, table, SenderError } from "spacetimedb/server";
import { Identity } from "spacetimedb";

const user = table(
  { name: "user", public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string().optional(),
    online: t.bool(),
    avatar_url: t.string().optional(),
  },
);

// Private table for storing user credentials
const credentials = table(
  {
    name: "credentials",
    indexes: [
      {
        name: "credentials_username",
        algorithm: "btree",
        columns: ["username"],
      },
    ],
  },
  {
    identity: t.identity().primaryKey(),
    username: t.string(),
    passwordHash: t.string(),
  },
);

// Channel table for Discord-like text channels
const channel = table(
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

const message = table(
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

const message_like = table(
  { name: "message_like", public: true },
  {
    message_sent: t.timestamp(),
    user_identity: t.identity(),
  },
);

// Emoji reactions for messages (multiple emoji types per message)
const message_reaction = table(
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
const link_preview = table(
  { name: "link_preview", public: true },
  {
    url: t.string().primaryKey(),
    title: t.string(),
    description: t.string(),
    image: t.string(),
    fetched_at: t.timestamp(),
  },
);

// Per-client session rows to track connect/disconnect times
const user_session = table(
  {
    name: "user_session",
    public: false,
    indexes: [
      {
        name: "user_session_user_identity",
        algorithm: "btree",
        columns: ["user_identity"],
      },
    ],
  },
  {
    session_id: t.u64().primaryKey().autoInc(),
    user_identity: t.identity(),
    client_id: t.string().optional(),
    connected_at: t.timestamp(),
    disconnected_at: t.timestamp().optional(),
  },
);

/**
 * System messages table for connection/disconnection events.
 *
 * These messages are automatically inserted when users connect or disconnect,
 * and are broadcast to ALL channels. The `sender` is always `Identity.zero()`
 * to distinguish system messages from user messages.
 *
 * Schema:
 * - id: Auto-increment primary key
 * - message_type: 'connect' or 'disconnect'
 * - channel_id: Channel where the message appears (FK to channel.id)
 * - sender: Always Identity.zero() for system attribution
 * - user_identity: The actual user who connected/disconnected
 * - created_at: Server-side timestamp
 * - content: Optional additional text (for future extensibility)
 *
 * Index: system_message_channel_id for efficient per-channel queries
 */
const system_message = table(
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

// ─────────────────────────────────────────────────────────────────────────────
// NEW TABLES FOR STREAMER FEATURES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Streamer profile - single row for the platform admin/streamer
 */
const streamer_profile = table(
  { name: "streamer_profile", public: true },
  {
    id: t.identity().primaryKey(), // Single streamer = ADMIN_IDENTITY
    name: t.string(),
    bio: t.string(),
    avatar_url: t.string().optional(),
    social_links: t.string(), // JSON array: [{platform, url}]
    stream_status: t.string(), // 'online' or 'offline'
  },
);

/**
 * Weekly streaming schedule - 7 recurring days
 */
const stream_schedule_day = table(
  { name: "stream_schedule_day", public: true },
  {
    day_number: t.u32().primaryKey(), // 1-7
    theme: t.string(),
    description: t.string().optional(),
  },
);

/**
 * Moderation queue - reported messages (admin-only view)
 */
const reported_message = table(
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
const channel_unread = table(
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

/**
 * Game voting - basic tables
 *
 * These tables are intentionally minimal for the initial stub. We'll
 * iterate on indexing and views when the feature is implemented fully.
 */
const game = table(
  { name: "game", public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    title: t.string(),
    cover_url: t.string().optional(),
    purchase_link: t.string().optional(),
    played: t.bool().optional(),
  },
);

const user_vote = table(
  {
    name: "user_vote",
    public: true,
    indexes: [
      { name: "user_vote_game_id", algorithm: "btree", columns: ["game_id"] },
      {
        name: "user_vote_user_identity",
        algorithm: "btree",
        columns: ["user_identity"],
      },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    user_identity: t.identity(),
    game_id: t.u64(),
    vote: t.string(), // 'up' | 'down'
  },
);

/**
 * Aggregated vote counters per game. Maintained by reducers to avoid
 * scanning `user_vote` for every client read.
 */
const game_vote_count = table(
  { name: "game_vote_count", public: true },
  {
    game_id: t.u64().primaryKey(),
    up: t.u64(),
    down: t.u64(),
  },
);

const spacetimedb = schema({
  user,
  message,
  message_like,
  message_reaction,
  credentials,
  channel,
  link_preview,
  user_session,
  system_message,
  streamer_profile,
  stream_schedule_day,
  reported_message,
  channel_unread,
  game,
  user_vote,
  game_vote_count,
});
export default spacetimedb;

function validateName(name: string) {
  if (!name) throw new SenderError("Names must not be empty");
}

export const set_name = spacetimedb.reducer(
  { name: t.string() },
  (ctx, { name }) => {
    validateName(name);
    const user = ctx.db.user.identity.find(ctx.sender);
    if (!user) throw new SenderError("Cannot set name for unknown user");
    console.info(`User ${ctx.sender} sets name to ${name}`);
    ctx.db.user.identity.update({ ...user, name });
  },
);

// Maximum message length (FR-B08)
const MAX_MESSAGE_LENGTH = 2000;

function validateMessage(text: string) {
  if (!text) throw new SenderError("Messages must not be empty");
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new SenderError(
      `Message exceeds ${MAX_MESSAGE_LENGTH} character limit`,
    );
  }
}

// Simple hash function for demo - IN PRODUCTION, hash passwords client-side!
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export const register = spacetimedb.reducer(
  { username: t.string(), password: t.string() },
  (ctx, { username, password }) => {
    // Validate inputs
    if (!username || username.length < 3) {
      throw new SenderError("Username must be at least 3 characters");
    }
    if (!password || password.length < 6) {
      throw new SenderError("Password must be at least 6 characters");
    }

    // Check if username already exists
    let existing = undefined;
    for (const cred of ctx.db.credentials.iter()) {
      if (cred.username === username) {
        existing = cred;
        break;
      }
    }
    if (existing) {
      throw new SenderError("Username already exists");
    }

    // Hash password and store credentials
    const passwordHash = simpleHash(password);
    ctx.db.credentials.insert({
      identity: ctx.sender,
      username,
      passwordHash,
    });

    // Update existing user record (created by onConnect) or create new one
    const existingUser = ctx.db.user.identity.find(ctx.sender);
    if (existingUser) {
      ctx.db.user.identity.update({
        ...existingUser,
        name: username,
        online: true,
      });
    } else {
      ctx.db.user.insert({
        identity: ctx.sender,
        name: username,
        online: true,
        avatar_url: undefined,
      });
    }

    console.info(`User registered: ${username}`);
  },
);

export const login = spacetimedb.reducer(
  { username: t.string(), password: t.string() },
  (ctx, { username, password }) => {
    // Find credentials by username
    let creds = undefined;
    for (const cred of ctx.db.credentials.iter()) {
      if (cred.username === username) {
        creds = cred;
        break;
      }
    }
    if (!creds) {
      throw new SenderError("Invalid username or password");
    }

    // Verify password
    const passwordHash = simpleHash(password);
    if (creds.passwordHash !== passwordHash) {
      throw new SenderError("Invalid username or password");
    }

    // Update user to online
    const user = ctx.db.user.identity.find(creds.identity);
    if (user) {
      ctx.db.user.identity.update({ ...user, online: true });
    }

    console.info(`User logged in: ${username}`);
  },
);

export const send_message = spacetimedb.reducer(
  { text: t.string(), channel_id: t.u64() },
  (ctx, { text, channel_id }) => {
    // Things to consider:
    // - Rate-limit messages per-user.
    // - Reject messages from unnamed user.
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
 *
 * Note: Most system messages are inserted automatically by lifecycle hooks
 * (onConnect/onDisconnect). This reducer exists for programmatic insertion
 * and testing. The sender is set to Identity.zero() to mark it as a system
 * message rather than a user message.
 *
 * @param message_type - Event type: 'connect', 'disconnect', or custom
 * @param channel_id - Target channel (must exist)
 * @param user_identity - The user the message is about
 * @param content - Optional additional text
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

// Called when the module is initially published
export const init = spacetimedb.init((ctx) => {
  // Create default general channel if it doesn't exist
  let generalExists = false;
  for (const ch of ctx.db.channel.iter()) {
    if (ch.name === "general") {
      generalExists = true;
      break;
    }
  }
  if (!generalExists) {
    ctx.db.channel.insert({
      id: 0n,
      name: "general",
      description: "General discussion",
      created_by: ctx.sender,
      created_at: ctx.timestamp,
      is_live_chat: false,
    });
    console.info("Created default #general channel");
  }
});

// -----------------------------
// Voting reducers (stubs)
// -----------------------------

/**
 * Cast or update a vote for a game. Simple semantics for now:
 * - vote: 'up' or 'down'
 * - If a user's vote exists for that game, update it; otherwise insert
 */
export const cast_vote = spacetimedb.reducer(
  { game_id: t.u64(), vote: t.string() },
  (ctx, { game_id, vote }) => {
    // Debugging logs: surface reducer invocations to server logs so we can
    // trace whether client calls are reaching the server and with what types.
    try {
      console.info(
        `cast_vote invoked: sender=${ctx.sender.toHexString()}, game_id=${game_id}, vote=${vote}`,
      );
    } catch (e) {
      // Best-effort logging; don't fail the reducer because of logging issues
      console.warn("cast_vote logging failed:", e);
    }
    if (vote !== "up" && vote !== "down") {
      throw new SenderError("Invalid vote value");
    }

    // Verify game exists (if not, create a placeholder stub row)
    const g = ctx.db.game.id.find(game_id);
    if (!g) {
      // create a placeholder game row with unknown title
      ctx.db.game.insert({
        id: game_id,
        title: "(unknown)",
        cover_url: undefined,
        purchase_link: undefined,
        played: false,
      });
    }
    // Find existing vote by this user (scan - safe and simple for now)
    let existing = undefined;
    for (const v of ctx.db.user_vote.iter()) {
      if (v.game_id === game_id && v.user_identity.isEqual(ctx.sender)) {
        existing = v;
        break;
      }
    }

    // Ensure aggregate counter exists for this game
    let counter = ctx.db.game_vote_count.game_id.find(game_id);
    if (!counter) {
      ctx.db.game_vote_count.insert({ game_id, up: 0n, down: 0n });
      counter = ctx.db.game_vote_count.game_id.find(game_id)!; // must exist after insert
    }

    if (existing) {
      // No-op if vote unchanged
      if (existing.vote === vote) return;

      // Adjust counters according to previous vote
      let newUp = counter.up;
      let newDown = counter.down;
      if (existing.vote === "up") newUp = newUp - 1n;
      else if (existing.vote === "down") newDown = newDown - 1n;

      if (vote === "up") newUp = newUp + 1n;
      else newDown = newDown + 1n;

      ctx.db.game_vote_count.game_id.update({
        game_id: counter.game_id,
        up: newUp,
        down: newDown,
      });
      ctx.db.user_vote.id.update({ ...existing, vote });
    } else {
      // Insert new user vote and increment counter
      ctx.db.user_vote.insert({
        id: 0n,
        user_identity: ctx.sender,
        game_id,
        vote,
      });
      if (vote === "up") {
        ctx.db.game_vote_count.game_id.update({
          game_id: counter.game_id,
          up: counter.up + 1n,
          down: counter.down,
        });
      } else {
        ctx.db.game_vote_count.game_id.update({
          game_id: counter.game_id,
          up: counter.up,
          down: counter.down + 1n,
        });
      }
    }
  },
);

/**
 * Very small view to return aggregated vote counts per game.
 * This is intentionally naive (scans user_vote) and will be replaced with
 * indexed queries once we stabilise the schema.
 */
const GameVoteRow = t.object("GameVoteRow", {
  gameId: t.u64(),
  up: t.u64(),
  down: t.u64(),
});
export const game_vote_counts = spacetimedb.anonymousView(
  { name: "game_vote_counts", public: true },
  t.array(GameVoteRow),
  (ctx) => {
    // Return pre-computed counters from `game_vote_count`
    return [...ctx.db.game_vote_count.iter()].map((r) => ({
      gameId: r.game_id,
      up: r.up,
      down: r.down,
    }));
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

    // Delete all messages in the channel
    const messagesToDelete = [];
    for (const msg of ctx.db.message.iter()) {
      if (msg.channel_id === channel_id) {
        messagesToDelete.push(msg);
      }
    }
    for (const msg of messagesToDelete) {
      ctx.db.message.delete(msg);
    }

    ctx.db.channel.id.delete(channel_id);
    console.info(`User ${ctx.sender} deleted channel #${channel.name}`);
  },
);

export const update_channel = spacetimedb.reducer(
  { channel_id: t.u64(), description: t.string() },
  (ctx, { channel_id, description }) => {
    const channel = ctx.db.channel.id.find(channel_id);
    if (!channel) {
      throw new SenderError("Channel not found");
    }

    ctx.db.channel.id.update({
      ...channel,
      description,
    });
    console.info(`User ${ctx.sender} updated channel #${channel.name}`);
  },
);

/**
 * Lifecycle hook: Client Connected
 *
 * Called automatically when a client establishes a connection.
 *
 * Actions:
 * 1. Updates or creates user record with online: true
 * 2. Creates a user_session row for analytics
 * 3. Broadcasts 'connect' system message to ALL channels
 *
 * The system message uses Identity.zero() as sender and stores
 * ctx.sender in user_identity so clients can display "Alice connected"
 */
export const onConnect = spacetimedb.clientConnected((ctx) => {
  const user = ctx.db.user.identity.find(ctx.sender);
  if (user) {
    // If this is a returning user, i.e. we already have a `User` with this `Identity`,
    // set `online: true`, but leave `name` and `identity` unchanged.
    ctx.db.user.identity.update({ ...user, online: true });
  } else {
    // If this is a new user, create a `User` row for the `Identity`,
    // which is online, but hasn't set a name.
    ctx.db.user.insert({
      name: undefined,
      identity: ctx.sender,
      online: true,
      avatar_url: undefined,
    });
  }
  // Create a session row for this connection
  try {
    ctx.db.user_session.insert({
      session_id: 0n,
      user_identity: ctx.sender,
      client_id: undefined,
      connected_at: ctx.timestamp,
      disconnected_at: undefined,
    });
  } catch (e) {
    console.warn("Failed to insert user_session on connect:", e);
  }
  // Insert system message for all channels
  for (const channel of ctx.db.channel.iter()) {
    ctx.db.system_message.insert({
      id: 0n,
      message_type: "connect",
      channel_id: channel.id,
      sender: Identity.zero(),
      user_identity: ctx.sender,
      created_at: ctx.timestamp,
      content: undefined,
    });
  }
});

/**
 * Lifecycle hook: Client Disconnected
 *
 * Called automatically when a client connection is closed.
 *
 * Actions:
 * 1. Sets user.online to false
 * 2. Closes the user_session row with disconnected_at timestamp
 * 3. Broadcasts 'disconnect' system message to ALL channels
 *
 * The system message uses Identity.zero() as sender and stores
 * ctx.sender in user_identity so clients can display "Alice disconnected"
 */
export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const user = ctx.db.user.identity.find(ctx.sender);
  if (user) {
    ctx.db.user.identity.update({ ...user, online: false });
    // Close any open session rows for this user
    try {
      let openSession = undefined;
      for (const s of ctx.db.user_session.iter()) {
        if (s.user_identity.isEqual(ctx.sender) && !s.disconnected_at) {
          openSession = s;
          break;
        }
      }
      if (openSession) {
        ctx.db.user_session.session_id.update({
          ...openSession,
          disconnected_at: ctx.timestamp,
        });
      }
    } catch (e) {
      console.warn("Failed to close user_session on disconnect:", e);
    }
    // Insert disconnect system message for all channels
    for (const channel of ctx.db.channel.iter()) {
      ctx.db.system_message.insert({
        id: 0n,
        message_type: "disconnect",
        channel_id: channel.id,
        sender: Identity.zero(),
        user_identity: ctx.sender,
        created_at: ctx.timestamp,
        content: undefined,
      });
    }
  } else {
    // This branch should be unreachable,
    // as it doesn't make sense for a client to disconnect without connecting first.
    console.warn(
      `Disconnect event for unknown user with identity ${ctx.sender}`,
    );
  }
});

// Cleanup reducer: delete user_session rows older than 7 days (FR-F08)
export const cleanup_old_user_sessions = spacetimedb.reducer((ctx) => {
  const retentionMicros = 7n * 24n * 60n * 60n * 1_000_000n; // 7 days
  const cutoff = ctx.timestamp.microsSinceUnixEpoch - retentionMicros;

  const toDelete: bigint[] = [];
  for (const s of ctx.db.user_session.iter()) {
    if (s.disconnected_at && s.disconnected_at.microsSinceUnixEpoch < cutoff) {
      toDelete.push(s.session_id);
    }
  }

  for (const id of toDelete) {
    ctx.db.user_session.session_id.delete(id);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STREAMER & ADMIN REDUCERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update streamer profile (admin-only)
 * First user to create a profile becomes the admin
 */
export const update_streamer_profile = spacetimedb.reducer(
  {
    name: t.string().optional(),
    bio: t.string().optional(),
    avatar_url: t.string().optional(),
    social_links: t.string().optional(),
    stream_status: t.string().optional(),
  },
  (ctx, { name, bio, avatar_url, social_links, stream_status }) => {
    const existing = ctx.db.streamer_profile.id.find(ctx.sender);

    if (existing) {
      // Update existing profile
      ctx.db.streamer_profile.id.update({
        ...existing,
        name: name ?? existing.name,
        bio: bio ?? existing.bio,
        avatar_url: avatar_url !== undefined ? avatar_url : existing.avatar_url,
        social_links: social_links ?? existing.social_links,
        stream_status: stream_status ?? existing.stream_status,
      });
    } else {
      // Check if this is the first profile (admin bootstrap)
      let hasAnyProfile = false;
      for (const _ of ctx.db.streamer_profile.iter()) {
        hasAnyProfile = true;
        break;
      }

      if (hasAnyProfile) {
        throw new SenderError("Only admin can update profile");
      }

      // Create new profile for admin
      ctx.db.streamer_profile.insert({
        id: ctx.sender,
        name: name ?? "Streamer",
        bio: bio ?? "",
        avatar_url: avatar_url,
        social_links: social_links ?? "[]",
        stream_status: stream_status ?? "offline",
      });
    }

    console.info(`Streamer profile updated by ${ctx.sender}`);
  },
);

/**
 * Populate default weekly schedule (admin-only, idempotent)
 */
export const populate_schedule = spacetimedb.reducer((ctx) => {
  // Check if caller is admin (has the streamer profile)
  const profile = ctx.db.streamer_profile.id.find(ctx.sender);
  if (!profile) {
    // Allow if no profiles exist yet (first-time setup)
    let hasAnyProfile = false;
    for (const _ of ctx.db.streamer_profile.iter()) {
      hasAnyProfile = true;
      break;
    }
    if (hasAnyProfile) {
      throw new SenderError("Only admin can populate schedule");
    }
  }

  const defaultThemes = [
    { day: 1, theme: "Stardew Valley", description: "Cozy farming simulation" },
    {
      day: 2,
      theme: "Farming Games",
      description: "Various farming and life sims",
    },
    {
      day: 3,
      theme: "Fantasy Adventure",
      description: "Epic fantasy RPGs and adventures",
    },
    {
      day: 4,
      theme: "Science Fiction",
      description: "Sci-fi games and space exploration",
    },
    { day: 5, theme: "Horror/Scary", description: "Spooky and horror games" },
    {
      day: 6,
      theme: "Puzzle/Platformer",
      description: "Brain teasers and platforming challenges",
    },
    {
      day: 7,
      theme: "Any Category",
      description: "Viewer's choice or mixed bag",
    },
  ];

  for (const { day, theme, description } of defaultThemes) {
    const existing = ctx.db.stream_schedule_day.day_number.find(day);
    if (existing) {
      // Upsert - update if exists
      ctx.db.stream_schedule_day.day_number.update({
        ...existing,
        theme,
        description,
      });
    } else {
      ctx.db.stream_schedule_day.insert({
        day_number: day,
        theme,
        description,
      });
    }
  }

  console.info("Schedule populated with default themes");
});

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

// Per-subscriber view exposing current user's session metrics
// NOTE: my_session_metrics view temporarily disabled.
// The view caused a runtime error during module publish (fatal error in
// view/table initialization). The client has a safe fallback (sessionStorage
// / localStorage) and the feature can be reintroduced later with a query-
// builder based view or after resolving the index/accessor mapping.

// export const my_session_metrics = spacetimedb.view(
//   { name: "my_session_metrics", public: true },
//   t.array(
//     t.object("SessionMetrics", {
//       sessionCount: t.u64(),
//       connectedAt: t.timestamp().optional(),
//     }),
//   ),
//   (ctx) => {
//     const sessions = [...ctx.db.user_session.iter()].filter((s) =>
//       s.user_identity.isEqual(ctx.sender),
//     );
//     const open = sessions.find((s) => !s.disconnected_at);
//     return [
//       {
//         sessionCount: BigInt(sessions.length),
//         connectedAt: open ? open.connected_at : undefined,
//       },
//     ];
//   },
// );

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
        title: title.substring(0, 500),
        description: description.substring(0, 1000),
        image: image.substring(0, 500),
        fetched_at: tx.timestamp,
      });
    });

    return { url, title, description, image };
  },
);
