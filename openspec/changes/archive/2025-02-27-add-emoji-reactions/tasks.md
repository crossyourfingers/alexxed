## 1. Backend - SpacetimeDB Schema

- [x] 1.1 Add `message_reaction` table with columns: `message_sent` (timestamp), `user_identity` (identity), `emoji` (string)
- [x] 1.2 Add BTree index `message_reaction_message_sent` on `message_sent` column
- [x] 1.3 Create `toggle_reaction` reducer that adds/removes a reaction for a user+message+emoji combination
- [x] 1.4 Publish module: `spacetime publish alexxed --module-path spacetimedb`

## 2. Backend - Generate Bindings

- [x] 2.1 Generate client bindings: `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`

## 3. Frontend - Feature Flag

- [x] 3.1 Add `ENABLE_EMOJI_REACTIONS` feature flag to config (default: true)

## 4. Frontend - Reaction Components

- [x] 4.1 Create `ReactionPicker` component displaying emoji options: 👍 ❤️ 😂 😮 😢 🎉
- [x] 4.2 Create `ReactionDisplay` component showing grouped reactions with counts
- [x] 4.3 Add CSS styles for reaction picker and reaction badges

## 5. Frontend - Integration

- [x] 5.1 Integrate reaction components into `MessageList.tsx`
- [x] 5.2 Wire up `toggle_reaction` reducer calls from UI
- [x] 5.3 Highlight user's own reactions in the display
- [x] 5.4 Respect feature flag (hide reactions when disabled)

## 6. Testing

- [x] 6.1 Test adding/removing reactions
- [x] 6.2 Test reaction aggregation with multiple users
- [x] 6.3 Test real-time updates across clients
