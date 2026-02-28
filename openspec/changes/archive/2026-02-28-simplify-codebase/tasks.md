# Tasks: Implement simplify-codebase

## Phase 1: Remove Unused Files

- [x] 1. Delete `alex.excalidraw` (unused diagram file)
- [x] 2. Delete `openspec/plans/add-user-session-metrics.md` (superseded working notes)

## Phase 2: Consolidate AI Instruction Files

- [x] 3. Delete `AGENTS.md` (duplicate of CLAUDE.md)
- [x] 4. Delete `.windsurfrules` (duplicate of CLAUDE.md)
- [x] 5. Update `.github/copilot-instructions.md` to a minimal file referencing CLAUDE.md:
  ```markdown
  See [CLAUDE.md](../CLAUDE.md) for SpacetimeDB coding guidelines.
  ```

## Phase 3: Create Shared Hook

- [x] 6. Create `src/hooks/` directory (if not exists)
- [x] 7. Create `src/hooks/useOnlineUsers.ts` with shared online user tracking logic:
  - Export hook that returns `{ onlineUsers, offlineUsers, allUsers, systemMessages }`
  - Include `onInsert`/`onDelete` callbacks for connect/disconnect notifications

## Phase 4: Refactor App.tsx

- [x] 8. Import `ENABLE_MESSAGE_LIKES` from `./config/featureFlags` (remove hardcoded constant)
- [x] 9. Import `PrettyMessage` type from `./components/Chat` (remove local type definition)
- [x] 10. Replace inline online user tracking with `useOnlineUsers()` hook

## Phase 5: Refactor CommunityPage.tsx

- [x] 11. Replace inline online user tracking with `useOnlineUsers()` hook
- [x] 12. Remove local `systemMessages` state (use hook's return value)

## Phase 6: Refactor StreamPage.tsx

- [x] 13. Replace inline online user tracking with `useOnlineUsers()` hook
- [x] 14. Remove local `systemMessages` state (use hook's return value)

## Phase 7: Verification

- [x] 15. Run `npm test` to verify integration tests pass
- [x] 16. Run `npm run dev` and manually verify:
  - App loads without errors
  - Online user connect/disconnect notifications appear
  - Message likes function on all pages
  - CommunityPage, StreamPage, and App all work correctly

## Phase 8: Cleanup (Optional)

- [x] 17. Run linter/formatter to ensure consistent code style
- [x] 18. Update CHANGELOG.md with refactor notes

---

## Dependencies

- Tasks 1-5 can be done in parallel (independent file deletions)
- Task 7 must complete before tasks 10-14 (hook must exist before pages can use it)
- Tasks 10-14 can be done in parallel (independent page refactors)
- Tasks 15-16 must be done after all code changes (verification)

## Rollback Plan

Each task is a small, atomic change. If any step causes issues:
1. Revert the specific commit
2. Investigate the issue
3. Fix and continue

All changes are additive (creating hook) or subtractive (deleting duplicates) with no external dependencies.
