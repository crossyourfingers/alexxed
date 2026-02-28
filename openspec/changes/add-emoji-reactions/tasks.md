## 1. Backend - SpacetimeDB Schema

- [ ] 1.1 Add `message_reaction` table with columns: `message_sent` (timestamp), `user_identity` (identity), `emoji` (string)
- [ ] 1.2 Add BTree index `message_reaction_message_sent` on `message_sent` column
- [ ] 1.3 Create `toggle_reaction` reducer that adds/removes a reaction for a user+message+emoji combination
- [ ] 1.4 Publish module: `spacetime publish alexxed --module-path spacetimedb`

## 2. Backend - Generate Bindings

- [ ] 2.1 Generate client bindings: `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`

## 3. Frontend - Feature Flag

- [ ] 3.1 Add `ENABLE_EMOJI_REACTIONS` feature flag to config (default: true)

## 4. Frontend - Reaction Components

- [ ] 4.1 Create `ReactionPicker` component displaying emoji options: 👍 ❤️ 😂 😮 😢 🎉
- [ ] 4.2 Create `ReactionDisplay` component showing grouped reactions with counts
- [ ] 4.3 Add CSS styles for reaction picker and reaction badges

## 5. Frontend - Integration

- [ ] 5.1 Integrate reaction components into `MessageList.tsx`
- [ ] 5.2 Wire up `toggle_reaction` reducer calls from UI
- [ ] 5.3 Highlight user's own reactions in the display
- [ ] 5.4 Respect feature flag (hide reactions when disabled)

## 6. Testing

- [ ] 6.1 Test adding/removing reactions
- [ ] 6.2 Test reaction aggregation with multiple users
- [ ] 6.3 Test real-time updates across clients
