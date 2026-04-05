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

This section tracks known compliance gaps, maintainability issues, and open questions identified in the project. This is the single source of truth for technical debt and security risks.

### 1. High-Priority Gaps (Critical)

#### Security: Authentication & Hashing
- **Issue:** The backend (`spacetimedb/src/index.ts`) currently uses a `simpleHash` function for passwords, explicitly labeled as "demo-grade."
- **Risk:** High. Insecure password storage.
- **Requirement:** Replace with production-grade hashing (e.g., bcrypt/Argon2 if supported, or SpacetimeDB's native identity patterns) and adopt a robust authentication model.

#### Testing: Insufficient Coverage
- **Issue:** Significant lack of automated tests for critical backend and frontend logic.
- **Missing Tests:**
	- Reducers, procedures, and views in SpacetimeDB.
	- Critical frontend flows: authentication, channel management, and system messages.
	- Integration tests for complex state mutations.
- **Requirement:** Expand test suite to cover all core paths and negative cases.

#### Architecture: Authentication Fragmentation
- **Issue:** Authentication logic (OIDC/auth) remains fragmented across multiple files and could benefit from a centralized approach or utilizing SpacetimeDB native auth patterns.

### 2. Maintainability & Technical Debt

#### Resolved Items (2026-04-04)
- [x] **Shared Hooks:** `useChatMessages()` and `useChannelByName()` are implemented and used.
- [x] **Consolidated UI:** Standardized `MessageList` and `MessageInput` components are in use.
- [x] **Message Formatting:** `PrettyMessage` type and logic centralized in `src/hooks/useChatMessages.ts`.

#### Outstanding Debt
- **Mixed Concerns:** Some root components still intermingle state management, data fetching, and UI.
- **Hardcoded Logic:** Scattered channel lookups (e.g., `channels.find(ch => ch.name === "general")`) should be replaced by the `useChannelByName()` hook where applicable.
- **Spec Gaps:** Some features (like Link Preview) were implemented without prior formal specifications.

### 3. Recommended Next Steps
- Create issues for critical security fixes and test coverage gaps.
- Standardize remaining components to separate presentation from container logic.
- Ensure every new feature has a concise spec in `domain_knowledge/` before implementation.

---

**Related:** [index.md](index.md) | [features.md](features.md) | [business_rules.md](business_rules.md)
