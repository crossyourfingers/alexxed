## Context

The application currently manages connection state through ephemeral local-only implementations in client components. System messages are created directly in hooks and never persisted, resulting in several architectural issues:

- Connection events invisible to other users during live sessions
- Inconsistent visual treatment across Community (green theme) and Stream pages
- UI spacing tokens and styles diverged between views
- Authentication logic having to infer connection state implicitly

The application is built on SpacetimeDB for backend state management (TypeScript server module) with React + TypeScript + Vite frontend. Real-time chat functionality relies on SpacetimeDB subscriptions, tables include `user`, `message`, and `message_like`, and all data mutations are handled through reducers for transaction safety.

## Goals / Non-Goals

**Goals:**

- Persist connection/disconnect events as dedicated system messages in SpacetimeDB
- Enable all users to see connection status through unified message feed
- Achieve visual consistency across Community and Stream pages with harmonized styling
- Provide proper `Identity.zero()` sender attribution for system events
- Add UX enhancements: timestamps, badges, animations, improved hit areas
- Implement dark/light mode compatibility through design token system

**Non-Goals:**

- Changes to existing user-facing chat functionality or messaging API
- Real-time file attachments or media sharing
- Redesigning authentication flow or OAuth provider integration
- Implementing advanced message threading or conversation threading
- Moving away from CSS custom properties for theming

## Decisions

### Use dedicated `system_message` table with `Identity.zero()` sender

**Rationale:** Separates system events from user-generated content with clear sender attribution. Matches SpacetimeDB patterns and follows the identity-based data organization model used throughout the codebase. Avoids conflating system messages with regular chat messages, making query optimization and subscription filtering straightforward.

**Alternatives considered:**

- Add `isSystem` flag to existing `message` table
- Use a separate server-side event store separate from user-facing data
- Keep ephemeral state but persist summaries

**Selected:** Dedicated table with typed `messageType` field for extensibility and cleaner data organization.

### Use reducer for message insertion with `sender: Identity.zero()`

**Rationale:** Reducers are transactional and deterministic, suitable for structured message insertion. Using `Identity.zero()` provides the proper server-side sender attribution while keeping message creation decoupled from client authentication state.

**Alternatives considered:**

- Insert directly in lifecycle hook with implicit sender
- Use procedures for message insertion
- Store system events in a separate administrative table

**Selected:** Reducer pattern ensures data integrity and follows SpacetimeDB conventions, matching the user message insertion pattern.

### Use index-based views for subscription filtering

**Rationale:** Index lookups (.by_owner.filter()) are efficient and provide proper invalidation semantics, avoiding the performance issues of full-table iteration (.iter()) during subscription updates.

**Alternatives considered:**

- Full-table iteration with manual filtering
- Procedural views with complex filtering logic
- SQL query views with WHERE clauses

**Selected:** Index-based view pattern ensures good performance at scale while maintaining subscription reactivity.

### Migrate to canonical `--space-*` tokens with backward compatibility shim

**Rationale:** Provides immediate visual parity through token aliases while enabling gradual CSS migration. Allows existing style references to continue working while new styles use the unified token system.

**Alternatives considered:**

- Immediate full CSS rewrite to token system
- Keep current spacing values and accept inconsistency
- Use Tailwind CSS utilities

**Selected:** Compatibility shim reduces migration risk and provides a clear migration path for incremental CSS updates.

### Implement system message rendering with separate markup

**Rationale:** System messages need visual distinction from user messages (centered display, muted styling, typography differences) while maintaining clear hierarchy. This enhances user experience without interfering with chat flow.

**Alternatives considered:**

- Embed system messages inline within regular message flow
- Use separate system message panel
- Don't distinguish visually (revert to plain chat text)

**Selected:** Specialized system message display with consistent typography and spacing throughout the application.

## Risks / Trade-offs

[Risk: Timestamp handling on SpacetimeDB] → **Mitigation:** Use `ctx.timestamp` for server-side insertion and proper serialization of BigInt microsecond timestamps in client, with timezone conversion in React components using `DateTime` utilities.

[Risk: Subscription performance with many system messages] → **Mitigation:** Use indexed views (.by_owner.filter()) instead of full-table iteration, implement message type filtering in subscription queries, and consider batching insertions for concurrent connections.

[Risk: Dark mode CSS token implementation] → **Mitigation:** Define explicit theme tokens for both light and dark modes in theme.css, use CSS custom properties with fallback values, test across browser engines, and implement CSS media query-based theme switching.

[Risk: Migration breaking existing styles] → **Mitigation:** Maintain backward compatibility shim (--spacing-_ → --space-_), use feature flag for gradual rollout, create comprehensive tests, maintain working rollback plan.

[Risk: UI consistency across multiple pages/views] → **Mitigation:** Centralize spacing token definitions, implement design system documentation, conduct visual QA across all affected components, use CSS preprocessor variables if applicable.

[Risk: State synchronization between client and server] → **Mitigation:** Ensure reducer calls are made synchronously in components, use React state as temporary visual layer before subscription reactivity updates display, validate reducer output to confirm message persistence.

## Migration Plan

1. **Backend deployment:**
   - Create and publish spacetimedb module with new table and reducer
   - Verify schema and reducer behavior with initial client tests
   - Rollback plan: revert to previous module version if issues arise

2. **Client bindings regeneration:**
   - Run `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`
   - Verify generated types match new schema structure
   - Update component imports to use new module bindings

3. **Client implementation:**
   - Update `useOnlineUsers` hook to call server reducer
   - Modify CommunityPage and StreamPage subscription patterns
   - Refactor MessageList rendering logic

4. **Styling migration:**
   - Add compatibility token aliases
   - Implement theme token system
   - Verify dark/light mode behavior
   - Conduct visual consistency tests

5. **Rollback strategy:**
   - Keep previous CSS file backups
   - Use branch-based implementation (feature branch with integration tests)
   - Deploy to staging environment first for validation
   - Feature flag toggle for gradual production rollout
