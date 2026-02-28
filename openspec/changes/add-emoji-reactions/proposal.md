## Why

The current system only supports binary likes on messages. Users often want to express a wider range of reactions (👍 ❤️ 😂 😮 😢 🎉) without having to type a reply. Emoji reactions are a standard Discord/Slack feature that increases engagement and provides lightweight feedback.

## What Changes

- Add emoji reaction system allowing multiple reaction types per message
- Users can add/remove any emoji reaction to any message (including their own)
- Display reaction counts grouped by emoji under each message
- Multiple users can add the same reaction (count shown)
- User can click existing reaction to add their vote or remove it

## Capabilities

### New Capabilities
- `emoji-reactions`: Multi-emoji reaction system for messages. Users can react with various emojis, see aggregated counts, and toggle their own reactions.

### Modified Capabilities
<!-- No existing spec requirements are changing. The like feature remains separate. -->

## Impact

- **Backend (SpacetimeDB)**:
  - New `message_reaction` table: `message_sent` (timestamp), `user_identity`, `emoji` (string)
  - New `toggle_reaction` reducer
  - Index on `message_sent` for efficient querying
  
- **Frontend (React)**:
  - Reaction picker UI component (emoji selector)
  - Reaction display under messages (grouped counts)
  - Integration with existing MessageList component

- **No breaking changes** - this adds new functionality alongside existing likes
