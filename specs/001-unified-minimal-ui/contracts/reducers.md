# API Contracts: Reducers

**Date**: 2026-03-06  
**Source**: [spec.md](../spec.md) Requirements + existing implementation

## Reducer Interface Contracts

All reducers use **object syntax** for parameters: `conn.reducers.reducerName({ param: value })`

---

### Authentication Reducers

#### `register`
Register a new user with username/password credentials.

**Parameters**:
```typescript
{ username: string, password: string }
```

**Preconditions**:
- `username` ≥ 3 characters
- `password` ≥ 6 characters
- Username not already taken

**Postconditions**:
- New row in `credentials` table
- User record updated with username as display name
- User marked as online

**Errors**:
- `SenderError("Username must be at least 3 characters")`
- `SenderError("Password must be at least 6 characters")`
- `SenderError("Username already exists")`

#### `login`
Authenticate existing user with credentials.

**Parameters**:
```typescript
{ username: string, password: string }
```

**Preconditions**:
- Username exists in `credentials` table
- Password hash matches stored hash

**Postconditions**:
- User marked as online
- User identity associated with credentials

**Errors**:
- `SenderError("Invalid username or password")`

---

### User Reducers

#### `set_name`
Update user's display name.

**Parameters**:
```typescript
{ name: string }
```

**Preconditions**:
- Caller has existing user record
- `name` is non-empty

**Postconditions**:
- User's `name` field updated

**Errors**:
- `SenderError("Names must not be empty")`
- `SenderError("Cannot set name for unknown user")`

---

### Message Reducers

#### `send_message`
Send a chat message to a channel.

**Parameters**:
```typescript
{ text: string, channel_id: bigint }  // Note: u64 = bigint in TypeScript
```

**Preconditions**:
- Caller is authenticated
- `text` is non-empty
- `text` ≤ 2000 characters (FR-B08)
- `channel_id` exists

**Postconditions**:
- New row in `message` table with sender=ctx.sender, sent=ctx.timestamp

**Errors**:
- `SenderError("Messages must not be empty")`
- `SenderError("Message exceeds 2000 character limit")` (FR-B09)

---

### Like Reducers

#### `toggle_like`
Toggle like status on a message.

**Parameters**:
```typescript
{ message_sent: bigint }  // Timestamp as microseconds since epoch
```

**Preconditions**:
- Message exists with given timestamp
- Caller is not the message author (FR-C04)

**Postconditions**:
- If like exists: remove from `message_like`
- If no like: insert into `message_like`

**Errors**:
- `SenderError("Cannot like your own message")` (FR-C04)

---

### Reaction Reducers

#### `toggle_reaction`
Toggle emoji reaction on a message.

**Parameters**:
```typescript
{ message_sent: bigint, emoji: string }
```

**Preconditions**:
- Message exists
- `emoji` is one of: 👍 ❤️ 😂 😮 😢 🎉 (FR-D02)

**Postconditions**:
- If reaction exists for (user, message, emoji): remove row
- If no reaction: insert new row

**Errors**:
- `SenderError("Invalid emoji")` (if not in allowed set)

---

### Channel Reducers

#### `create_channel`
Create a new chat channel.

**Parameters**:
```typescript
{ name: string, description: string }
```

**Preconditions**:
- `name` is non-empty
- `name` is unique

**Postconditions**:
- New row in `channel` table
- `created_by` = ctx.sender
- `created_at` = ctx.timestamp

**Errors**:
- `SenderError("Channel name must not be empty")`
- `SenderError("Channel name already exists")`

#### `update_channel`
Update channel details.

**Parameters**:
```typescript
{ channel_id: bigint, name?: string, description?: string }
```

**Preconditions**:
- Channel exists
- Caller is channel creator (authorization)

**Postconditions**:
- Channel fields updated

#### `delete_channel`
Delete a channel.

**Parameters**:
```typescript
{ channel_id: bigint }
```

**Preconditions**:
- Channel exists
- Caller is channel creator

**Postconditions**:
- Channel row deleted
- Associated messages remain (soft reference)

---

### System Message Reducers

#### `insert_system_message`
Insert a system message (internal use via lifecycle hooks).

**Parameters**:
```typescript
{ 
  message_type: 'connect' | 'disconnect',
  channel_id: bigint,
  user_identity: Identity
}
```

**Preconditions**:
- Valid message type

**Postconditions**:
- New row in `system_message` with sender=Identity.zero()

---

### Session Reducers

#### `cleanup_old_user_sessions`
Scheduled reducer to clean up old sessions (FR-F08).

**Parameters**: None (scheduled)

**Preconditions**:
- Scheduled execution

**Postconditions**:
- Sessions with `disconnected_at` older than 7 days are deleted

---

## Lifecycle Hooks

### `clientConnected`
Triggered when a client establishes SpacetimeDB connection.

**Actions**:
1. Create/update user record with `online: true`
2. Insert session record with `connected_at = ctx.timestamp`
3. Insert system message with `message_type: 'connect'`

### `clientDisconnected`
Triggered when a client disconnects.

**Actions**:
1. Update user record with `online: false`
2. Update session record with `disconnected_at = ctx.timestamp`
3. Insert system message with `message_type: 'disconnect'`

---

## Client Usage Examples

```typescript
import { DbConnection, type DbConnectionBuilder } from './module_bindings';

// Connect with auth token
const conn = DbConnection.builder()
  .withUri('wss://maincloud.spacetimedb.com')
  .withDatabaseName('alexxed')
  .withToken(authToken)
  .build();

// Send message
conn.reducers.sendMessage({ text: 'Hello!', channel_id: 1n });

// Toggle like
conn.reducers.toggleLike({ message_sent: 1709740800000000n });

// Toggle reaction
conn.reducers.toggleReaction({ message_sent: 1709740800000000n, emoji: '👍' });

// Set name
conn.reducers.setName({ name: 'Alice' });
```

---

### Streamer Reducers

#### `update_streamer_profile`
Update streamer's public profile (admin-only).

**Parameters**:
```typescript
{ name?: string, bio?: string, avatar_url?: string, social_links?: string, stream_status?: string }
```

**Preconditions**:
- Caller is ADMIN_IDENTITY (ctx.sender check)
- If `social_links` provided, must be valid JSON array
- If `stream_status` provided, must be 'online' or 'offline'

**Postconditions**:
- `streamer_profile` row updated with provided fields (partial update)

**Errors**:
- `SenderError("Only admin can update profile")`
- `SenderError("Invalid social_links format")`
- `SenderError("Invalid stream_status (must be 'online' or 'offline')")`

#### `populate_schedule`
Seed default weekly schedule (admin-only, idempotent).

**Parameters**:
```typescript
{}
```

**Preconditions**:
- Caller is ADMIN_IDENTITY

**Postconditions**:
- 7 rows in `stream_schedule_day` (days 1-7) with default themes
- Idempotent: if rows exist, no-op or upsert

**Default Themes** (7 days):
1. Stardew Valley
2. Farming Games
3. Fantasy Adventure
4. Science Fiction
5. Horror/Scary
6. Puzzle/Platformer
7. Any Category

**Errors**:
- `SenderError("Only admin can populate schedule")`

---

### Moderation Reducers

#### `report_message`
Report a message for moderation review.

**Parameters**:
```typescript
{ message_id: bigint }
```

**Preconditions**:
- Caller is authenticated
- `message_id` exists in `message` table

**Postconditions**:
- New row in `reported_message` with status='pending', reporter_identity=ctx.sender

**Errors**:
- `SenderError("Message not found")`

---

### Navigation Reducers

#### `mark_channel_read`
Mark channel as read for current user.

**Parameters**:
```typescript
{ channel_id: bigint }
```

**Preconditions**:
- Caller is authenticated
- `channel_id` exists

**Postconditions**:
- `channel_unread` row upserted: user_identity=ctx.sender, channel_id, last_read_at=ctx.timestamp

**Errors**:
- `SenderError("Channel not found")`

---

## Views (Data Access)

### User's Own Sessions
Limited to authenticated user's data:

```typescript
// View returns only rows where user_identity === ctx.sender
const [sessions, isLoading] = useTable(tables.mySessionMetrics);
```

### Public Tables
Direct subscription:

```typescript
const [messages] = useTable(tables.message);
const [users] = useTable(tables.user);
const [reactions] = useTable(tables.messageReaction);
```
