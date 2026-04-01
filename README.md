# Alexxed - Real-time Streaming Community Platform

A real-time streaming community application built with SpacetimeDB, React, and TypeScript. Features multi-channel chat, emoji reactions, message likes, online presence, and link previews.

## Features

- 💬 **Multi-channel Chat** - Create and switch between chat channels
- 😀 **Emoji Reactions** - React to messages with 👍 ❤️ 😂 😮 😢 🎉
- ❤️ **Message Likes** - Like/unlike messages with toggle feature flag
- 👥 **Online Presence** - Real-time online/offline user tracking
- 🔗 **Link Previews** - Automatic URL preview cards with images
- 📺 **Stream Page** - YouTube embed with sidebar chat
- 🎨 **Dark/Light Theme** - CSS custom properties with theme switcher
- 🎯 **Auto-scroll** - Intelligent pause when reading history
- 📊 **Session Metrics** - Connection time and session count widget
- 🔐 **SpacetimeAuth** - OIDC authentication via SpacetimeDB
- 📋 **Spec-Driven Development** - Project specs and proposals live in `domain_knowledge/` (see [domain_knowledge/index.md](domain_knowledge/index.md))

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Stream | `/stream` | YouTube video embed with real-time chat sidebar |
| Community | `/community/:channel` | Full-featured multi-channel chat |
| Profile | `/profile` | Streamer profile page |
| 404 | `*` | Custom not found page |

## Quick Start

### Prerequisites

- Node.js 20.19.0+
- SpacetimeDB CLI: [Installation Guide](https://spacetimedb.com/install)
- pnpm (or npm)

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   ```env
   VITE_SPACETIMEAUTH_CLIENT_ID=your_client_id
   VITE_SPACETIMEDB_HOST=ws://localhost:3000
   VITE_SPACETIMEDB_DB_NAME=alexxed
   ```

3. **Start SpacetimeDB server:**
   ```bash
   spacetime start
   ```

4. **Publish the backend module:**
   ```bash
   spacetime publish alexxed --clear-database -y --module-path spacetimedb
   ```

5. **Generate client bindings:**
   ```bash
   spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
   ```

6. **Start the dev server:**
   ```bash
   pnpm dev
   ```

## Architecture

### Backend (SpacetimeDB Module)

Located in `spacetimedb/src/`:

**Tables:**
- `user` - User profiles with identity and name
- `message` - Chat messages with channel association
- `message_like` - Message likes (user + message timestamp)
- `message_reaction` - Emoji reactions (user + message + emoji)
- `channel` - Chat channels with name and description
- `system_message` - Connection events (connect/disconnect)
- `link_preview` - Cached URL preview data

**Reducers:**
- `send_message` - Post a message to a channel
- `toggle_like` - Like/unlike a message
- `toggle_reaction` - Add/remove emoji reaction
- `set_name` - Update user display name
- `create_channel` / `delete_channel` - Channel management

**Lifecycle Hooks:**
- `clientConnected` - Create user record on first connection
- `clientDisconnected` - Update presence status

### Frontend (React)

Located in `src/`:

**Pages:**
- `StreamPage` - Video player with chat sidebar
- `CommunityPage` - Multi-channel chat with online users
- `StreamerProfilePage` - Profile information
- `NotFoundPage` - 404 with navigation

**Components:**
- `Header` - Navigation with theme switcher and session widget
- `Chat/` - MessageList, MessageInput, OnlineUsers, ChannelSidebar
- `ThemeSwitcher` - Dark/light mode toggle
- `SessionWidget` - Connection metrics display

### Authentication

Uses SpacetimeAuth (OIDC). Get your client ID from [SpacetimeDB Auth](https://spacetimedb.com):

```env
VITE_SPACETIMEAUTH_CLIENT_ID=your_client_id
```

### Feature Flags

Toggle features via environment variables:

```env
VITE_ENABLE_EMOJI_REACTIONS=true    # Emoji reactions (default: true)
VITE_ENABLE_MESSAGE_LIKES=true      # Message likes (default: true)
VITE_ENABLE_USER_SESSION_METRICS=true  # Session widget (default: true)
```

## Project Structure

```
alexxed/
├── domain_knowledge/           # Human + LLM-friendly domain knowledge & specs
│   ├── index.md                # TOC & entry points for domain knowledge
│   ├── constitution.md         # Project constitution and core principles
│   ├── devstral-gaps.md        # Maintainability gaps and recommendations
│   └── game-voting-feature.md  # Game voting feature proposal summary
├── spacetimedb/                # Backend module
│   └── src/
│       ├── schema.ts           # Table definitions
│       └── index.ts            # Reducers and lifecycle
├── src/                        # Frontend
│   ├── auth/                   # SpacetimeAuth integration
│   ├── components/             # Reusable UI components
│   │   ├── Chat/               # Chat components
│   │   ├── Header.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   └── SessionWidget.tsx
│   ├── pages/                  # Route pages
│   │   ├── StreamPage.tsx
│   │   ├── CommunityPage.tsx
│   │   ├── StreamerProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/                  # Custom React hooks
│   ├── config/                 # Feature flags
│   ├── module_bindings/        # Generated SpacetimeDB bindings
│   └── main.tsx                # Root with providers
├── AGENTS.md                   # SpacetimeDB coding rules
└── README.md
```

## Project Domain Knowledge & Specs

All canonical, human- and LLM-readable domain knowledge (specs, proposals, governance notes) lives in `domain_knowledge/`.

Getting started:

1. Read the domain index: [domain_knowledge/index.md](domain_knowledge/index.md)
2. Review the Project Constitution: [domain_knowledge/constitution.md](domain_knowledge/constitution.md)
3. Read feature summaries (e.g., [game voting](domain_knowledge/game-voting-feature.md)) or gap analyses (e.g., [devstral gaps](domain_knowledge/devstral-gaps.md)).

Proposing changes:

- Draft a concise spec file in `domain_knowledge/` or open a GitHub issue linking to a short spec.
- Specs should include: motivation, goals, data model, UX, integration points, and acceptance criteria.
- Link specs to tasks and tests; include verification steps.

Notes:

- If you use an external spec workflow (Spec Kit or similar), ensure a human-readable spec summary is added to `domain_knowledge/`.

Existing domain docs: see [domain_knowledge/index.md](domain_knowledge/index.md)

## SpacetimeDB Commands

```bash
# Start local server
spacetime start

# Publish module
spacetime publish alexxed --module-path spacetimedb

# Clear and republish
spacetime publish alexxed --clear-database -y --module-path spacetimedb

# Generate bindings
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb

# View logs
spacetime logs alexxed --follow
```

## Contributing

2. Follow `AGENTS.md` for SpacetimeDB conventions
3. Update specs when behavior changes
4. Ensure reducers remain deterministic

## Resources

- [SpacetimeDB Docs](https://spacetimedb.com/docs)
- [SpacetimeDB TypeScript SDK](https://spacetimedb.com/docs/sdks/typescript)
- [SpacetimeDB Discord](https://discord.gg/spacetimedb)
