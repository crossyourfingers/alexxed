## Why

Current connect/disconnect events are handled as ephemeral local state in the client, making them invisible to other users and not persisted in the database. This causes several issues: users can't see connection status in the chat feed, system messages look inconsistent across Community and Stream views, authentication logic needs to know about implicit connection state, and styling is out of sync between Community (green theme) and Stream pages.

## What Changes

- Add a new `system_message` table to SpacetimeDB to persist connect/disconnect events with `Identity.zero()` sender attribution
- Create `insert_system_message` reducer to handle message insertion with proper `sender` field
- Refactor client to subscribe to persisted `system_message` rows and merge them into chat feeds
- Update message rendering to treat system messages as a separate entity with dedicated markup
- Harmonize spacing tokens and CSS styles across Community and Stream pages for visual consistency
- Add UX enhancements: timestamps, badges, hover states, animations, and improved hit areas
- Implement design token system for dark/light mode compatibility

## Capabilities

### New Capabilities

- `system-messages`: Persistent system-level messages showing connection status and events
- `ui-consistency`: Unified styling and spacing across Community and Stream pages

### Modified Capabilities

- `message-rendering`: Extended to support system message entities with special markup
- `chat-communication`: Connection events now visible to all users through unified message feed

## Impact

**Backend:**

- New `system_message` table with indexes for efficient querying
- `insert_system_message` reducer with transaction safety
- Lifecycle hooks for automatic system message creation on connect/disconnect

**Frontend:**

- Updated `useOnlineUsers` hook to use server-side system messages
- Subscription updates in CommunityPage and StreamPage components
- MessageList component enhanced for system message rendering
- CSS theme token refactoring for consistent spacing and dark mode

**Database:**

- Persisted connection state visible to all clients
- Separation of system events from user chat messages
- Indexed access for efficient subscription filtering

**User Experience:**

- Consistent visual treatment of connection events across pages
- Clear visual hierarchy between system and user messages
- Improved accessibility with better hit areas and contrast ratios
