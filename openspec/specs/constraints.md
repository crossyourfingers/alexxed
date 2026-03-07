# Engineering Constraints (do not violate)

> **See also**: [Project Constitution](../../.specify/memory/constitution.md) for governing principles

## Commands
- Build: `pnpm build` (TypeScript compilation + Vite build)
- Test: `pnpm test` (Vitest)
- Lint/format: `pnpm lint` (ESLint + Prettier check), `pnpm format` (Prettier write)
- Backend publish: `spacetime publish alexxed --clear-database -y --module-path spacetimedb`
- Generate bindings: `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`

## Boundaries
- **Do not modify**: 
  - `src/module_bindings/` (auto-generated from SpacetimeDB schema)
  - SpacetimeDB core concepts (reducers must be deterministic, no network/filesystem)
- **Must keep**: 
  - Type safety (all u64/i64 as BigInt, object syntax for reducer calls)
  - SpacetimeDB subscription model (no imperative queries)
  - Constitution compliance (`.specify/memory/constitution.md`)

## Quality bar
- All changes must include tests unless explicitly exempted (Constitution Principle V)
- No TODOs without linked GitHub issue
- No new ESLint warnings
- Backend changes MUST regenerate bindings before frontend changes
- Constitution principles MUST be verified during planning phase

## Technology Stack (Constitutional)
- **Backend**: SpacetimeDB TypeScript module only (no external databases)
- **Frontend**: React 18+ with TypeScript
- **Testing**: Vitest with React Testing Library
- Follow `AGENTS.md` and `CLAUDE.md` for SpacetimeDB-specific rules

# Sample Prompt
```
Read openspec/specs/[feature]/spec.md and openspec/specs/constraints.md.
Verify compliance with .specify/memory/constitution.md.
Propose a step-by-step plan that maps to each acceptance criterion.
Then implement only step 1.
Write/adjust tests for step 1.
Stop and summarize what changed and what to do next.
```