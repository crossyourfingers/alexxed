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

// Channel table for Discord-like text channels
const channel = table(
  {
    name: 'channel',
    public: true,
    indexes: [{ name: 'channel_name', algorithm: 'btree', columns: ['name'] }]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string(),
    description: t.string(),
    created_by: t.identity(),
    created_at: t.timestamp(),
  }
);

const message = table(
  {
    name: 'message',
    public: true,
    indexes: [{ name: 'message_channel_id', algorithm: 'btree', columns: ['channel_id'] }]
  },
  {
    sender: t.identity(),
    sent: t.timestamp(),
    text: t.string(),
    channel_id: t.u64(),
  }
);

const message_like = table(
  { name: 'message_like', public: true },
  {
    message_sent: t.timestamp(),
    user_identity: t.identity(),
  }
);

// Cache for link preview metadata
const link_preview = table(
  { name: 'link_preview', public: true },
  {
    url: t.string().primaryKey(),
    title: t.string(),
    description: t.string(),
    image: t.string(),
    fetched_at: t.timestamp(),
  }
);

const spacetimedb = schema({ user, message, message_like, credentials, channel, link_preview });
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
  { text: t.string(), channel_id: t.u64() },
  (ctx, { text, channel_id }) => {
    // Things to consider:
    // - Rate-limit messages per-user.
    // - Reject messages from unnamed user.
    validateMessage(text);
    
    // Verify channel exists
    const channelExists = ctx.db.channel.id.find(channel_id);
    if (!channelExists) {
      throw new SenderError('Channel not found');
    }
    
    console.info(`User ${ctx.sender} in #${channelExists.name}: ${text}`);
    ctx.db.message.insert({
      sender: ctx.sender,
      text,
      sent: ctx.timestamp,
      channel_id,
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
export const init = spacetimedb.init(ctx => {
  // Create default general channel if it doesn't exist
  let generalExists = false;
  for (const ch of ctx.db.channel.iter()) {
    if (ch.name === 'general') {
      generalExists = true;
      break;
    }
  }
  if (!generalExists) {
    ctx.db.channel.insert({
      id: 0n,
      name: 'general',
      description: 'General discussion',
      created_by: ctx.sender,
      created_at: ctx.timestamp,
    });
    console.info('Created default #general channel');
  }
});

// Channel management reducers
export const create_channel = spacetimedb.reducer(
  { name: t.string(), description: t.string() },
  (ctx, { name, description }) => {
    // Validate channel name
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 32);
    if (!cleanName || cleanName.length < 2) {
      throw new SenderError('Channel name must be at least 2 characters (letters, numbers, dashes only)');
    }
    
    // Check if channel name already exists
    for (const ch of ctx.db.channel.iter()) {
      if (ch.name === cleanName) {
        throw new SenderError('Channel with this name already exists');
      }
    }
    
    const row = ctx.db.channel.insert({
      id: 0n,
      name: cleanName,
      description: description || '',
      created_by: ctx.sender,
      created_at: ctx.timestamp,
    });
    
    console.info(`User ${ctx.sender} created channel #${cleanName} (id: ${row.id})`);
  }
);

export const delete_channel = spacetimedb.reducer(
  { channel_id: t.u64() },
  (ctx, { channel_id }) => {
    const channel = ctx.db.channel.id.find(channel_id);
    if (!channel) {
      throw new SenderError('Channel not found');
    }
    
    // Don't allow deleting the general channel
    if (channel.name === 'general') {
      throw new SenderError('Cannot delete the general channel');
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
  }
);

export const update_channel = spacetimedb.reducer(
  { channel_id: t.u64(), description: t.string() },
  (ctx, { channel_id, description }) => {
    const channel = ctx.db.channel.id.find(channel_id);
    if (!channel) {
      throw new SenderError('Channel not found');
    }
    
    ctx.db.channel.id.update({
      ...channel,
      description,
    });
    console.info(`User ${ctx.sender} updated channel #${channel.name}`);
  }
);

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

// Link preview return type
const LinkPreviewResult = t.object('LinkPreviewResult', {
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
    const cached = ctx.withTx(tx => tx.db.link_preview.url.find(url));
    if (cached) {
      return {
        url: cached.url,
        title: cached.title,
        description: cached.description,
        image: cached.image,
      };
    }

    // Fetch the URL
    let title = '';
    let description = '';
    let image = '';

    try {
      const response = ctx.http.fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        },
      });

      if (response.status === 200) {
        const html = response.text();
        
        // Extract Open Graph tags or fall back to standard tags
        // Title: og:title or <title>
        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = ogTitleMatch?.[1] || titleMatch?.[1] || '';
        
        // Description: og:description or meta description
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        description = ogDescMatch?.[1] || descMatch?.[1] || '';
        
        // Image: og:image
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        image = ogImageMatch?.[1] || '';
        
        // Make relative image URLs absolute
        if (image && !image.startsWith('http')) {
          try {
            const urlObj = new URL(url);
            image = image.startsWith('/') 
              ? `${urlObj.protocol}//${urlObj.host}${image}`
              : `${urlObj.protocol}//${urlObj.host}/${image}`;
          } catch {
            image = '';
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch link preview for ${url}:`, e);
    }

    // Cache the result
    ctx.withTx(tx => {
      tx.db.link_preview.insert({
        url,
        title: title.substring(0, 500),
        description: description.substring(0, 1000),
        image: image.substring(0, 500),
        fetched_at: tx.timestamp,
      });
    });

    return { url, title, description, image };
  }
);
