# Project Constitution

This file encodes the core programming and workflow principles for the Alexxed project. It is intended as a domain knowledge reference for LLMs and agents.

## Core Principles

### 1. SpacetimeDB-First Architecture
- All data persistence and real-time sync use SpacetimeDB's deterministic model.
- Backend tables are the single source of truth; no external DBs.
- Reducers are transactional and deterministic (no filesystem, network, timers, or random).
- Data mutations only via reducers; client logic is read-only via subscriptions.
- Feature implementation: define tables → reducers → subscribe → call reducers → render.

### 2. Code Clarity & Abstraction
- Code must be clean, readable, and concise.
- Prioritize readability over cleverness.
- Abstract performance optimizations behind well-named functions/modules.
- Encapsulate complex logic; minimize deep nesting.
- Use descriptive names and constants.

### 3. Real-Time Subscription Model
- Data flow is subscription-based; avoid imperative queries and REST-style pagination.
- Client subscribes to tables/views; SpacetimeDB pushes changes.
- Use `useTable()` for reactive data in React.
- Let subscriptions drive state; avoid optimistic updates.
- Use backend views for filtered data.

### 4. Spec-Driven Development (Non-Negotiable)
- All features require a committed specification before implementation.
- Any spec framework is allowed; specs must be in source control.
- User stories must be testable and deliverable.
- Recommended: Spec-driven workflow (propose → specify → design → implement → archive).

### 5. Type Safety & Code Generation
- Generated bindings are the contract between backend and frontend; never edit manually.
- Regenerate bindings after schema changes.
- Reducer calls use object syntax.
- Use BigInt literals for u64/i64 fields.
- Index names use exact snake_case from schema.

### 6. Testing & Quality Standards
- All changes must include appropriate tests unless exempted.
- Integration tests for features/state mutations; unit tests for logic/utilities.
- Tests must pass before merge; code must be linted and formatted.
- No TODOs without linked issues.

### 7. Secret & Sensitive Value Protection (Critical)
- No secrets/credentials in version control; all such files must be in .gitignore.
- Agents must never read .env or similar files; use .env.example or *.public.secrets only.

## Technology Stack
- Backend: SpacetimeDB (TypeScript)
- Frontend: React 18+ (TypeScript, Vite)
- Testing: Vitest
- Code Quality: ESLint + Prettier

## Governance & Workflow
- This constitution supersedes all other guidelines.
- Amendments require rationale and semantic versioning.
- AI assistants must verify changes against the constitution during planning.
- For SpacetimeDB rules, see [AGENTS.md](../AGENTS.md).

---


## Gaps & Open Questions

This section tracks known compliance gaps, maintainability issues, and open questions identified in the project. For full details, see [Constitution Gaps](constitution-gaps.md) and [Devstral Gaps](devstral-gaps.md).

### Constitution Compliance Gaps (as of 2026-03-06)

- **Partial Compliance:**
	- Strong: SpacetimeDB-first architecture, type safety, real-time subscriptions
	- Needs Improvement: Test coverage, spec completeness, security implementation
	- Critical Gaps: Authentication security, incomplete test coverage

#### Principle II: Spec-Driven Development
- Link Preview feature implemented without a prior spec
- Channel management spec coverage unclear
- User session analytics: archived spec may be incomplete

#### Principle V: Testing & Quality Standards
- Insufficient test coverage:
	- Few reducer/component/integration tests
	- No tests for some critical flows (auth, channel management, system messages, link preview, views, procedures)

### Maintainability & Architecture Gaps
- Duplicated message display logic between App.tsx and StreamPage.tsx
- Inconsistent use of reusable components (MessageList, MessageInput)
- Mixed concerns in root components (state, data, UI)
- Hardcoded channel logic (e.g., general channel lookup)
- Fragmented authentication implementation

**Recommendations:**
- Create shared hooks for message formatting, channel lookup, user identity, and online status
- Standardize on reusable components for message display/input
- Separate presentation and container components
- Centralize feature flags and shared state

**See also:** devstral-gaps.md

---

**Related:** [index.md](index.md) | [features.md](features.md) | [business_rules.md](business_rules.md)
