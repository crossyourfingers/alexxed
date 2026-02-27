# Feature: Message Likes

## Goal
- Allow users to "like" messages sent in the chat.
- Display the count of likes for each message.
- Ensure that each user can like a specific message only once (or toggle it).

## Non-goals
- Different types of reactions (e.g., emojis other than a "like").
- List of users who liked a message (only count is required for now).
- Notifications for likes.

## Constraints
- Tech stack: SpacetimeDB (TypeScript), React, Vite.
- Must follow existing patterns in `spacetimedb/src/index.ts` and `src/App.tsx`.
- Real-time updates via SpacetimeDB subscriptions.

## Acceptance Criteria
1. Users can click a "Like" button/icon on any message.
2. The number of likes for each message is displayed next to the message.
3. A user can toggle their like (like/unlike).
4. The like count updates in real-time for all connected users.
5. Users cannot like their own messages (optional, to be decided, but let's assume they can for simplicity unless specified otherwise). For now, let's allow it but restrict one like per user per message.

## Design Notes
- **DB Schema Changes**:
    - Add a `message_like` table to track which user liked which message.
    ```typescript
    const message_like = table(
      { name: 'message_like', public: true },
      {
        message_id: t.timestamp(), // Using 'sent' as a simple ID for now, or we might need a proper ID
        user_identity: t.identity(),
      }
    );
    ```
    - *Note*: The `message` table currently uses `sent: t.timestamp()` which might not be unique if two messages are sent at the exact same millisecond. However, for a quickstart, it's often used as a key. A better approach would be adding a primary key to `message`.
- **Reducers**:
    - `toggle_like(message_sent: t.timestamp())`: Adds or removes a row in `message_like`.

## Test Plan
- **Unit**:
    - Test `toggle_like` reducer logic (insert/delete).
- **Integration**:
    - Verify that clicking like in the UI triggers the reducer.
    - Verify that the UI updates when a `message_like` row is inserted/deleted.
- **Edge cases**:
    - Liking a non-existent message.
    - Rapidly clicking the like button.
