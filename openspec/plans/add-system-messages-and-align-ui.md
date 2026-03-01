## Plan: System Messages and UI Alignment

TL;DR — Add a dedicated `system_message` table + server reducer to persist connect/disconnect events, refactor client to write/read this table, and harmonize spacing tokens/styles so Community UI matches Stream UX. This separates system messages from user chat, enables correct `Identity.zero()` sender attribution, and fixes inconsistent spacing.

**Implementation Steps**

1. **Server: add schema & reducer**
   - Add a `system_message` table with `sender`, `channelId`, `createdAt`, `messageType`
   - Define `insert_system_message` reducer that inserts rows with `sender: Identity.zero()` and the appropriate message type
   - Export the reducer in [spacetimedb/src/index.ts](spacetimedb/src/index.ts)

2. **Generate bindings**
   - Run Spacetime generator to update client bindings:

   ```bash
   spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
   ```

3. **Client: persist system events**
   - Replace local-only connect/disconnect message creation in [src/hooks/useOnlineUsers.ts](src/hooks/useOnlineUsers.ts) with calls to the new reducer
   - Use object syntax: `conn.reducers.insertSystemMessage({ channelId, messageType, text })`

4. **Client: subscribe & merge**
   - Subscribe to persisted `system_message` rows in [src/pages/CommunityPage.tsx](src/pages/CommunityPage.tsx) and [src/pages/StreamPage.tsx](src/pages/StreamPage.tsx)
   - Merge them into the chat feed instead of using ephemeral local state

5. **Message rendering**
   - Update [src/components/Chat/MessageList.tsx](src/components/Chat/MessageList.tsx) to treat `system_message` rows as a separate entity
   - Implement dedicated markup: centered/inline-muted line, optional badge, distinct typography
   - Improve hit areas and padding around clickable Community header items

6. **Style alignment (compat shim)**
   - Add `--spacing-*` → `--space-*` token aliases in [src/styles/theme.css](src/styles/theme.css)
   - This provides immediate visual parity with Stream layout without full CSS migration

7. **Refactor Community CSS**
   - Migrate [src/pages/CommunityPage.css](src/pages/CommunityPage.css) and [src/components/Chat/Chat.css] to use canonical `--space-*` tokens
   - Increase padding/gaps to match StreamPage.css measurements
   - Define clear visual boundaries: muted text, smaller badge, appropriate typography
   - Ensure consistency with dark/light mode themes

8. **UX enhancements**
   - Add contextual icons/badges to distinguish system message types (connect/disconnect/other)
   - Implement subtle animations when system messages appear
   - Improve hover states for clickable community elements
   - Ensure consistent spacing system throughout the UI
   - Add timestamps to system messages for temporal context
   - Consider grouping consecutive system messages to reduce visual clutter

9. **Verification**
   - Start dev server and Spacetime DB and regenerate bindings:
     ```bash
     spacetime start
     spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
     npm install
     npm run dev
     ```
   - Manual checks:
     - Connecting and disconnecting produces `system_message` rows visible in client and DB
     - Community header, navigation spacing, chat padding match Stream look-and-feel
     - System messages render separately with appropriate visual treatment
     - All interactive elements have adequate hit areas and hover states

**Design Considerations**

- Visual Hierarchy: Use a subtle background color or border for system messages alongside muted text
- Typography: Different font weight, size, or style for system messages vs user messages
- Color Palette: Define consistent colors for different system message types
- Accessibility: Ensure sufficient color contrast and keyboard navigation support
- Responsive Behavior: Verify styling adjustments work across screen sizes
- Component Reuse: Create reusable components for system messages

**Implementation Prioritization**

1. Commit server schema & reducer, run `spacetime generate`
2. Update `useOnlineUsers` to call server reducer and subscribe to `system_message`
3. Apply theme token shim for immediate visual parity
4. Migrate CSS to canonical tokens and implement full styling enhancements
5. Add verification steps and manual QA checklist

**Next Steps**

- Review this consolidated plan
- Execute implementation in order
- Test on both Community and Stream pages
- Verify dark/light mode compatibility
- Gather user feedback for iterative improvements
