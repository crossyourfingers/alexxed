import { t, table } from "spacetimedb/server";

export const user = table(
  { name: "user", public: true },
  {
    user_identity: t.identity().primaryKey(),
    name: t.string().optional(),
    online: t.bool(),
    avatar_url: t.string().optional(),
  },
);

// Private table for storing user credentials
export const credentials = table(
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
    user_identity: t.identity().primaryKey(),
    username: t.string(),
    passwordHash: t.string(),
  },
);

// Private table for storing API keys and other secrets.
// Access is restricted to the admin (streamer profile).
export const secret_config = table(
  { name: "secret_config" },
  {
    key: t.string().primaryKey(),
    value: t.string(),
  },
);

// Per-client session rows to track connect/disconnect times
export const user_session = table(
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
 * Streamer profile - single row for the platform admin/streamer
 */
export const streamer_profile = table(
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
export const stream_schedule_day = table(
  { name: "stream_schedule_day", public: true },
  {
    day_number: t.u32().primaryKey(), // 1-7
    theme: t.string(),
    description: t.string().optional(),
  },
);
