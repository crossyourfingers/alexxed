// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import { schema, t, table, SenderError } from 'spacetimedb/server';

const user = table(
  { name: 'user', public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string().optional(),
    online: t.bool(),
  }
);

// Private table for storing user credentials
const credentials = table(
  {
    name: 'credentials',
    indexes: [{ name: 'credentials_username', algorithm: 'btree', columns: ['username'] }]
  },
  {
    identity: t.identity().primaryKey(),
    username: t.string(),
    passwordHash: t.string(),
  }
);

const message = table(
  { name: 'message', public: true },
  { sender: t.identity(), sent: t.timestamp(), text: t.string() }
);

const message_like = table(
  { name: 'message_like', public: true },
  {
    message_sent: t.timestamp(),
    user_identity: t.identity(),
  }
);

const spacetimedb = schema({ user, message, message_like, credentials });
export default spacetimedb;

function validateName(name: string) {
  if (!name) throw new SenderError('Names must not be empty');
}

export const set_name = spacetimedb.reducer(
  { name: t.string() },
  (ctx, { name }) => {
    validateName(name);
    const user = ctx.db.user.identity.find(ctx.sender);
    if (!user) throw new SenderError('Cannot set name for unknown user');
    console.info(`User ${ctx.sender} sets name to ${name}`);
    ctx.db.user.identity.update({ ...user, name });
  }
);

function validateMessage(text: string) {
  if (!text) throw new SenderError('Messages must not be empty');
}

// Simple hash function for demo - IN PRODUCTION, hash passwords client-side!
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export const register = spacetimedb.reducer(
  { username: t.string(), password: t.string() },
  (ctx, { username, password }) => {
    // Validate inputs
    if (!username || username.length < 3) {
      throw new SenderError('Username must be at least 3 characters');
    }
    if (!password || password.length < 6) {
      throw new SenderError('Password must be at least 6 characters');
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
      throw new SenderError('Username already exists');
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
      });
    }

    console.info(`User registered: ${username}`);
  }
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
      throw new SenderError('Invalid username or password');
    }

    // Verify password
    const passwordHash = simpleHash(password);
    if (creds.passwordHash !== passwordHash) {
      throw new SenderError('Invalid username or password');
    }

    // Update user to online
    const user = ctx.db.user.identity.find(creds.identity);
    if (user) {
      ctx.db.user.identity.update({ ...user, online: true });
    }

    console.info(`User logged in: ${username}`);
  }
);

export const send_message = spacetimedb.reducer(
  { text: t.string() },
  (ctx, { text }) => {
    // Things to consider:
    // - Rate-limit messages per-user.
    // - Reject messages from unnamed user.
    validateMessage(text);
    console.info(`User ${ctx.sender}: ${text}`);
    ctx.db.message.insert({
      sender: ctx.sender,
      text,
      sent: ctx.timestamp,
    });
  }
);

export const toggle_like = spacetimedb.reducer(
  { message_sent: t.timestamp() },
  (ctx, { message_sent }) => {
    let existing = undefined;
    for (const like of ctx.db.message_like.iter()) {
      if (like.message_sent.microsSinceUnixEpoch === message_sent.microsSinceUnixEpoch &&
          like.user_identity.isEqual(ctx.sender)) {
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
  }
);

// Called when the module is initially published
export const init = spacetimedb.init(_ctx => {});

export const onConnect = spacetimedb.clientConnected(ctx => {
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
    });
  }
});

export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  const user = ctx.db.user.identity.find(ctx.sender);
  if (user) {
    ctx.db.user.identity.update({ ...user, online: false });
  } else {
    // This branch should be unreachable,
    // as it doesn't make sense for a client to disconnect without connecting first.
    console.warn(
      `Disconnect event for unknown user with identity ${ctx.sender}`
    );
  }
});
