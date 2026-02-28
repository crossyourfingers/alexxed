## Plan: Separate System Messages & Align Community UI

TL;DR — Add a dedicated `system_message` table + server reducer so connect/disconnect events are persisted as their own entity, refactor the client to write/read that table, and harmonize spacing tokens/styles so the Community UI matches the Stream UX. This separates system messages from user chat, enables correct `Identity.zero()` sender attribution, and fixes inconsistent spacing caused by mismatched CSS tokens.

**Steps**
1. **Server: add schema & reducer** — Add a `system_message` table and an `insert_system_message` reducer that inserts rows with `sender: Identity.zero()` and `channelId`. Edit the server schema and exports (e.g. modify [spacetimedb/src/index.ts](spacetimedb/src/index.ts#L1)).
2. **Generate bindings** — Run the Spacetime generator to update client bindings so the new table and reducer are available to the client:

   ```bash
   spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
   ```

3. **Client: persist system events** — Replace local-only connect/disconnect message creation in [src/hooks/useOnlineUsers.ts](src/hooks/useOnlineUsers.ts#L1-L40) with calls to the new reducer (e.g. `conn.reducers.insertSystemMessage({ channelId, text })`).
4. **Client: subscribe & merge** — Subscribe to the persisted `system_message` rows and merge them into the chat feed in [src/pages/CommunityPage.tsx](src/pages/CommunityPage.tsx#L60-L88) and [src/pages/StreamPage.tsx](src/pages/StreamPage.tsx#L60-L84) instead of using ephemeral local state.
5. **Message rendering** — Update [src/components/Chat/MessageList.tsx](src/components/Chat/MessageList.tsx#L120-L160) to treat `system_message` rows as a separate entity with dedicated markup (e.g. centered/inline-muted line, optional badge). Keep user messages unchanged but consider grouping consecutive messages or date separators for readability.
6. **Style alignment (compat shim)** — Add `--spacing-*` → `--space-*` token aliases in [src/styles/theme.css](src/styles/theme.css#L1-L20) so existing `Chat.css`/`CommunityPage.css` spacings immediately align with the Stream layout.
7. **Refactor Community CSS** — Migrate `src/pages/CommunityPage.css` and `src/components/Chat/Chat.css` to use canonical `--space-*` tokens and increase padding/gaps to match [src/pages/StreamPage.css](src/pages/StreamPage.css#L1-L18) measurements.
8. **UX polish** — Adjust `.chat-message.system` in [src/components/Chat/Chat.css](src/components/Chat/Chat.css#L18-L24) to be visually subdued (muted text, smaller badge) and expand hit areas / padding around clickable Community header items to reduce cramping.
9. **Docs & verification** — Document the new table and reducer in the repo, and add verification steps (manual QA checklist and optional integration test that simulates a connection and asserts a `system_message` is created).

**Verification**
- Start dev server and Spacetime DB and regenerate bindings:

```bash
spacetime start
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
npm install
npm run dev
```

- Manual checks:
  - Connecting and disconnecting produces `system_message` rows visible in the client and in the DB.
  - Community header, navigation spacing, and chat padding match the Stream look-and-feel.
  - System messages render separately and are visually less prominent than user messages.

**Decisions**
- Chosen approach: Add a dedicated `system_message` table + server reducer (clean separation and true `Identity.zero()` attribution).
- Short-term compatibility: add `--spacing-*` aliases in `src/styles/theme.css` to get immediate visual parity, then migrate CSS to canonical tokens.

**Next steps (recommended order)**
1. Commit server schema & reducer and run `spacetime generate` to produce client bindings.
2. Update `useOnlineUsers` to call the server reducer and subscribe to the new table.
3. Apply the theme token shim and CSS migrations; tweak `MessageList` rendering for the new entity.

Saved for review and execution in a follow-up session.
