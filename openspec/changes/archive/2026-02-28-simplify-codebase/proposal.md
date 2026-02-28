# Proposal: Simplify Codebase

## What

Consolidate duplicative files, extract shared code into reusable hooks, remove unused files, and improve overall code organization. This is a safe refactor that maintains all existing functionality while significantly reducing maintenance burden.

## Why

The codebase has accumulated duplication over time that increases maintenance burden and risk of drift:

1. **Four AI instruction files with identical content** (3,000+ lines of duplication)
   - `.github/copilot-instructions.md` (770 lines)
   - `AGENTS.md` (762 lines)
   - `CLAUDE.md` (770 lines)
   - `.windsurfrules` (770 lines)
   
   When SpacetimeDB APIs change, all four files must be updated separately—this is error-prone and has already led to minor inconsistencies.

2. **Duplicated React patterns across pages** (~100 lines per page)
   - `CommunityPage.tsx`, `StreamPage.tsx`, and `App.tsx` all contain identical online user tracking logic with `onInsert`/`onDelete` callbacks
   - Same type definitions repeated instead of imported from shared location

3. **Feature flag inconsistency**
   - `App.tsx` hardcodes `const ENABLE_MESSAGE_LIKES = true` instead of importing from `featureFlags.ts`

4. **Unused files**
   - `alex.excalidraw` – no references found in codebase
   - `openspec/plans/add-user-session-metrics.md` – working notes superseded by the actual change

## Scope

### In-scope
- Consolidate AI instruction files to a single source of truth
- Extract shared React hooks for online user tracking
- Fix feature flag usage in `App.tsx`
- Remove confirmed unused files
- Ensure all existing functionality works identically after refactor

### Out-of-scope
- Changing any business logic or features
- Restructuring the entire project hierarchy
- Updating dependencies or tooling
- Performance optimizations beyond removing dead code

## Risks

- **Low risk**: All changes are refactors that preserve behavior
- **Mitigation**: Run existing integration tests (`App.integration.test.tsx`) and manual verification after each step
- **Rollback**: Git history allows easy reversion of any problematic change

## Acceptance Criteria

1. Only ONE canonical AI instruction file exists; others are deleted or symlinked
2. Shared hooks exist for online user tracking; pages import from them
3. `App.tsx` imports `ENABLE_MESSAGE_LIKES` from `featureFlags.ts`
4. Unused files (`alex.excalidraw`, `openspec/plans/add-user-session-metrics.md`) are removed
5. All existing tests pass
6. Application behavior is identical before and after refactor
