## 1. Server Implementation

- [ ] 1.1 Add `system_message` table to SpacetimeDB schema with columns: `id` (primary key, autoInc), `messageType` (text), `channelId` (u64), `sender` (identity), `createdAt` (timestamp), and optional `content` (text for future extensibility)
- [ ] 1.2 Add index on `channelId` for efficient system message querying (name: `system_message_channel_id`)
- [ ] 1.3 Define `insert_system_message` reducer with parameters for `messageType`, `channelId`, and optional `content`
- [ ] 1.4 Implement `insert_system_message` reducer logic to insert row with `sender: Identity.zero()` using `ctx.timestamp`
- [ ] 1.5 Add lifecycle hook `clientConnected` to automatically call `insert_system_message` with `messageType: 'connect'` on connection
- [ ] 1.6 Add lifecycle hook `clientDisconnected` to automatically call `insert_system_message` with `messageType: 'disconnect'` on disconnection
- [ ] 1.7 Export table reducer and lifecycle hooks in `spacetimedb/src/index.ts`
- [ ] 1.8 Test reducer with proper Big.Int handling (`0n` placeholder for auto-increment)

## 2. Client Bindings

- [ ] 2.1 Verify `spacetimedb` module structure and dependencies in `spacetimedb/package.json`
- [ ] 2.2 Install SpacetimeDB dependencies if not present

## 3. Frontend - System Messages Hook

- [ ] 3.1 Update `src/hooks/useOnlineUsers.ts` to call `conn.reducers.insertSystemMessage` instead of local-only message creation
- [ ] 3.2 Replace ephemeral connect/disconnect state management with subscription to `system_message` table
- [ ] 3.3 Add `useEffect` subscription to `system_message` table for real-time updates
- [ ] 3.4 Ensure reducer calls use object syntax: `conn.reducers.insertSystemMessage({ ... })`

## 4. Frontend - Subscription and Rendering

- [ ] 4.1 Update `src/pages/CommunityPage.tsx` to subscribe to `system_message` rows
- [ ] 4.2 Update `src/pages/StreamPage.tsx` to subscribe to `system_message` rows
- [ ] 4.3 Modify chat feed rendering to merge system messages with user messages (maintain chronological order)
- [ ] 4.4 Create new `SystemMessage` component for dedicated system message rendering

## 5. Frontend - Message List Enhancements

- [ ] 5.1 Update `src/components/Chat/MessageList.tsx` to accept system messages as separate entity
- [ ] 5.2 Implement system message rendering: centered, inline-muted styling, smaller badge, optional timestamp
- [ ] 5.3 Add message type filtering logic to distinguish system messages from user messages
- [ ] 5.4 Implement visual grouping for consecutive system messages if needed

## 6. Styling - Theme Tokens

- [ ] 6.1 Add compatibility token aliases in `src/styles/theme.css`: `--spacing-*` → `--space-*` for backward compatibility
- [ ] 6.2 Define canonical spacing token system in `--space-*` format in `src/styles/theme.css`
- [ ] 6.3 Define light mode token values for spacing, typography, and colors
- [ ] 6.4 Define dark mode token values for spacing, typography, and colors
- [ ] 6.5 Add token fallback values for devices with limited theme support

## 7. Styling - Component CSS Updates

- [ ] 7.1 Migrate `src/pages/CommunityPage.css` to use canonical `--space-*` tokens
- [ ] 7.2 Update Community page header and navigation padding/gaps to match Stream measurements
- [ ] 7.3 Migrate `src/components/Chat/Chat.css` to use canonical `--space-*` tokens
- [ ] 7.4 Add `.chat-message.system` class with muted text, smaller badge, and centered display
- [ ] 7.5 Add hover states for interactive community header items
- [ ] 7.6 Expand hit areas for clickable community elements (increase padding)

## 8. Styling - Animations and UX

- [ ] 8.1 Add subtle transition animations for message appearance
- [ ] 8.2 Implement enter/exit animations for system message display
- [ ] 8.3 Add hover state effects for community header navigation items
- [ ] 8.4 Test dark mode rendering for all new CSS classes

## 9. Verification and Testing

- [ ] 9.1 Run `spacetime start` to start local SpacetimeDB server
- [ ] 9.2 Run `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb` to regenerate client bindings
- [ ] 9.3 Start dev server: `npm run dev`
- [ ] 9.4 Test user connection: Verify system message appears with correct `sender: Identity.zero()`
- [ ] 9.5 Test user disconnection: Verify system message appears with `messageType: 'disconnect'`
- [ ] 9.6 Verify connectivity across multiple clients: All users should see system messages
- [ ] 9.7 Check system message styling: Centered, muted text, smaller badge on both Community and Stream pages
- [ ] 9.8 Verify spacing consistency: Check Community and Stream page padding/gaps match
- [ ] 9.9 Test interactive element hit areas: Ensure expanded click regions work well
- [ ] 9.10 Verify dark mode: Check tokens render correctly in dark theme

## 10. Documentation

- [ ] 10.1 Document new `system_message` table schema and usage in project README
- [ ] 10.2 Update `useOnlineUsers` hook documentation with system message behavior
- [ ] 10.3 Add inline code comments documenting reducer and lifecycle hook usage
- [ ] 10.4 Create manual QA checklist from verification steps for future reference
