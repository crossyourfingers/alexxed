Plan: Add user session metrics (connection duration + session count)

Todo:
- Research codebase for auth/session (done)
- Ask user for change details (in-progress)
- Draft proposal & artifacts plan
- Create change scaffold (openspec new change)
- Prepare final summary & next steps

Key findings:
- Auth/session code locations: `src/auth/*`, `src/main.tsx`, `spacetimedb/src/index.ts`, generated bindings `src/module_bindings/*`.
- Server-side `user` table currently only has `identity`, `name?`, `online` — no session timestamps or counts.
- Client-side anonymous identity persists in `localStorage` via `src/auth/useAnonymousAuth.tsx`.
- Connection lifecycle hooks are in `src/main.tsx` (`onConnect`/`onDisconnect`) and server `clientConnected`/`clientDisconnected` in `spacetimedb/src/index.ts`.

UI candidates to display metrics:
- `src/components/Chat/OnlineUsers.tsx` — per-user rows, ideal for per-user duration and session count.
- `src/pages/CommunityPage.tsx` — header/user-badge area for current user's metrics.
- `src/pages/StreamPage.tsx` — compact display next to viewers count; visible during streams.
- `src/main.tsx` — for wiring connect/disconnect hooks and emitting reducer calls.

Design considerations / blockers:
- Need server-side schema changes (add fields to `user` or add `user_session` table) and regenerate `module_bindings`.
- Decide session model: per-identity aggregated counters vs per-client session rows (affects storage and UI semantics).
- Privacy/retention policy for session records.
- Anonymous identities may reset if `localStorage` cleared — attribution caveat.

Suggested change names (kebab-case):
- add-user-session-metrics
- user-session-tracking
- add-connection-duration-and-session-count

Chosen camelCase name for this plan: `addUserSessionMetrics`

Next steps:
1. Confirm desired display location (CommunityPage / StreamPage / OnlineUsers / global header).
2. Decide session model (aggregate counters on `user` vs separate `user_session` rows).
3. If server schema change approved: create change scaffold, implement SpacetimeDB table/reducer changes, publish and regenerate bindings.
4. Implement frontend subscription to new fields and display UI.

Files referenced during research:
- src/auth/authProvider.ts
- src/auth/useAuth.tsx
- src/auth/useAnonymousAuth.tsx
- src/main.tsx
- spacetimedb/src/index.ts
- src/components/Chat/OnlineUsers.tsx
- src/pages/CommunityPage.tsx
- src/pages/StreamPage.tsx

Prepared for refinement.
