## Tasks: Implement add-user-session-metrics

### Backend

- [x] 1. Schema: add `user_session` table to `spacetimedb/src/index.ts` with columns and index as specified in design.
- [x] 2. Lifecycle hooks: update `clientConnected` to insert a `user_session` row with `connectedAt`, and update `clientDisconnected` to set `disconnectedAt` for the matching open session.
- [x] 3. Scheduled cleanup: add a scheduled reducer to delete `user_session` rows older than 90 days.
- [x] 4. Views: add a `view` (per-subscriber) exposing the current session for `ctx.sender` and the total session count for the user.

### Publish

- [x] 5. Publish & generate bindings: run `spacetime publish` (or `spacetime start` locally then `spacetime publish`) and `spacetime generate` to update `src/module_bindings`.

### Frontend

- [x] 6. Feature flag: add `ENABLE_USER_SESSION_METRICS` to `src/config/featureFlags.ts`.
- [x] 7. SessionWidget: add `src/components/SessionWidget.tsx` that subscribes to the new view(s) and displays live-updating duration + session count (use `useEffect` + `setInterval` for ticking).
- [x] 8. Global header integration: import and render `SessionWidget` in the global header area (e.g., `src/App.tsx` or `src/main.tsx`) behind the feature flag.

### Tests

- [x] 9. Tests: add unit tests for duration formatting and component rendering, plus an integration test ensuring `SessionWidget` subscribes and updates when `connectedAt` changes.

### Docs & Release

- [x] 10. Docs: update `README.md` or `AUTH_SETUP.md` with privacy/retention notes and feature flag info.
- [x] 11. Release: bump changelog and include migration notes for database schema changes.

### Optional (stretch)

- [x] 12. Optional: add UI to view/revoke past sessions and admin-only views for session lists.
