# Research: Alexxed Chat Platform - Level Set

**Date**: 2026-03-06  
**Status**: Complete

## Research Questions Resolved

### 1. SpacetimeDB TypeScript Best Practices

**Decision**: Follow patterns in `AGENTS.md` / SpacetimeDB TypeScript SDK documentation

**Rationale**: The codebase already follows these patterns:
- Tables defined with `table()` function, indexes in OPTIONS (first arg)
- Reducers use `spacetimedb.reducer()` with object params
- Views for filtered data (user sessions use private table + ctx.sender filtering)
- BigInt for u64 fields (`0n`, `1n` literals)
- Object syntax for reducer calls: `conn.reducers.foo({ param: value })`

**Alternatives considered**:
- Custom ORM layer → Rejected: SpacetimeDB provides sufficient abstraction
- REST API bridge → Rejected: Violates constitution (SpacetimeDB-first)

### 2. OIDC Integration with SpacetimeDB

**Decision**: Use `oidc-client-ts` + `react-oidc-context` with SpacetimeAuth authority

**Rationale**: 
- SpacetimeAuth provides OIDC-compliant endpoints at `auth.spacetimedb.com`
- Token passed to `DbConnection.builder().withToken()` for authenticated connections
- User claims (sub, preferred_username, email) extracted from OIDC user profile

**Alternatives considered**:
- Custom auth flow → Rejected: SpacetimeAuth already provides battle-tested OIDC
- Anonymous-only → Rejected: Doesn't meet auth requirements

### 3. Real-Time Message Delivery Architecture

**Decision**: SpacetimeDB subscriptions with `useTable()` hook

**Rationale**:
- Messages broadcast automatically via SpacetimeDB subscription model
- No manual WebSocket management needed
- `onInsert` callbacks for local notifications (system messages)
- Message table has `message_channel_id` index for efficient filtering

**Alternatives considered**:
- Polling → Rejected: Violates constitution (Real-Time Subscriptions)
- Server-Sent Events → Rejected: SpacetimeDB already handles this

### 4. CSS Theming Strategy

**Decision**: CSS custom properties in `theme.css` with semantic tokens

**Rationale**:
- Pure CSS solution (no JavaScript for theme rendering)
- Semantic tokens (`--color-text-primary`, `--color-bg-base`) abstract primitives
- `data-theme="green"` and `data-mode="dark"` attributes for theme switching
- Spacing tokens `--space-1` through `--space-12` for consistency

**Alternatives considered**:
- CSS-in-JS (styled-components) → Rejected: Adds runtime overhead, harder to audit
- Tailwind CSS → Rejected: Existing CSS custom property system is sufficient
- Theme context in React → Rejected: CSS handles this without JS

### 5. Session Tracking Architecture

**Decision**: Private `user_session` table with scheduled cleanup reducer

**Rationale**:
- `user_session` table stores sessionId, userId, connectedAt, disconnectedAt
- Index on `user_identity` for efficient per-user queries
- View with `ctx.sender` restricts access to own sessions only
- Scheduled reducer for 7-day cleanup (per clarification)

**Alternatives considered**:
- Store in localStorage only → Rejected: Can't track across devices
- Public session data → Rejected: Privacy concern

### 6. System Message Architecture

**Decision**: Separate `system_message` table with `Identity.zero()` sender

**Rationale**:
- Clean separation from user messages
- `message_type` field ('connect', 'disconnect') for extensibility
- Index on `channel_id` for efficient per-channel queries
- All clients receive system messages via public subscription

**Alternatives considered**:
- Flags on message table → Rejected: Pollutes user message queries
- Client-side only → Rejected: Doesn't persist, other users can't see

### 7. Feature Flag Architecture

**Decision**: TypeScript constants in `config/featureFlags.ts`

**Rationale**:
- Simple boolean flags: `ENABLE_MESSAGE_LIKES`, `ENABLE_EMOJI_REACTIONS`
- Compile-time optimization (dead code elimination with tree shaking)
- Easy to change without server redeployment

**Alternatives considered**:
- Environment variables → Considered for production flexibility
- Remote config service → Overkill for current scale

### 8. Code Clarity & Abstraction Patterns

**Decision**: Follow Constitution Principle II - abstract complexity behind well-named functions/modules

**Rationale**:
- Custom hooks (`useOnlineUsers`, `useChatMessages`, `useChannelByName`) encapsulate subscription logic
- Reducers have single responsibility; validation extracted to helper functions (`validateName`, `validateMessage`)
- Performance-sensitive operations isolated in utility functions
- Component files remain focused on rendering; business logic in hooks

**Patterns to follow**:
- Complex SpacetimeDB queries → wrap in custom hooks
- Repeated validation logic → extract to named functions
- Timestamp/formatting operations → utility functions in `utils/`
- Feature-specific components → colocate in feature folders (e.g., `components/Chat/`)

**Anti-patterns observed in codebase** (to address):
- `simpleHash()` function in reducer file → should note as demo-only or extract to auth utility
- Some inline conditional rendering could be extracted to sub-components

## Technology Decisions Summary

| Decision | Choice | Confidence |
|----------|--------|------------|
| Backend | SpacetimeDB TypeScript SDK | High |
| Frontend | React 18 + Vite | High |
| Auth | SpacetimeAuth (OIDC) | High |
| Styling | CSS custom properties | High |
| Testing | Vitest + RTL | High |
| State | SpacetimeDB subscriptions | High |
| Bundler | Vite (static output) | High |
| Abstraction | Custom hooks + utility functions | High |

## Open Items for Implementation

1. **Testing Coverage**: Constitution gap requires adding tests for:
   - Reducer integration tests
   - Hook unit tests
   - Component integration tests

2. **Message Length Validation**: Need to add 2000 char limit (FR-B08, FR-B09)

3. **Offline User Filtering**: Need to filter offline list to 7-day active users (FR-F10)

4. **Session Cleanup Scheduler**: Implement 7-day cleanup reducer (FR-F08)

5. **Code Clarity Improvements** (Principle II):
   - Review inline logic that could be extracted to named functions
   - Ensure all complex operations are properly abstracted
   - Add utility module for common operations (formatting, validation)
