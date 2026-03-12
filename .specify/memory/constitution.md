<!--
Sync Impact Report - Constitution v1.3.0 Amendment
===================================================
Version Change: 1.2.0 → 1.3.0 (MINOR - principle reordering)
Amendment Date: 2026-03-06

Modified Principles:
  - III. Real-Time Subscription Model (was IV) - elevated priority
  - IV. Spec-Driven Development (was III)

Rationale:
  - Real-time subscriptions are core to SpacetimeDB architecture
  - Subscription model should be adjacent to SpacetimeDB-First principle
  - Spec-driven development remains important but is a process principle

Templates Requiring Updates:
  ✅ plan.md Constitution Check section updated
  ✅ research.md to be updated with clarity guidance

Follow-up TODOs:
  - None
-->

# Alexxed Constitution

## Core Principles

### I. SpacetimeDB-First Architecture

All data persistence and real-time synchronization MUST use SpacetimeDB's deterministic model.

- Backend tables are the single source of truth; no external databases
- Reducers are transactional and MUST be deterministic (no filesystem, network, timers, or random)
- Data mutations ONLY through reducers; client-side logic is read-only via subscriptions
- Feature implementation follows: define tables → define reducers → subscribe → call reducers → render

**Rationale**: SpacetimeDB's deterministic architecture ensures data consistency, automatic real-time
synchronization, and eliminates entire classes of race conditions and state management bugs.

### II. Code Clarity & Abstraction

Code MUST be clean, readable, and as concise as reasonably possible.

- Prioritize readability over cleverness; code is read more often than written
- Performance optimizations MUST be abstracted behind well-named functions or modules
- Complex logic MUST be encapsulated; callers should not need to understand internals
- Minimize lines of code, but not at the expense of clarity
- Avoid deep nesting; prefer early returns and guard clauses
- Function names MUST clearly describe what they do (verbs for actions, nouns for data)
- Avoid magic numbers and strings; use named constants

**Anti-patterns to avoid**:
- Inline complex operations that could be a named function
- Performance hacks scattered throughout codebase (encapsulate in utility modules)
- Copy-paste code (extract to shared functions)
- Long functions doing multiple things (single responsibility)
- Cryptic variable names (be descriptive)

**Rationale**: Clean code reduces cognitive load, makes bugs obvious, enables faster onboarding,
and reduces maintenance burden. Abstraction allows optimization without polluting business logic.

### III. Real-Time Subscription Model

Data flow MUST be subscription-based; avoid imperative queries and REST-style pagination.

- Client subscribes to tables/views; SpacetimeDB pushes changes automatically
- Use `useTable()` hook for reactive data access in React components
- Optimistic updates discouraged; let subscriptions drive state
- Backend views for filtered data visibility (preferred over Row Level Security)

**Rationale**: Subscription-based architecture eliminates polling, reduces network overhead,
and ensures UI consistency with backend state without manual synchronization logic.

### IV. Spec-Driven Development (NON-NEGOTIABLE)

All features MUST follow a spec-driven workflow before implementation begins; specifications MUST be committed to source control.

- **Framework-Agnostic**: Any spec framework is acceptable (OpenSpec, RFC documents, ADRs, etc.)
- **Core Requirements**:
  - Specifications generated BEFORE code implementation
  - Specs committed to source control (Git)
  - User scenarios with clear acceptance criteria
  - Each user story MUST be independently testable and deliverable
- **Recommended Pattern** (currently used): OpenSpec workflow
  - Propose → Specify → Design → Implement → Archive
  - Active changes: `openspec/changes/`; source of truth: `openspec/specs/`
  - Given/When/Then scenarios with priority levels (P1, P2, P3)
  - Tasks organized by user story for incremental delivery

**Rationale**: Spec-driven development ensures alignment between stakeholders and implementers,
reduces rework, and provides clear acceptance criteria before code is written. Framework flexibility
allows teams to choose tools that best fit their workflow while maintaining the core discipline.

### V. Type Safety & Code Generation

Generated bindings are the contract between backend and frontend; manual edits are prohibited.

- SpacetimeDB schema generates TypeScript bindings via `spacetime generate`
- Regenerate bindings after ANY schema change (tables, reducers, types)
- Reducer calls MUST use object syntax: `conn.reducers.doSomething({ param: value })`
- BigInt literals required for u64/i64 fields: `0n`, `1n`, NOT `0`, `1`
- Index names use EXACT snake_case from schema definition (not transformed)

**Rationale**: Code generation eliminates type mismatches, ensures API contract adherence,
and catches breaking changes at compile time rather than runtime.


### VI. Testing & Quality Standards

All changes MUST include appropriate tests unless explicitly exempted.

- Integration tests required for: new features, state mutations, multi-component flows
- Unit tests required for: complex business logic, utilities, data transformations
- Tests run via `pnpm test` (Vitest); must pass before merge
- No new ESLint warnings; code formatted with Prettier
- No TODOs without linked issue/ticket

**Rationale**: Comprehensive testing prevents regressions, documents intended behavior,
and enables confident refactoring.

### VII. Secret & Sensitive Value Protection (CRITICAL)

All secret or sensitive values (e.g., API keys, client secrets, authorization tokens, passwords, etc.) in this repository MUST only reside in files that are included in the `.gitignore`.

- No secrets or sensitive credentials may be committed to version control under any circumstances
- All configuration, environment, or secret files containing such values MUST be listed in `.gitignore`
- Automated and manual reviews MUST check for accidental inclusion of secrets in tracked files

**Rationale**: Protecting secrets and sensitive values is essential to prevent credential leaks, unauthorized access, and security breaches. This requirement is non-negotiable and applies to all contributors and automation.

## Technology Stack

**Mandated Technologies**:

- **Backend**: SpacetimeDB (TypeScript server module)
  - Tables for persistence; reducers for mutations
  - Views for filtered data; procedures for side effects (HTTP, etc.)
- **Frontend**: React 18+ with TypeScript, Vite for bundling
  - `spacetimedb/react` for SpacetimeDB integration
  - React Router for navigation
- **Testing**: Vitest with React Testing Library
- **Code Quality**: ESLint + Prettier (pre-configured)

**Conventions**:

- Follow `AGENTS.md` / `CLAUDE.md` for SpacetimeDB-specific rules
- CSS custom properties for theming (green/black theme)
- Feature flags for toggleable features (`config/featureFlags.ts`)
- Environmental configuration via `.env` (never commit secrets)

**Prohibited**:

- External databases or ORMs (use SpacetimeDB tables)
- REST endpoints (use SpacetimeDB reducers)
- Manual WebSocket management (SpacetimeDB handles this)
- Positional reducer arguments (use object syntax)

## Development Workflow

**Change Lifecycle**:

1. **Propose**: Use `/opsx:propose` to create change folder with proposal, specs, design, tasks
2. **Implement**: Work through tasks.md checklist; mark progress with `[x]`
3. **Publish**: For backend changes, run `spacetime publish` then `spacetime generate`
4. **Test**: Run `pnpm test` to validate; fix any failures
5. **Archive**: Use `/opsx:archive` to move completed change to `openspec/changes/archive/`

**Backend Changes Require**:

1. Update schema in `spacetimedb/src/index.ts`
2. Publish module: `spacetime publish alexxed --clear-database -y --module-path spacetimedb`
3. Generate bindings: `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`
4. Update frontend to use new bindings

**Quality Gates**:

- All specs MUST reference `openspec/specs/constraints.md` for boundary checks
- Constitution compliance checked during planning phase (`plan.md` Constitution Check section)
- Breaking changes MUST be marked clearly in specs and communicated before implementation

## Governance

This constitution supersedes all other development practices and guidelines.

**Amendment Process**:

- Proposed amendments documented in GitHub issue or change proposal
- Requires rationale explaining why existing principle is insufficient
- Version bump follows semantic versioning:
  - MAJOR: Backward-incompatible governance changes, principle removals/redefinitions
  - MINOR: New principles added, materially expanded guidance
  - PATCH: Clarifications, wording fixes, non-semantic refinements
- Last Amended date updated with each change

**Compliance Review**:

- AI assistants MUST verify changes against constitution during planning
- Feature specifications MUST NOT violate constraints (verified in spec.md)
- Complexity th1t violates principles MUST be justified in `plan.md` Complexity Tracking section

**Runtime Guidance**:

- For detailed SpacetimeDB development rules, consult `AGENTS.md` and `CLAUDE.md`
- These files provide tactical implementation guidance within constitutional boundaries

**Version**: 1.2.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-06
