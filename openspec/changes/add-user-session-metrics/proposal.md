# Proposal: Add user session metrics

## What
Add per-session tracking on the server and show the current user's connection duration and total historical session count in the global header.

## Why
- Improves user awareness: users can see how long they're connected and how many sessions they've had across devices/browsers.
- Useful for debugging connection issues and for product analytics (opt-in).
- Enables features later (session history, device management).

## Scope
- Backend: create a `user_session` table that stores `sessionId`, `userId`, `clientId?`, `connectedAt`, `disconnectedAt`.
- Server lifecycle hooks: insert session row on `clientConnected`, update `disconnectedAt` on `clientDisconnected`.
- Frontend: display current session duration and total session count in the global header; allow optional tooltip with last session time.
- Migration: publish spacetime module, regenerate client bindings.

## Out-of-scope
- Full session management UI (session revocation) — can be added later.
- Detailed analytics pipeline or long-term retention/purging rules (we will provide a simple cleanup job).

## Risks & Privacy
- Session rows contain timing metadata. Ensure retention policy and access control are defined (default: private to the owning user; no public exposure).
- Anonymous identities stored in `localStorage` may be cleared; document attribution caveats.

## Acceptance criteria
- A `user_session` table exists and records connect + disconnect timestamps per client session.
- Global header shows current user's connected duration (live updating) and total session count.
- New schema published and `module_bindings` regenerated; frontend subscribes to necessary data and shows updates in real time.
