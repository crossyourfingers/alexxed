# Frontend (React/TypeScript) Guidelines

Parent: [../AGENTS.md](../AGENTS.md) | Constitution: [../.specify/memory/constitution.md](../.specify/memory/constitution.md)

**CRITICAL:** Never read `.env` files. Use `.env.example` only. See [secrets policy](../AGENTS.md#critical-secrets-protection-non-negotiable).

---

## Tech Stack

- **React 18** with TypeScript
- **Vite 7** for bundling/dev server
- **React Router DOM 6** for routing
- **SpacetimeDB React SDK** (`spacetimedb/react`)
- **Vitest** for testing

---

## Code Standards

### SpacetimeDB Integration

```typescript
// Imports — use generated bindings
import { DbConnection, tables } from "./module_bindings";
import { SpacetimeDBProvider, useTable, Identity } from "spacetimedb/react";

// Data access — useTable returns tuple
const [items, isLoading] = useTable(tables.item);

// Reducer calls — ALWAYS use object syntax
conn.reducers.doSomething({ param: "value" });

// Identity comparison — use toHexString()
const isOwner = row.ownerId.toHexString() === myIdentity.toHexString();

// Memoize connection builder to prevent reconnects
const builder = useMemo(
  () =>
    DbConnection.builder()
      .withUri(SPACETIMEDB_URI)
      .withDatabaseName(MODULE_NAME)
      .onConnect(onConnect),
  [],
);
```

### Timestamps (CRITICAL)

```typescript
// Timestamps are objects, not numbers
const date = new Date(Number(row.createdAt.microsSinceUnixEpoch / 1000n));
```

### Prohibited Patterns

- `@spacetimedb/sdk` — use `spacetimedb`
- Positional reducer args — use object syntax
- Inline `connectionBuilder` — use `useMemo`
- Optimistic UI updates — let subscriptions drive state
- Inventing hooks like `useItems()` — use `useTable(tables.tableName)`

---

## Directory Structure

```
src/
├── auth/           # OIDC authentication (SpacetimeAuth)
├── components/     # Reusable UI components
│   └── Chat/       # Chat-specific components
├── config/         # Feature flags, environment config
├── data/           # Static/fallback data
├── hooks/          # Custom React hooks
├── module_bindings/# Generated SpacetimeDB bindings (DO NOT EDIT)
├── pages/          # Route-level page components
├── services/       # External API integrations
├── styles/         # CSS theme variables
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

---

## Known Technical Debt

From [../.specify/proposals/devstral-gaps.md](../.specify/proposals/devstral-gaps.md):

1. **Message display logic duplicated** between `App.tsx` and `StreamPage.tsx`
2. **Inconsistent component architecture** — some pages use inline rendering, others use reusable components
3. **Mixed concerns in root components** — state, fetching, formatting, display all mixed

Recommendations (when refactoring):

- Create shared `useChatMessages()` hook
- Standardize on `MessageList`/`MessageInput` components
- Create `useChannelByName()` utility hook

---

## Testing

```bash
pnpm test          # Run Vitest
pnpm test:ui       # Interactive test UI
```

- Tests live alongside source files (`*.test.tsx`)
- Use React Testing Library for component tests
- All PRs should have passing tests
