# Alexxed - Real-time Chat with SpacetimeDB

A real-time chat application built with SpacetimeDB, React, and TypeScript, featuring message likes, online presence tracking, and flexible authentication modes.

## Features

- 💬 Real-time messaging with SpacetimeDB subscriptions
- ❤️ Message likes with toggle feature flag
- 👥 Online/offline user presence tracking
- 🔐 Switchable authentication (SpacetimeAuth OIDC or anonymous mode)
- 📺 YouTube video embedding in sidebar
- 🎨 Green/black theme with CSS custom properties
- 🎯 Auto-scroll with intelligent pause when reading history
- 📋 **Spec-Driven Development** with OpenSpec framework

## Quick Start

### Prerequisites

- Node.js 20.19.0+
- SpacetimeDB CLI installed: [Installation Guide](https://spacetimedb.com/install)
- pnpm (or npm)

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
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

## Development with OpenSpec

This project uses **OpenSpec** for spec-driven development. OpenSpec helps you and AI assistants agree on what to build before writing code.

### What is Spec-Driven Development?

Spec-driven development (SDD) is a workflow where you:
1. **Propose** what you want to build (the "why" and "what")
2. **Specify** requirements and scenarios (the behavior contract)
3. **Design** the technical approach (the "how")
4. **Implement** tasks in a checklist
5. **Archive** changes back into the source of truth

OpenSpec keeps a **single source of truth** in `openspec/specs/` and tracks **active changes** in `openspec/changes/`.

### Getting Started with OpenSpec

#### Prerequisites

OpenSpec is already initialized in this project! You just need to install it globally:

```bash
npm install -g @fission-ai/openspec@latest
```

After installation, **restart your IDE** for slash commands to take effect.

#### Your First Change

Use the `/opsx:propose` command in your AI assistant (Claude Code, Cursor, etc.):

```
/opsx:propose "add emoji reactions to messages"
```

OpenSpec will:
1. Create a change folder in `openspec/changes/add-emoji-reactions/`
2. Generate `proposal.md` (why and what)
3. Generate `specs/*/spec.md` (requirements and scenarios)
4. Generate `design.md` (technical approach)
5. Generate `tasks.md` (implementation checklist)

#### Implement the Change

```
/opsx:apply
```

The AI will work through the tasks in `tasks.md`, marking each complete as it goes.

#### Archive When Done

```
/opsx:archive
```

This merges your delta specs back into the main specs (`openspec/specs/`) and archives the change.

### OpenSpec Commands

| Command | Purpose |
|---------|---------|
| `/opsx:propose` | Create change + generate all planning artifacts |
| `/opsx:explore` | Think through ideas before committing to change |
| `/opsx:apply` | Implement tasks from tasks.md |
| `/opsx:archive` | Archive completed change |

### Project Context

OpenSpec is pre-configured with this project's context (see `openspec/config.yaml`):

- **Tech Stack:** SpacetimeDB backend, React + TypeScript frontend
- **Conventions:** Follow `CLAUDE.md` for SpacetimeDB rules
- **Architecture:** Real-time subscriptions, transactional reducers
- **Domain:** Chat with authentication, likes, presence

This context is automatically shown to AI when creating artifacts, ensuring consistency.

### Existing Specs

The current system is documented in:
- `openspec/specs/chat/spec.md` - Core messaging, likes, presence, UX
- `openspec/specs/auth/spec.md` - Authentication system with multiple providers

These specs serve as the **source of truth** for what the system does today.

### CLI Reference

```bash
# List active changes
openspec list

# Show change details
openspec show <change-name>

# Validate changes
openspec validate --all

# Interactive dashboard
openspec view

# Update OpenSpec after upgrade
openspec update
```

### Learn More

- **OpenSpec Docs:** https://github.com/Fission-AI/OpenSpec
- **Discord:** https://discord.gg/YctCnvvshC
- **Philosophy:** Fluid not rigid, iterative not waterfall, easy not complex

## Architecture

### Backend (SpacetimeDB Module)

Located in `spacetimedb/`:

- **Tables:** `user`, `message`, `message_like`
- **Reducers:** Transactional mutations (send_message, toggle_like, set_name)
- **Lifecycle Hooks:** onConnect/onDisconnect for presence tracking

### Frontend (React)

Located in `src/`:

- **Authentication:** Abstracted provider interface (`src/auth/`)
- **SpacetimeDB Integration:** Generated bindings in `src/module_bindings/`
- **UI:** Component-based with CSS Grid layout

### Authentication Modes

Toggle between modes in `.env`:

**Anonymous Mode (Development):**
```env
VITE_USE_ANONYMOUS_AUTH=true
```
- Instant access with random username
- No external auth required

**SpacetimeAuth Mode (Production):**
```env
VITE_USE_ANONYMOUS_AUTH=false
VITE_SPACETIMEAUTH_CLIENT_ID=your_client_id
```
- OAuth2/OIDC via SpacetimeAuth
- Requires dashboard setup at https://spacetimedb.com

## Project Structure

```
alexxed/
├── openspec/                   # Spec-driven development artifacts
│   ├── specs/                  # Source of truth (current system)
│   │   ├── chat/spec.md
│   │   └── auth/spec.md
│   ├── changes/                # Active changes (use /opsx commands)
│   ├── config.yaml             # Project context and rules
│   └── schemas/                # Custom workflows (optional)
├── spacetimedb/                # Backend module
│   └── src/
│       ├── schema.ts           # Table definitions
│       └── index.ts            # Reducers and lifecycle
├── src/                        # Frontend
│   ├── auth/                   # Auth abstraction layer
│   ├── module_bindings/        # Generated SpacetimeDB bindings
│   ├── App.tsx                 # Main chat component
│   ├── LoginForm.tsx           # Auth UI
│   └── main.tsx                # Root with providers
├── .claude/                    # Claude Code integration (OpenSpec)
├── CLAUDE.md                   # SpacetimeDB rules for AI
├── .env                        # Environment configuration
└── README.md                   # This file
```

## SpacetimeDB Commands

```bash
# Start local server
spacetime start

# Publish module
spacetime publish alexxed --module-path spacetimedb

# Clear database and republish
spacetime publish alexxed --clear-database -y --module-path spacetimedb

# Generate bindings
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb

# View logs
spacetime logs alexxed

# View logs (follow mode)
spacetime logs alexxed --follow
```

## Contributing

When adding features:

1. Use OpenSpec workflow: `/opsx:propose` → `/opsx:apply` → `/opsx:archive`
2. Follow `CLAUDE.md` for SpacetimeDB conventions
3. Update specs when behavior changes
4. Test both authentication modes
5. Ensure reducers remain deterministic

## Resources

- [SpacetimeDB Docs](https://spacetimedb.com/docs)
- [SpacetimeDB TypeScript SDK](https://spacetimedb.com/docs/sdks/typescript)
- [OpenSpec Framework](https://github.com/Fission-AI/OpenSpec)
- [SpacetimeDB Discord](https://discord.gg/spacetimedb)

Below is copied from the original template README:

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react';

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
});
```
