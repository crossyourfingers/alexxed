# Backend (SpacetimeDB) Guidelines

Parent: [../AGENTS.md](../AGENTS.md) | Constitution: [Project Constitution](../domain_knowledge/constitution.md)

**CRITICAL:** Never read `.env` files. Use `.env.example` only. See [secrets policy](../AGENTS.md#critical-secrets-protection-non-negotiable).

Note on agent permissions: if the repository root contains a `.agent-permissions.json` file that sets `allow_assistant_commit_push` to `true`, agents MAY perform repository-modifying actions (staging, committing, and pushing non-sensitive changes) without explicit approval each time. Agents MUST still follow any `disallowed_actions` in that file (for example `"read_env_files"`).

---

## Tech Stack

- **SpacetimeDB** TypeScript server module
- Entry point: `src/index.ts`

---

## Core Principles

1. **Reducers are transactional** — they do not return data to callers
2. **Reducers must be deterministic** — no filesystem, network, timers, or random
3. **Read data via tables/subscriptions** — not reducer return values
4. **`ctx.sender` is the authenticated principal** — never trust identity args

---

## Table Definition

```typescript
// table(OPTIONS, COLUMNS) — indexes go in OPTIONS
export const Task = table(
  {
    name: "task",
    public: true,
    indexes: [
      { name: "task_owner_id", algorithm: "btree", columns: ["ownerId"] },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    ownerId: t.identity(),
    title: t.string(),
    createdAt: t.timestamp(),
  },
);

// Schema export — takes exactly ONE object
const spacetimedb = schema({ Task, User, Message });
export default spacetimedb;
```

---

## Reducer Definition

```typescript
// Name comes from export, NOT string argument
export const create_task = spacetimedb.reducer(
  { title: t.string() },
  (ctx, { title }) => {
    ctx.db.task.insert({
      id: 0n, // Auto-inc placeholder
      ownerId: ctx.sender,
      title,
      createdAt: ctx.timestamp,
    });
  },
);

// Update pattern — spread existing row
const existing = ctx.db.task.id.find(taskId);
ctx.db.task.id.update({ ...existing, title: newTitle });
```

---

## Critical Rules

| Wrong                          | Right                           |
| ------------------------------ | ------------------------------- |
| `indexes` in COLUMNS (2nd arg) | `indexes` in OPTIONS (1st arg)  |
| `filter({ ownerId })`          | `filter(ownerId)`               |
| `const id = table.insert(...)` | `const row = table.insert(...)` |
| `.iter()` in views             | Use index lookups               |
| `ctx.db` in procedures         | `ctx.withTx(tx => tx.db...)`    |

---

## Index Naming

**Use `{tableName}_{columnName}` pattern to avoid collisions:**

```typescript
// GOOD
indexes: [{ name: 'message_channel_id', algorithm: 'btree', columns: ['channelId'] }]

// BAD — will collide across tables
indexes: [{ name: 'by_channel', ... }]
```

---

## Commands

```bash
# Publish module
spacetime publish alexxed --module-path spacetimedb

# Clear and republish (dev only)
spacetime publish alexxed --clear-database -y --module-path spacetimedb

# Generate client bindings (ALWAYS run after schema changes)
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb

# View logs
spacetime logs alexxed
```

---

## Directory Structure

```
spacetimedb/
├── src/
│   └── index.ts    # Tables, reducers, lifecycle hooks, views
├── package.json
└── tsconfig.json
```

---

## Debugging Checklist

1. Is SpacetimeDB server running? (`spacetime start`)
2. Is the module published? (`spacetime publish`)
3. Are client bindings generated? (`spacetime generate`)
4. Check server logs (`spacetime logs alexxed`)
5. **Is the reducer being called from the client?** (common miss)

---

## Upcoming: Game Voting Feature

The next major backend work involves:

- `Game` table: id, title, coverArtUrl, purchaseLink, played
- `UserVote` table: userId, gameId, vote (up/down/none)
- Reducers for casting/changing votes
- Procedures for fetching game metadata from external APIs (Steam, IGDB)

See: ../domain_knowledge/game-voting-feature.md
