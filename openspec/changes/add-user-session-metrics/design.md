# Design: Add `user_session` table and header UI

## Data model
Create a new table in `spacetimedb/src/schema.ts` (or `spacetimedb/src/index.ts`) named `user_session` with columns:
- `sessionId`: `t.u64().primaryKey().autoInc()`
- `userId`: `t.identity()`
- `clientId`: `t.string().optional()` (optional client identifier, e.g., UA or random id)
- `connectedAt`: `t.timestamp()`
- `disconnectedAt`: `t.timestamp().optional()`

Indexes:
- `{ name: 'user_session_user_id', algorithm: 'btree', columns: ['userId'] }`

## Server lifecycle
- `clientConnected` handler: insert a `user_session` row with `connectedAt = ctx.timestamp`, `disconnectedAt = undefined`, `clientId` derived from connection metadata if available.
- `clientDisconnected` handler: find the open session row for `ctx.sender` and `clientId` (if available) and set `disconnectedAt = ctx.timestamp`.

Notes:
- If `clientId` is not available, mark sessions by `userId` and the most recent open session.
- Use `ctx.sender` as the authoritative identity.

## Cleanup
- Add a scheduled reducer to delete `user_session` rows older than retention (e.g., 90 days) to prevent unbounded growth.

## Client bindings & views
- Add a view or query to fetch: (a) the current open session row for `ctx.sender` (most recent where `disconnectedAt` is null), and (b) the session count for the user (count of rows for `userId`).
- Because views must be subscribed to by name, add an `anonymousView` or `view` as appropriate to surface `session_count` and `current_session`.

## Frontend
- Location: global header (component used across pages).
- Add a small `SessionWidget` component that subscribes to the new view(s) via `useTable` or `DbConnection` `subscriptionBuilder()`.
- Display: live-updating `connected for Xm Ys` (computed client-side from `connectedAt`), and `Sessions: N` (total count). Highlight if `connectedAt` is missing or session not found.
- For live ticking, the component will update a local `now` every second using `useEffect`/`setInterval`.

## Migration steps
1. Add table & views in `spacetimedb/src/index.ts`.
2. Publish or run `spacetime publish` locally to update DB schema.
3. Run `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb/src` to regenerate bindings.
4. Implement frontend component and wire it into `src/main.tsx` or `src/App.tsx` global header.

## Feature flag
- Add `ENABLE_USER_SESSION_METRICS` in `src/config/featureFlags.ts` to toggle display and server-side behavior if desired.

## Security
- Ensure views expose only the current user's session data (use `view` with `ctx.sender`).
- Do not expose other users' session lists unless explicitly admin-only.
