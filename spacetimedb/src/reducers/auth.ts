import { t, SenderError } from "spacetimedb/server";
import { Identity } from "spacetimedb";
import spacetimedb from "../db";
import { validateName, simpleHash } from "../lib";

export const set_name = spacetimedb.reducer(
  { name: t.string() },
  (ctx, { name }) => {
    validateName(name);
    const user = ctx.db.user.user_identity.find(ctx.sender);
    if (!user) throw new SenderError("Cannot set name for unknown user");
    console.info(`User ${ctx.sender} sets name to ${name}`);
    ctx.db.user.user_identity.update({ ...user, name });
  },
);

export const set_secret = spacetimedb.reducer(
  { key: t.string(), value: t.string() },
  (ctx, { key, value }) => {
    // Only the streamer can set secrets
    const profile = ctx.db.streamer_profile.id.find(ctx.sender);
    if (!profile) {
      throw new SenderError("Only the streamer can set secrets");
    }

    const existing = ctx.db.secret_config.key.find(key);
    if (existing) {
      ctx.db.secret_config.key.update({ key, value });
    } else {
      ctx.db.secret_config.insert({ key, value });
    }
  },
);

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
      user_identity: ctx.sender,
      username,
      passwordHash,
    });

    // Update existing user record (created by onConnect) or create new one
    const existingUser = ctx.db.user.user_identity.find(ctx.sender);
    if (existingUser) {
      ctx.db.user.user_identity.update({
        ...existingUser,
        name: username,
        online: true,
      });
    } else {
      ctx.db.user.insert({
        user_identity: ctx.sender,
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
    const user = ctx.db.user.user_identity.find(creds.user_identity);
    if (user) {
      ctx.db.user.user_identity.update({ ...user, online: true });
    }

    console.info(`User logged in: ${username}`);
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

/**
 * Lifecycle hook: Client Connected
 */
export const onConnect = spacetimedb.clientConnected((ctx) => {
  const user = ctx.db.user.user_identity.find(ctx.sender);
  if (user) {
    ctx.db.user.user_identity.update({ ...user, online: true });
  } else {
    ctx.db.user.insert({
      name: undefined,
      user_identity: ctx.sender,
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
 */
export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const user = ctx.db.user.user_identity.find(ctx.sender);
  if (user) {
    ctx.db.user.user_identity.update({ ...user, online: false });
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

/**
 * Update streamer profile (admin-only)
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
    { day: 2, theme: "Farming Games", description: "Various farming and life sims" },
    { day: 3, theme: "Fantasy Adventure", description: "Epic fantasy RPGs and adventures" },
    { day: 4, theme: "Science Fiction", description: "Sci-fi games and space exploration" },
    { day: 5, theme: "Horror/Scary", description: "Spooky and horror games" },
    { day: 6, theme: "Puzzle/Platformer", description: "Brain teasers and platforming challenges" },
    { day: 7, theme: "Any Category", description: "Viewer's choice or mixed bag" },
  ];

  for (const { day, theme, description } of defaultThemes) {
    const existing = ctx.db.stream_schedule_day.day_number.find(day);
    if (existing) {
      ctx.db.stream_schedule_day.day_number.update({ ...existing, theme, description });
    } else {
      ctx.db.stream_schedule_day.insert({ day_number: day, theme, description });
    }
  }

  console.info("Schedule populated with default themes");
});

// Per-subscriber view exposing current user's session metrics
// NOTE: my_session_metrics view temporarily disabled.
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
