## Context

The chat system currently supports a single reaction type: likes (❤️). The `message_like` table stores likes with `message_sent` timestamp and `user_identity`. Users can toggle likes on any message except their own.

Adding emoji reactions extends this model to support multiple emoji types per message, allowing richer user expression.

## Goals / Non-Goals

**Goals:**
- Allow users to react to messages with multiple emoji types
- Support multiple users reacting with the same emoji (aggregated count)
- Real-time updates for all connected clients
- Toggle behavior: clicking same reaction removes it

**Non-Goals:**
- Custom emoji upload (use fixed emoji set)
- Animated reactions
- Reaction limits per message
- Replacing the existing like system (keep both for now)

## Decisions

### Decision 1: Data Model - Separate Reaction Table

**Choice**: Create new `message_reaction` table separate from `message_like`

**Rationale**:
- Keeps existing like functionality unchanged (backwards compatible)
- Cleaner separation of concerns
- Allows independent feature toggles

**Alternatives considered**:
- Extend `message_like` with emoji column: Would require migration and changes to existing code
- Unified reaction table replacing likes: Breaking change, more complex migration

### Decision 2: Message Identification - Timestamp-Based

**Choice**: Use `message_sent` (timestamp) as message identifier, same as `message_like`

**Rationale**:
- Consistent with existing pattern
- Messages use timestamp as primary key
- No schema change needed for message table

### Decision 3: Emoji Storage - Unicode String

**Choice**: Store emoji as Unicode string (e.g., "👍", "❤️")

**Rationale**:
- Simple, no mapping needed
- Works directly in UI
- Future-proof for emoji additions

**Alternatives considered**:
- Enum of allowed emojis: Requires schema change to add new emojis
- Emoji codes/names: Requires mapping layer

### Decision 4: Index Strategy

**Choice**: BTree index on `message_sent` column for reaction queries

**Rationale**:
- All reactions for a message are queried together
- Efficient filtering by message timestamp

### Decision 5: Frontend Emoji Set

**Choice**: Fixed set of common reactions: 👍 ❤️ 😂 😮 😢 🎉

**Rationale**:
- Covers most use cases (positive, love, funny, surprised, sad, celebration)
- Consistent with Discord/Slack patterns
- Can expand later if needed

## Risks / Trade-offs

**[Risk]** Emoji rendering inconsistency across platforms  
→ Mitigation: Use common emojis supported on all modern systems

**[Risk]** Message timestamp collision (same user, same millisecond)  
→ Mitigation: SpacetimeDB timestamps are microsecond precision, collision extremely unlikely

**[Trade-off]** Keeping likes and reactions separate adds complexity  
→ Accepted: Simpler implementation, can unify later if needed
