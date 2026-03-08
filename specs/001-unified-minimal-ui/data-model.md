# Data Model: Alexxed Chat Platform

**Date**: 2026-03-06  
**Source**: [spec.md](spec.md) Key Entities section + existing schema

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      user       │       │    channel      │
├─────────────────┤       ├─────────────────┤
│ identity (PK)   │       │ id (PK, auto)   │
│ name?           │       │ name            │
│ online          │       │ description     │
└────────┬────────┘       │ created_by (FK) │
         │                │ created_at      │
         │                └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   credentials   │       │    message      │
├─────────────────┤       ├─────────────────┤
│ identity (PK)   │       │ sender (FK)     │
│ username        │       │ sent (timestamp)│
│ passwordHash    │       │ text            │
└─────────────────┘       │ channel_id (FK) │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  message_like   │   │message_reaction │   │ system_message  │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ message_sent    │   │ message_sent    │   │ id (PK, auto)   │
│ user_identity   │   │ user_identity   │   │ message_type    │
└─────────────────┘   │ emoji           │   │ channel_id (FK) │
                      └─────────────────┘   │ sender          │
                                            │ user_identity   │
                                            │ created_at      │
                                            │ content?        │
                                            └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  user_session   │       │  link_preview   │
├─────────────────┤       ├─────────────────┤
│ session_id (PK) │       │ url (PK)        │
│ user_identity   │       │ title           │
│ client_id?      │       │ description     │
│ connected_at    │       │ image           │
│ disconnected_at?│       │ fetched_at      │
└─────────────────┘       └─────────────────┘
```

## Table Definitions

### user
Primary user record with presence status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| identity | Identity | PK | SpacetimeDB identity (from OIDC sub claim) |
| name | string? | optional | Display name (from OIDC preferred_username, user can override via set_name) |
| online | bool | required | Current online status |
| avatar_url | string? | optional | User avatar URL |

**Public**: Yes  
**Indexes**: Primary key on identity

**Identity Mapping**: With OIDC (User Story A1), identity comes from SpacetimeAuth token. The `credentials` table below is legacy (for demo) and will be deprecated.

### credentials
Private authentication credentials (demo only - DO NOT use in production).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| identity | Identity | PK | Links to user |
| username | string | required | Unique username |
| passwordHash | string | required | Hashed password |

**Public**: No  
**Indexes**: `credentials_username` (btree on username)

### channel
Discord-like text channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | u64 | PK, auto-inc | Channel ID |
| name | string | required | Channel name |
| description | string | required | Channel description |
| created_by | Identity | required | Creator identity |
| created_at | Timestamp | required | Creation time |
| is_live_chat | bool | required | True for live stream chat, false for community channels |

**Public**: Yes  
**Indexes**: `channel_name` (btree on name)

### message
User-generated chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| sender | Identity | required | Message author |
| sent | Timestamp | required | Send timestamp |
| text | string | required, max 2000 chars | Message content |
| channel_id | u64 | required | Target channel |

**Public**: Yes  
**Indexes**: `message_channel_id` (btree on channel_id)

**Validation Rules**:
- text must not be empty
- text must be ≤2000 characters (FR-B08)

### message_like
Tracks which users liked which messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| message_sent | Timestamp | required | Message timestamp (FK) |
| user_identity | Identity | required | User who liked |

**Public**: Yes  
**Composite Key**: (message_sent, user_identity)

**Business Rules**:
- Users cannot like their own messages (FR-C04)
- One like per user per message (FR-C05)

### message_reaction
Emoji reactions on messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| message_sent | Timestamp | required | Message timestamp (FK) |
| user_identity | Identity | required | User who reacted |
| emoji | string | required | Emoji character |

**Public**: Yes  
**Indexes**: `message_reaction_message_sent` (btree)

**Allowed Emojis**: 👍 ❤️ 😂 😮 😢 🎉 (FR-D02)

### system_message
Persisted system events (connect/disconnect).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | u64 | PK, auto-inc | System message ID |
| message_type | string | required | 'connect' or 'disconnect' |
| channel_id | u64 | required | Broadcast channel |
| sender | Identity | required | Always Identity.zero() |
| user_identity | Identity | required | User who connected/disconnected |
| created_at | Timestamp | required | Event timestamp |
| content | string? | optional | Additional text |

**Public**: Yes  
**Indexes**: `system_message_channel_id` (btree)

### user_session
Private session tracking per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| session_id | u64 | PK, auto-inc | Session ID |
| user_identity | Identity | required | Session owner |
| client_id | string? | optional | Client identifier |
| connected_at | Timestamp | required | Session start |
| disconnected_at | Timestamp? | optional | Session end (null if active) |

**Public**: No (private, filtered by ctx.sender)  
**Indexes**: `user_session_user_identity` (btree)

**Cleanup**: Sessions older than 7 days should be deleted (FR-F08)

### link_preview
Cached metadata for URL previews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| url | string | PK | URL being previewed |
| title | string | required | Page title |
| description | string | required | Meta description |
| image | string | required | Preview image URL |
| fetched_at | Timestamp | required | Cache timestamp |

**Public**: Yes

## State Transitions

### User Online Status

```
[Not in DB] ──(clientConnected)──▶ [online: true]
                                        │
                      (clientDisconnected)
                                        ▼
                                 [online: false]
```

### Session Lifecycle

```
[No session] ──(connect)──▶ [connected_at set, disconnected_at null]
                                        │
                        (disconnect)    │
                                        ▼
                [connected_at set, disconnected_at set]
                                        │
                    (7-day cleanup job) │
                                        ▼
                                [Row deleted]
```

### streamer_profile
Streamer's public profile and branding.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Identity | PK | Streamer identity (single streamer = single admin) |
| name | string | required | Streamer display name |
| bio | string | required | Profile bio text |
| avatar_url | string? | optional | Avatar image URL |
| social_links | string | required | JSON array of {platform: string, url: string} |
| stream_status | string | required | 'online' or 'offline' |

**Public**: Yes  
**Indexes**: Primary key on id

**Authorization**: Single streamer model - id matches the designated ADMIN_IDENTITY

### stream_schedule_day
Recurring weekly streaming schedule.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| day_number | u32 | PK | Day of week (1-7) |
| theme | string | required | Stream theme for that day |
| description | string? | optional | Additional details |

**Public**: Yes  
**Indexes**: Primary key on day_number

**Note**: 7-day recurring weekly schedule (Mon-Sun)

### reported_message
Moderation queue for reported messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | u64 | PK, auto-inc | Report ID |
| message_id | u64 | required | Foreign key to message |
| reporter_identity | Identity | required | User who reported |
| reported_at | Timestamp | required | Report timestamp |
| status | string | required | 'pending', 'reviewed', or 'resolved' |

**Public**: No (admin-only view)  
**Indexes**: `reported_message_status` (btree on status)

**Authorization**: Only accessible to ADMIN_IDENTITY via private view

### channel_unread
Per-user unread message tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_identity | Identity | PK (composite) | User tracking unread |
| channel_id | u64 | PK (composite) | Channel being tracked |
| last_read_at | Timestamp | required | Last read timestamp |

**Public**: No (private per user)  
**Indexes**: Composite primary key, `channel_unread_user` (btree on user_identity)

**Access Pattern**: Filtered by ctx.sender via private view

---

## Design Tokens (CSS Entities)

Referenced in theme.css, not stored in database:

| Token Category | Example | Values |
|----------------|---------|--------|
| Spacing | `--space-4` | 0.25rem increments (1-12) |
| Typography | `--text-base` | xs, sm, base, lg, xl, 2xl, 3xl |
| Colors | `--color-text-primary` | Semantic tokens mapping to hex |
| Transitions | `--duration-fast` | 150ms, 200ms, 300ms |
| Elevation | `--shadow-sm` | 4 levels |
