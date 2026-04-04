# Alexxed - Real-time Streaming Community Platform

A real-time streaming community application built with [SpacetimeDB](https://spacetimedb.com), React, and TypeScript. Features multi-channel chat, emoji reactions, message likes, online presence, and link previews.

> **For Developers & AI Agents:** See [AGENTS.md](AGENTS.md) for coding guidelines and SpacetimeDB conventions.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Domain Knowledge](#domain-knowledge)
- [Recommended Tools](#recommended-tools)
- [Contributing](#contributing)

---

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

**Pages:**

| Page | Route | Description |
|------|-------|-------------|
| Stream | `/stream` | YouTube video embed with real-time chat sidebar |
| Community | `/community/:channel` | Full-featured multi-channel chat |
| Profile | `/profile` | Streamer profile page |
| 404 | `*` | Custom not found page |

---

## Quick Start

### 1. Prerequisites

Install these tools before starting:

- **Node.js** 20.19.0+ ([download](https://nodejs.org))
- **pnpm** (or npm): `npm install -g pnpm`
- **SpacetimeDB CLI**: [Installation Guide](https://spacetimedb.com/install)
  ```bash
  # Verify installation
  spacetime version
  ```

### 2. Clone and Install

```bash
git clone <repository-url>
cd alexxed
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
VITE_SPACETIMEAUTH_CLIENT_ID=your_client_id
VITE_SPACETIMEDB_HOST=ws://localhost:3000
VITE_SPACETIMEDB_DB_NAME=alexxed
```

> **Note:** Get your `VITE_SPACETIMEAUTH_CLIENT_ID` from [SpacetimeDB Auth](https://spacetimedb.com/auth)

### 4. Start SpacetimeDB

```bash
# Start the local SpacetimeDB server
spacetime start
```

Keep this terminal open. The server runs on `http://localhost:3000` by default.

### 5. Publish Backend Module

In a new terminal:

```bash
# Publish the backend module to SpacetimeDB
spacetime publish alexxed --clear-database -y --module-path spacetimedb
```

### 6. Generate Client Bindings

```bash
# Generate TypeScript bindings from the SpacetimeDB schema
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
```

### 7. Start Frontend Dev Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Development Workflow

### Day-to-Day Development

**When working on frontend only:**
```bash
# Terminal 1: SpacetimeDB server (keep running)
spacetime start

# Terminal 2: Frontend dev server
pnpm dev
```

**When modifying backend (SpacetimeDB module):**

1. Edit files in `spacetimedb/src/`
2. Republish the module:
   ```bash
   spacetime publish alexxed --clear-database -y --module-path spacetimedb
   ```
3. Regenerate client bindings:
   ```bash
   spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
   ```
4. Frontend will hot-reload automatically

### Common SpacetimeDB Commands

```bash
# Start local SpacetimeDB server
spacetime start

# Publish module (preserves data)
spacetime publish alexxed --module-path spacetimedb

# Publish and clear database (fresh start)
spacetime publish alexxed --clear-database -y --module-path spacetimedb

# Generate TypeScript client bindings
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb

# View server logs
spacetime logs alexxed --follow

# List databases
spacetime list

# Stop server
# (Ctrl+C in the terminal running `spacetime start`)
```

### Feature Flags

Toggle features via environment variables in `.env`:

```env
VITE_ENABLE_EMOJI_REACTIONS=true          # Emoji reactions (default: true)
VITE_ENABLE_MESSAGE_LIKES=true            # Message likes (default: true)
VITE_ENABLE_USER_SESSION_METRICS=true     # Session widget (default: true)
```

---

---

## Project Structure

```
alexxed/
├── AGENTS.md                   # ⭐ Coding guidelines & SpacetimeDB rules for developers & AI agents
├── domain_knowledge/           # ⭐ Human + AI-friendly domain knowledge, specs, and proposals
│   ├── index.md                # TOC & entry point for domain knowledge
│   ├── constitution.md         # Project constitution and core principles
│   ├── spacetimedb-typescript-guide.md  # Complete SpacetimeDB TypeScript SDK reference
│   ├── game-voting-feature.md  # Game voting feature proposal
│   ├── features.md             # Key features overview
│   ├── business_rules.md       # Business rules and constraints
│   └── glossary.md             # Project terminology
├── spacetimedb/                # Backend (SpacetimeDB module)
│   ├── AGENTS.md               # Backend-specific coding guidelines
│   └── src/
│       ├── schema.ts           # Table definitions and schema
│       └── index.ts            # Reducers, procedures, lifecycle hooks
├── src/                        # Frontend (React + TypeScript)
│   ├── auth/                   # SpacetimeAuth integration
│   ├── components/             # Reusable UI components
│   │   ├── Chat/               # Chat-related components
│   │   ├── Header.tsx          # Navigation header
│   │   ├── ThemeSwitcher.tsx   # Dark/light mode toggle
│   │   └── SessionWidget.tsx   # Connection metrics
│   ├── pages/                  # Route pages
│   │   ├── StreamPage.tsx      # Stream page with video + chat
│   │   ├── CommunityPage.tsx   # Multi-channel chat page
│   │   ├── StreamerProfilePage.tsx  # Profile page
│   │   └── NotFoundPage.tsx    # 404 page
│   ├── hooks/                  # Custom React hooks
│   ├── config/                 # Feature flags
│   ├── module_bindings/        # ⚙️ Generated SpacetimeDB bindings (DO NOT EDIT)
│   └── main.tsx                # Root with providers
├── agent_workspace/            # Scratch space for AI agents (ephemeral, non-authoritative)
├── .agent-permissions.json     # Machine-readable agent runtime permissions
└── README.md                   # ⭐ You are here
```

### Architecture Overview

**Backend (SpacetimeDB Module)** — Located in `spacetimedb/src/`

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

**Frontend (React)** — Located in `src/`

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

---

## Domain Knowledge

**All canonical project knowledge lives in `domain_knowledge/`** — this includes specifications, proposals, business rules, and architectural decisions.

### Key Files

- **[domain_knowledge/index.md](domain_knowledge/index.md)** — Start here! Table of contents for all domain knowledge
- **[domain_knowledge/constitution.md](domain_knowledge/constitution.md)** — Project values, principles, and governance
- **[domain_knowledge/spacetimedb-typescript-guide.md](domain_knowledge/spacetimedb-typescript-guide.md)** — Complete SpacetimeDB TypeScript SDK reference
- **[domain_knowledge/game-voting-feature.md](domain_knowledge/game-voting-feature.md)** — Upcoming game voting feature proposal
- **[domain_knowledge/features.md](domain_knowledge/features.md)** — Key features overview
- **[domain_knowledge/business_rules.md](domain_knowledge/business_rules.md)** — Business rules and constraints
- **[AGENTS.md](AGENTS.md)** — Coding guidelines for developers and AI agents

### Proposing Changes

1. Draft a spec in `domain_knowledge/` or link to an external spec
2. Include: motivation, goals, data model, UX, integration points, acceptance criteria
3. Link specs to tasks and tests
4. Add verification steps

---

## Recommended Tools

### For Humans

- **VS Code** with extensions:
  - GitHub Copilot
  - **OpenCode** (recommended) — Advanced AI coding agent for VS Code
  - ESLint
  - Prettier
  - TypeScript
- **SpacetimeDB CLI** — Essential for backend development ([install guide](https://spacetimedb.com/install))

### For AI Agents

- **Read [AGENTS.md](AGENTS.md) first** — Contains critical coding guidelines and SpacetimeDB conventions
- **Check [domain_knowledge/](domain_knowledge/)** for project context and specifications
- **Consult [domain_knowledge/spacetimedb-typescript-guide.md](domain_knowledge/spacetimedb-typescript-guide.md)** for SpacetimeDB TypeScript patterns
- **Never read `.env` files** — See secrets policy in [AGENTS.md](AGENTS.md)
- **Use `agent_workspace/` for scratch files** — Never create ad-hoc files in source directories

---

## Contributing

### Development Guidelines

1. **Read the documentation:**
   - [AGENTS.md](AGENTS.md) — Coding conventions and SpacetimeDB rules
   - [domain_knowledge/constitution.md](domain_knowledge/constitution.md) — Project principles
   - [domain_knowledge/spacetimedb-typescript-guide.md](domain_knowledge/spacetimedb-typescript-guide.md) — SpacetimeDB patterns

2. **Follow SpacetimeDB conventions:**
   - Reducers must be deterministic (no filesystem, network, timers, random)
   - Use `ctx.sender` for authenticated identity
   - Indexes go in OPTIONS (1st arg), not COLUMNS (2nd arg)
   - Use BigInt for u64/i64 fields (`0n`, `1n`, not `0`, `1`)
   - Reducer calls use object syntax (`{ param: 'value' }`)

3. **Update documentation:**
   - Update specs in `domain_knowledge/` when behavior changes
   - Keep [domain_knowledge/index.md](domain_knowledge/index.md) current

4. **Test your changes:**
   - Test locally with `spacetime start` and `pnpm dev`
   - Verify reducers work as expected
   - Check UI updates reflect backend changes

### Backend Development Checklist

When implementing a feature that spans backend and client:

1. **Backend:** Define table(s) to store the data
2. **Backend:** Define reducer(s) to mutate the data
3. **Client:** Subscribe to the table(s)
4. **Client:** Call the reducer(s) from UI — **don't forget this step!**
5. **Client:** Render the data from the table(s)

**Common mistake:** Building backend tables/reducers but forgetting to wire up the client to call them.

---

## Resources

- **SpacetimeDB:**
  - [Official Documentation](https://spacetimedb.com/docs)
  - [TypeScript SDK Guide](https://spacetimedb.com/docs/sdks/typescript)
  - [Discord Community](https://discord.gg/spacetimedb)
- **Project Documentation:**
  - [AGENTS.md](AGENTS.md) — Coding guidelines
  - [domain_knowledge/](domain_knowledge/) — Specifications and knowledge base
  - [domain_knowledge/spacetimedb-typescript-guide.md](domain_knowledge/spacetimedb-typescript-guide.md) — Complete SDK reference

---

## License

See [LICENSE](LICENSE) file for details.
