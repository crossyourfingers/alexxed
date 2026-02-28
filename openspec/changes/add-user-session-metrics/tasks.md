# Tasks: Implement add-user-session-metrics

1. Backend: Schema
- Add `user_session` table to `spacetimedb/src/index.ts` with columns and index as specified in design.

2. Backend: Lifecycle hooks
- Update `clientConnected` to insert a `user_session` row with `connectedAt`.
- Update `clientDisconnected` to set `disconnectedAt` for the matching open session.

3. Backend: Scheduled cleanup
- Add a scheduled reducer to delete `user_session` rows older than 90 days.

4. Backend: Views
- Add a `view` (per-subscriber) exposing the current session for `ctx.sender` and the total session count for the user.

5. Publish & generate bindings
- Run `spacetime publish` (or `spacetime start` locally then `spacetime publish`) and `spacetime generate` to update `src/module_bindings`.

6. Frontend: Feature flag
- Add `ENABLE_USER_SESSION_METRICS` to `src/config/featureFlags.ts`.

7. Frontend: SessionWidget
- Add `src/components/SessionWidget.tsx` that subscribes to the new view(s) and displays live-updating duration + session count.
- Use `useEffect` with `setInterval` to update the `now` timestamp for the live duration display.

8. Frontend: Global header integration
- Import and render `SessionWidget` in the global header area (e.g., `src/App.tsx` or `src/main.tsx`) behind the feature flag.

9. Tests
- Add unit tests for: formatting of duration, component rendering with no session, and rendering with session data.
- Add integration test to ensure `SessionWidget` subscribes and updates when `connectedAt` changes.

10. Docs
- Update `README.md` or `AUTH_SETUP.md` with privacy/retention notes and feature flag info.

11. Release
- Bump changelog and include migration notes for database schema changes.

Optional (stretch):
- Add UI to view/revoke past sessions; add admin-only views for session lists.
