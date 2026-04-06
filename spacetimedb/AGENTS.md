# Backend (SpacetimeDB) Guidelines

Parent: [../AGENTS.md](../AGENTS.md) | Constitution: [Project Constitution](../domain_knowledge/constitution.md)

**CRITICAL:** Never read `.env` files. Use `.env.example` only. See [secrets policy](../AGENTS.md#critical-secrets-protection-non-negotiable).

Note on agent permissions: if the repository root contains a `.agent-permissions.json` file that sets `allow_assistant_commit_push` to `true`, agents MAY perform repository-modifying actions (staging, committing, and pushing non-sensitive changes) without explicit approval each time. Agents MUST still follow any `disallowed_actions` in that file (for example `"read_env_files"`). **NEVER use `git add .`** — stage specific files only.

---

## Tech Stack

- **SpacetimeDB** TypeScript server module
- Entry point: `src/index.ts`

---

## Core Principles

1. **Backend-First Logic** — As much business logic as possible should be in the SpacetimeDB backend. The frontend should only be responsible for rendering and user interaction.
2. **Reducers are transactional** — they do not return data to callers.
3. **Reducers must be deterministic** — no filesystem, network, timers, or random.
4. **Read data via tables/subscriptions** — not reducer return values.
5. **`ctx.sender` is the authenticated principal** — never trust identity args.

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

# Call a reducer directly (for testing)
spacetime call alexxed set_name "Alex"

# Call a procedure directly (for testing)
spacetime call alexxed sync_games_from_sheet ""

# For more details, see: TESTING.md
```

---

## Testing

For detailed instructions on how to test reducers and procedures using the CLI, refer to the [Testing Guide](TESTING.md).

CLI testing is encouraged for rapid verification of backend logic.

---

## Agent Skills (SpacetimeDB Procedures)

The backend provides specialized procedures ("skills") that agents can use to verify data and system state:

| Skill | Purpose | Command Example |
| ----- | ------- | --------------- |
| `validate_library_data` | Checks `owned_game` integrity (missing covers/genres) | `spacetime call alexxed-u3k4f validate_library_data` |
| `sync_library_from_sheet` | Fetches fresh library data from Google Sheets | `spacetime call alexxed-u3k4f sync_library_from_sheet ""` |
| `enrich_from_igdb` | Fetches high-quality metadata from IGDB | `spacetime call alexxed-u3k4f enrich_from_igdb 20 library` |

---

## Mandatory Self-Testing

AI Agents and developers MUST verify backend changes locally before pushing.

### 1. SpacetimeDB CLI (Direct Logic Testing)
Test business logic directly to bypass UI complexity and ensure deterministic behavior.

- **Check State:** `spacetime sql alexxed-u3k4f "SELECT * FROM ..."`
- **Call Reducers/Procedures:** `spacetime call alexxed-u3k4f <reducer> [args...]`
- **Validate Data:** `spacetime call alexxed-u3k4f validate_library_data`
- **Monitor Logs:** `spacetime logs alexxed-u3k4f --follow`

### 2. Regression Testing
For any logic fix or schema change:
1. Verify failure with the original logic (reproducer script or CLI call).
2. Apply changes and verify success.
3. Check logs for panics or unexpected warnings.

For more details, see: [TESTING.md](TESTING.md)

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
