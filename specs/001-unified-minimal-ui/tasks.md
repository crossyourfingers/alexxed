# Tasks: Alexxed Streamer Community Platform

**Input**: Design documents from `/specs/001-unified-minimal-ui/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reducers.md, quickstart.md

**Context**: This is a "level set" implementation - validating existing chat platform implementation against consolidated spec and adding new streamer features (profile, schedule, moderation, video placeholder).

**Tests**: NOT requested in spec - tasks focus on implementation only

**Organization**: Tasks grouped by user story for independent implementation

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US#) or section this belongs to
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Project structure and dependency updates

- [ ] T001 Review existing project structure against plan.md for completeness
- [ ] T002 [P] Update SpacetimeDB SDK dependencies to 2.0.1+ in spacetimedb/package.json
- [ ] T003 [P] Verify React 18.3.1 and Vite 7.1.5 versions in package.json
- [ ] T004 [P] Review constitution.md principles and ensure project follows all 6 principles

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story implementation can begin until Phase 2 is complete

### Schema & Backend Infrastructure

- [ ] T005 Add StreamerProfile table to spacetimedb/src/index.ts (id=ADMIN_IDENTITY PK, name, bio, avatarUrl, socialLinks as JSON string, streamStatus 'online'/'offline')
- [ ] T006 [P] Add StreamScheduleDay table to spacetimedb/src/index.ts (dayNumber 1-7 PK, theme, description)
- [ ] T007 [P] Add ReportedMessage table to spacetimedb/src/index.ts (id auto-inc PK, messageId, reporterIdentity, reportedAt timestamp, status: 'pending'/'reviewed'/'resolved'; admin-only access)
- [ ] T008 [P] Add ChannelUnread table to spacetimedb/src/index.ts (userId+channelId composite key, lastReadTimestamp)
- [ ] T009 Add avatarUrl field to User table in spacetimedb/src/index.ts (optional string)
- [ ] T010 [P] Add isLiveChat field to Channel table in spacetimedb/src/index.ts (boolean)
- [ ] T011 Add character limit check (2000 max) to send_message reducer in spacetimedb/src/index.ts (FR-B08)
- [ ] T012 [P] Create scheduled reducer cleanup_old_sessions in spacetimedb/src/index.ts (7-day retention per FR-F08)
- [ ] T013 Publish updated module: `spacetime publish` + `spacetime generate`

### Frontend Infrastructure

- [ ] T014 Create src/types/streamer.ts for StreamerProfile, StreamScheduleDay, ReportedMessage types
- [ ] T015 [P] Create src/utils/constants.ts for MAX_MESSAGE_LENGTH=2000, OFFLINE_FILTER_DAYS=7, ADMIN_IDENTITY constant, and 7 default schedule themes (Stardew Valley, Farming Games, Fantasy Adventure, Science Fiction, Horror/Scary, Puzzle/Platformer, Any Category)
- [ ] T016 [P] Add Rosie the Riveter SVG mascot asset to src/assets/rosie-raven.svg
- [ ] T017 [P] Create src/hooks/useStreamStatus.ts for stream online/offline state management
- [ ] T018 [P] Create src/hooks/useChannelUnread.ts for unread indicator state management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story A1 - OIDC Authentication Flow (Priority: P1) 🎯

**Goal**: Migrate from credentials-based auth to SpacetimeAuth (OIDC)

**Independent Test**: User can login via SpacetimeAuth, token connects to SpacetimeDB with identity

- [ ] T019 [A1] Verify src/auth/authProvider.ts abstracts OIDC provider correctly (FR-A01)
- [ ] T020 [A1] Configure SpacetimeAuth authority (auth.spacetimedb.com) in authProvider.ts (FR-A02)
- [ ] T021 [A1] Map OIDC token claims (sub→identity, preferred_username→user.name, email→email) in authProvider.ts per FR-A03 and data-model.md user table
- [ ] T022 [A1] Implement logout redirect to SpacetimeAuth signout endpoint in authProvider.ts (FR-A04)
- [ ] T023 [A1] Pass token to DbConnection.builder().withToken() in src/main.tsx (FR-A05)

**Checkpoint**: OIDC authentication complete and functional

---

## Phase 4: User Story A2 - Login UI Experience (Priority: P2)

**Goal**: Welcoming login form with chibi raven mascot

**Independent Test**: Login form displays raven mascot with green/black theme, SpacetimeAuth attribution visible

- [ ] T024 [A2] Add chibi raven SVG animation to src/LoginForm.tsx (FR-A06)
- [ ] T025 [A2] Display "Sign in with SpacetimeAuth to continue" text in src/LoginForm.tsx
- [ ] T026 [A2] Add "Powered by SpacetimeAuth" attribution to src/LoginForm.tsx footer
- [ ] T027 [A2] Style LoginForm with green/black theme tokens from src/styles/theme.css

**Checkpoint**: Login UI matches spec visual requirements

---

## Phase 5: User Story B1 - Send and Receive Messages (Priority: P1) 🎯

**Goal**: Real-time message sending with SpacetimeDB subscriptions

**Independent Test**: Send message in one client, appears instantly in all connected clients

- [ ] T028 [B1] Verify send_message reducer handles channel_id in spacetimedb/src/index.ts (FR-B01)
- [ ] T029 [B1] Confirm message subscription in src/hooks/useChatMessages.ts uses useTable(tables.message) (FR-B03)
- [ ] T030 [B1] Ensure MessageList in src/components/Chat/MessageList.tsx displays chronologically (FR-B04)
- [ ] T031 [B1] Add message validation UI feedback in src/components/Chat/MessageInput.tsx for 2000 char limit (FR-B09)

**Checkpoint**: Core messaging functional and meets <100ms delivery target (SC-B01)

---

## Phase 6: User Story B2 - Auto-Scroll Behavior (Priority: P2)

**Goal**: Smart auto-scroll when at bottom, pause when scrolled up

**Independent Test**: Scroll to bottom → new message auto-scrolls; scroll up → pauses; scroll back down → resumes

- [ ] T032 [B2] Implement scroll position detection in src/components/Chat/MessageList.tsx (FR-B05, FR-B06)
- [ ] T033 [B2] Add auto-scroll logic on new message arrival in MessageList.tsx (FR-B05)
- [ ] T034 [B2] Implement pause auto-scroll when user scrolls up in MessageList.tsx (FR-B06)
- [ ] T035 [B2] Resume auto-scroll when user returns to bottom in MessageList.tsx (FR-B07)

**Checkpoint**: Auto-scroll behavior meets 99%+ bottom detection accuracy (SC-B03)

---

## Phase 7: User Story C1 - Like/Unlike Messages (Priority: P2)

**Goal**: Users like other users' messages with real-time counts

**Independent Test**: Like another user's message → count increments; like own message → toast "nah, that's not cool"

- [ ] T036 [C1] Verify toggle_like reducer implements self-like prevention in spacetimedb/src/index.ts (FR-C04)
- [ ] T037 [C1] Add like count display to src/components/Chat/MessageItem.tsx (FR-C03)
- [ ] T038 [C1] Implement like/unlike button toggle in MessageItem.tsx (FR-C02)
- [ ] T039 [C1] Add toast notification for self-like attempt in MessageItem.tsx (FR-C04)
- [ ] T040 [C1] Respect ENABLE_MESSAGE_LIKES flag in src/config/featureFlags.ts (FR-C06)

**Checkpoint**: Likes functional, self-like prevented, counts update <100ms (SC-C01)

---

## Phase 8: User Story D1 - Add/Remove Reactions (Priority: P2)

**Goal**: Emoji reactions (👍 ❤️ 😂 😮 😢 🎉) on any message

**Independent Test**: Add reaction to any message → displays with count; click again → removes

- [ ] T041 [D1] Verify toggle_reaction reducer handles 6 allowed emojis in spacetimedb/src/index.ts (FR-D02)
- [ ] T042 [D1] Create ReactionPicker component in src/components/Chat/ReactionPicker.tsx with 6 emojis (FR-D02)
- [ ] T043 [D1] Display reaction groups with counts in src/components/Chat/MessageItem.tsx (FR-D04)
- [ ] T044 [D1] Highlight user's own reactions in MessageItem.tsx (FR-D05)
- [ ] T045 [D1] Respect ENABLE_EMOJI_REACTIONS flag in src/config/featureFlags.ts (FR-D06)

**Checkpoint**: Reactions functional, picker opens <150ms (SC-D01), counts update <100ms (SC-D02)

---

## Phase 9: User Story E1 - Persistent Connection Events (Priority: P1) 🎯

**Goal**: Connection/disconnect events persisted as system messages

**Independent Test**: User connects → system message "X joined"; user disconnects → system message "X left"

- [ ] T046 [E1] Verify insert_system_message reducer in spacetimedb/src/index.ts creates records (FR-E01)
- [ ] T047 [E1] Ensure clientConnected hook calls insert_system_message with 'connect' type in spacetimedb/src/index.ts (FR-E03)
- [ ] T048 [E1] Ensure clientDisconnected hook calls insert_system_message with 'disconnect' type in spacetimedb/src/index.ts (FR-E04)
- [ ] T049 [E1] Confirm system messages include channelId for filtering in spacetimedb/src/index.ts (FR-E05)
- [ ] T050 [E1] Verify system_message subscription delivers in real-time in src/hooks/useChatMessages.ts (FR-E07)

**Checkpoint**: System messages persist and deliver within same transaction (SC-E01), visible <100ms (SC-E02)

---

## Phase 10: User Story E2 - System Message Display (Priority: P2)

**Goal**: System messages visually distinct with muted styling

**Independent Test**: System messages appear centered, muted color, clearly different from user messages

- [ ] T051 [E2] Style system messages with centered alignment in src/components/Chat/MessageItem.tsx (FR-E02, FR-032)
- [ ] T052 [E2] Apply --color-text-muted to system messages in MessageItem.tsx (FR-032)
- [ ] T053 [E2] Add smaller font size and badge style to system messages in MessageItem.tsx
- [ ] T054 [E2] Group consecutive system messages with minimal spacing in MessageList.tsx

**Checkpoint**: System messages visually distinct to 100% of test users (SC per G5)

---

## Phase 11: User Story F1 - Online/Offline Status (Priority: P1) 🎯

**Goal**: Online/offline user lists with real-time updates

**Independent Test**: User connects → appears in Online list; disconnects → moves to Offline list

- [ ] T055 [F1] Create useOnlineUsers hook in src/hooks/useOnlineUsers.ts filtering by online field (FR-F01, FR-F02)
- [ ] T056 [F1] Filter offline users to show only last 7 days active in useOnlineUsers.ts (FR-F10)
- [ ] T057 [F1] Display "Online" and "Offline" sections in src/pages/CommunityPage.tsx (FR-F03)
- [ ] T058 [F1] Update user online status in clientConnected/Disconnected hooks in spacetimedb/src/index.ts (FR-F02, FR-F03)

**Checkpoint**: Status updates within 500ms of connection change (SC-F01)

---

## Phase 12: User Story F2 - Session Metrics Widget (Priority: P3)

**Goal**: Header widget showing session duration and count

**Independent Test**: Widget displays live "connected for Xm Ys" counter and total session count

- [ ] T059 [F2] Create SessionWidget component in src/components/SessionWidget.tsx (FR-F05, FR-F06)
- [ ] T060 [F2] Implement live "connected for Xm Ys" counter in SessionWidget.tsx (FR-F05)
- [ ] T061 [F2] Display total session count for user in SessionWidget.tsx (FR-F06)
- [ ] T062 [F2] Add graceful fallback for missing session data in SessionWidget.tsx
- [ ] T063 [F2] Add SessionWidget to src/components/Header.tsx

**Checkpoint**: Widget updates every second with <100ms drift (SC-F02)

---

## Phase 13: User Story G1 - Consistent Visual Experience (Priority: P1) 🎯

**Goal**: Unified spacing, colors, typography across all pages

**Independent Test**: Navigate between pages → identical design patterns, spacing tokens, button styles

- [ ] T064 [G1] Audit src/ for hardcoded hex colors, replace with CSS custom properties from src/styles/theme.css (FR-001, SC-G05)
- [ ] T065 [G1] Verify all spacing uses tokens (--space-N) not arbitrary px/rem in src/ (FR-002, SC-G06)
- [ ] T066 [G1] Ensure Header.tsx height and styling consistent across pages (FR-029)
- [ ] T067 [G1] Apply consistent hover states to all interactive elements in src/components/ (FR-025, FR-026)

**Checkpoint**: Zero hardcoded colors (grep audit passes - SC-G05), consistent spacing (SC-G06)

---

## Phase 14: User Story G2 - Accessible High-Contrast (Priority: P1) 🎯

**Goal**: WCAG AAA contrast (7:1) for all text

**Independent Test**: Run contrast checker → all text meets 7:1 ratio on backgrounds

- [ ] T068 [G2] Verify --color-text-primary on --color-bg-base achieves ≥7:1 in src/styles/theme.css (FR-013)
- [ ] T069 [G2] Ensure secondary text achieves ≥4.5:1 in theme.css (FR-014)
- [ ] T070 [G2] Verify button text on --color-primary achieves ≥7:1 in theme.css (FR-013)
- [ ] T071 [G2] Test focus indicators have ≥3:1 contrast in theme.css (FR-015)

**Checkpoint**: 100% text passes WCAG AAA checker (SC-G01), Lighthouse scores 100/100 (SC-G02)

---

## Phase 15: User Story G3 - Clear Visual Hierarchy (Priority: P2)

**Goal**: Typography scale and font weights establish scannable hierarchy

**Independent Test**: 5 users identify primary CTA within 3 seconds (80%+ success)

- [ ] T072 [G3] Verify heading sizes (--text-xl, --text-2xl) clearly larger than body in src/styles/theme.css (FR-021, FR-022)
- [ ] T073 [G3] Apply font-weight-semibold to all headings in src/components/ (FR-022)
- [ ] T074 [G3] Ensure primary actions use --color-primary while secondary use muted colors in src/components/ (FR-025)
- [ ] T075 [G3] Add clear focus indicators (--color-border-focus) to all inputs in src/components/ (FR-028)

**Checkpoint**: User feedback confirms clear hierarchy (SC-G07)

---

## Phase 16: User Story G4 - Comfortable Extended Use (Priority: P2)

**Goal**: Dark mode, moderate saturation, smooth transitions for 2+ hour sessions

**Independent Test**: User feedback after 1-hour session reports no eye strain

- [ ] T076 [G4] Verify --color-bg-base uses pure black #0a0a0a in src/styles/theme.css (FR-010)
- [ ] T077 [G4] Ensure green accent --color-primary has moderate saturation in theme.css (FR-009)
- [ ] T078 [G4] Verify all transitions are 150-300ms in theme.css (FR-027, SC-G12)
- [ ] T079 [G4] Apply font smoothing (-webkit-font-smoothing: antialiased) in theme.css (FR-024)

**Checkpoint**: 80%+ users report comfortable extended use (SC-G13), session duration increases (SC-G15)

---

## Phase 17: User Story G5 - System Messages Distinct (Priority: P3)

**Goal**: System messages clearly distinguishable without disrupting flow

**Independent Test**: Show mixed feed → 5 users correctly identify system vs user messages in 5 seconds

- [ ] T080 [G5] Verify system message color is --color-text-muted in src/components/Chat/MessageItem.tsx (FR-032)
- [ ] T081 [G5] Ensure system message font is --text-xs in MessageItem.tsx
- [ ] T082 [G5] Confirm consecutive system messages group with minimal spacing in MessageList.tsx

**Checkpoint**: 100% of users identify system messages correctly in <5s

---

## Phase 18: User Story H1 - Streamer Profile Display (Priority: P1) 🎯

**Goal**: Profile page with avatar, bio, schedule, social links

**Independent Test**: Load profile → see avatar (or Rosie default), bio, schedule, working social links

- [ ] T083 [P] [H1] Create StreamerProfilePage component in src/pages/StreamerProfilePage.tsx
- [ ] T084 [P] [H1] Create useStreamerProfile hook in src/hooks/useStreamerProfile.ts using useTable(tables.streamerProfile)
- [ ] T085 [H1] Display avatar with fallback to Rosie the Riveter in StreamerProfilePage.tsx (FR-H03)
- [ ] T086 [H1] Display name and bio in StreamerProfilePage.tsx (FR-H01)
- [ ] T087 [H1] Display social platform links with icons in StreamerProfilePage.tsx (FR-H02, FR-H01)
- [ ] T088 [H1] Display online/offline colored dot indicator in StreamerProfilePage.tsx (FR-H04)
- [ ] T089 [H1] Add route for /profile in src/App.tsx

**Checkpoint**: Profile loads all components within 500ms (SC-H01), Rosie renders 100% reliably (SC-H02), links clickable (SC-H03)

---

## Phase 19: User Story H2 - Branding Customization (Priority: P2)

**Goal**: Streamer admin can edit profile/schedule, select themes

**Independent Test**: Admin saves profile changes → updates reflect immediately on public profile

- [ ] T090 [P] [H2] Create update_streamer_profile reducer in spacetimedb/src/index.ts with ctx.sender === ADMIN_IDENTITY check (FR-H06)
- [ ] T091 [P] [H2] Create StreamerAdminPage component in src/pages/StreamerAdminPage.tsx (protected: verify ctx.sender === ADMIN_IDENTITY)
- [ ] T092 [H2] Add profile edit form (bio, links as JSON array, avatar upload) in StreamerAdminPage.tsx (FR-H06)
- [ ] T093 [H2] Add theme selection interface in StreamerAdminPage.tsx (FR-H05)
- [ ] T094 [H2] Connect form to update_streamer_profile reducer in StreamerAdminPage.tsx
- [ ] T095 [H2] Add route for /admin/profile in src/App.tsx (protected: check identity === ADMIN_IDENTITY, redirect if unauthorized)

**Checkpoint**: Admin edits save and reflect within 2 seconds (SC-I03)

---

## Phase 20: User Story I1 - Weekly Schedule Display (Priority: P2)

**Goal**: Recurring weekly schedule with 7 themed days

**Independent Test**: View schedule → see 7 days with themes (Stardew Valley → Puzzle/Platformer), current day highlighted

- [ ] T096 [P] [I1] Create populate_schedule reducer in spacetimedb/src/index.ts to seed 7 days: Stardew Valley, Farming Games, Fantasy Adventure, Science Fiction, Horror/Scary, Puzzle/Platformer, Any Category (FR-I02)
- [ ] T097 [P] [I1] Create WeeklySchedule component in src/components/WeeklySchedule.tsx
- [ ] T098 [I1] Fetch schedule using useTable(tables.streamScheduleDay) in WeeklySchedule.tsx (FR-I01)
- [ ] T099 [I1] Display 7 days with themes (see T096) in WeeklySchedule.tsx (FR-I02)
- [ ] T100 [I1] Highlight current day in WeeklySchedule.tsx (FR-I03)
- [ ] T101 [I1] Add WeeklySchedule to StreamerProfilePage.tsx below bio (FR-I04)

**Checkpoint**: Schedule displays all 7 days accurately (SC-I01), current day distinct to 95%+ users (SC-I02)

---

## Phase 21: User Story J1 - Stream Page Layout (Priority: P1) 🎯

**Goal**: Stream page with 16:9 placeholder and live/replay chat

**Independent Test**: Load Stream page → see responsive 16:9 placeholder, chat sidebar (live or replay based on status)

- [ ] T102 [P] [J1] Create VideoPlaceholder component in src/components/VideoPlaceholder.tsx (16:9 responsive)
- [ ] T103 [P] [J1] Add 16:9 aspect ratio CSS to VideoPlaceholder.tsx (FR-J01, FR-J02)
- [ ] T104 [J1] Update StreamPage in src/pages/StreamPage.tsx with VideoPlaceholder + chat layout (FR-J01)
- [ ] T105 [J1] Implement live vs replay chat logic in StreamPage.tsx based on stream status (FR-J03, FR-J04)
- [ ] T106 [J1] Filter chat messages by current stream's channel in StreamPage.tsx (FR-J04)

**Checkpoint**: Placeholder maintains 16:9 across viewports (SC-J01), chat mode switches correctly (SC-J03)

---

## Phase 22: User Story J2 - Stream Online/Offline Indicator (Priority: P2)

**Goal**: Colored dot shows stream live/offline status

**Independent Test**: Stream goes live → dot turns green; goes offline → dot turns gray/muted

- [ ] T107 [P] [J2] Create StreamStatusIndicator component in src/components/StreamStatusIndicator.tsx (FR-J05)
- [ ] T108 [J2] Style indicator as colored dot (Discord/Slack/AIM style) in StreamStatusIndicator.tsx (FR-J05)
- [ ] T109 [J2] Connect indicator to stream status from useStreamStatus hook in StreamStatusIndicator.tsx
- [ ] T110 [J2] Add StreamStatusIndicator to StreamPage.tsx header (FR-J05)

**Checkpoint**: Indicator updates within 500ms of status change (FR-J06, SC-J02)

---

## Phase 23: User Story K1 - Message Reporting (Priority: P2)

**Goal**: Users report messages to admins

**Independent Test**: Click report on message → admin sees reported message in moderation queue

- [ ] T111 [P] [K1] Create report_message reducer in spacetimedb/src/index.ts (inserts with status='pending', reportedAt=ctx.timestamp) (FR-K02)
- [ ] T112 [P] [K1] Add "Report" button to src/components/Chat/MessageItem.tsx message options (FR-K01)
- [ ] T113 [K1] Connect report button to report_message reducer in MessageItem.tsx (FR-K02)
- [ ] T114 [K1] Add confirmation dialog for report action in MessageItem.tsx
- [ ] T115 [K1] Create ModerationQueue component in src/components/ModerationQueue.tsx (filters reported_message via admin-only view) (FR-K03)
- [ ] T116 [K1] Display reported messages with timestamp, reporter, and status in ModerationQueue.tsx (FR-K03)
- [ ] T117 [K1] Add route for /admin/moderation in src/App.tsx (protected: check identity === ADMIN_IDENTITY)

**Checkpoint**: Report button visible in 3 clicks (SC-K01), submission <1s (SC-K02), 100% appear in queue <2s (SC-K03)

---

## Phase 24: User Story L1 - Channel Sidebar Navigation (Priority: P1) 🎯

**Goal**: Sidebar lists channels, clicking switches chat view

**Independent Test**: Click channel in sidebar → chat view updates to that channel's messages

- [ ] T118 [L1] Verify ChannelSidebar component exists in src/components/Chat/ChannelSidebar.tsx (FR-L01)
- [ ] T119 [L1] Display channel list from useTable(tables.channel) in ChannelSidebar.tsx (FR-L01)
- [ ] T120 [L1] Implement channel click handler to switch active channel in ChannelSidebar.tsx (FR-L02)
- [ ] T121 [L1] Highlight active channel in sidebar in ChannelSidebar.tsx (FR-L03)
- [ ] T122 [L1] Ensure CommunityPage.tsx includes ChannelSidebar

**Checkpoint**: Channel switching completes <200ms with content update (SC-L01)

---

## Phase 25: User Story L2 - Passive Unread Notifications (Priority: P2)

**Goal**: Dot + bold text for channels with unread, no active alerts

**Independent Test**: Receive message in inactive channel → dot appears, name bold; switch to channel → indicators clear

- [ ] T123 [P] [L2] Create mark_channel_read reducer in spacetimedb/src/index.ts updating ChannelUnread table (FR-L06)
- [ ] T124 [L2] Implement useChannelUnread hook to track unread per channel in src/hooks/useChannelUnread.ts (FR-L04)
- [ ] T125 [L2] Display theme-matching dot next to unread channels in ChannelSidebar.tsx (FR-L04)
- [ ] T126 [L2] Apply bold font-weight to unread channel names in ChannelSidebar.tsx (FR-L05)
- [ ] T127 [L2] Call mark_channel_read when user switches to channel in ChannelSidebar.tsx (FR-L06)
- [ ] T128 [L2] Confirm no browser notifications/sounds in MessageList.tsx (FR-L07)

**Checkpoint**: Unread indicators display <500ms (SC-L02), zero false-positives (SC-L03), clear immediately on view (SC-L04)

---

## Phase 26: Polish & Cross-Cutting Concerns

**Purpose**: Improvements across all user stories

- [ ] T129 [P] Add 404 page in src/pages/NotFoundPage.tsx with chibi raven (eyes covered) (FR-H03)
- [ ] T130 [P] Update README.md with project vision, setup instructions, and streamer features
- [ ] T131 Validate all requirements against spec.md checklist in specs/001-unified-minimal-ui/checklists/platform.md
- [ ] T132 Run through quickstart.md scenarios to validate end-to-end flows
- [ ] T133 [P] Add prefers-reduced-motion support in src/styles/theme.css for accessibility
- [ ] T134 [P] Add prefers-contrast support in theme.css for high contrast mode
- [ ] T135 Performance audit: ensure <100ms message delivery, <500ms page loads (SC-B01, SC-H01)
- [ ] T136 Accessibility audit: run Lighthouse, confirm 100/100 score (SC-G02)
- [ ] T137 [P] Code cleanup: remove any TODO comments, ensure consistent formatting
- [ ] T138 Security review: verify OIDC token handling, ensure no credentials exposure

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately - no dependencies
- **Foundational (Phase 2)**: Depends on Setup - **BLOCKS all user stories**
- **User Stories (Phase 3-25)**: All depend on Foundational completion
  - Can proceed in parallel with multiple developers
  - Or sequentially by priority: P1 → P2 → P3
- **Polish (Phase 26)**: Depends on desired user stories being complete

### User Story Dependencies

**P1 stories (MVP candidates) - After Foundational:**
- A1: OIDC Auth Flow - Independent
- B1: Send/Receive Messages - Independent
- E1: Connection Events - Independent  
- F1: Online/Offline Status - Independent
- G1: Consistent Visual - Independent (but benefits all)
- G2: Accessible Contrast - Independent (but benefits all)
- H1: Streamer Profile - Independent
- J1: Stream Page Layout - Needs A1 (auth)
- L1: Channel Sidebar - Independent

**P2 stories - After Foundational:**
- A2: Login UI - Needs A1
- B2: Auto-scroll - Needs B1
- C1: Likes - Needs B1
- D1: Reactions - Needs B1
- E2: System Messages Display - Needs E1
- G3-G4: UI improvements - Independent
- H2: Branding Customization - Needs H1
- I1: Schedule - Needs H1 (displays in profile)
- J2: Stream Indicator - Needs J1
- K1: Message Reporting - Needs B1
- L2: Unread Notifications - Needs L1

**P3 stories - After Foundational:**
- F2: Session Metrics - Independent
- G5: System Messages Styling - Needs E2

### Parallel Opportunities

**Foundational Phase** - Can run in parallel:
- T005-T008, T010: All table additions (different entities)
- T014-T018: All frontend infrastructure (different files)

**After Foundational** - Multiple teams can work simultaneously:
- Team A: Auth stories (A1, A2)
- Team B: Chat stories (B1, B2, C1, D1, E1, E2)
- Team C: Streamer stories (H1, H2, I1, J1, J2)
- Team D: Navigation stories (L1, L2)
- Team E: UI/UX stories (G1-G5, F1, F2)

**Within Each User Story** - Tasks marked [P] can run in parallel:
- Example H1: T083, T084 can run together (different files)

---

## Implementation Strategy

### MVP First (Core P1 Stories)

**Minimum Viable Product** = Foundation + 3 core P1 stories:

1. **Phase 1+2**: Setup + Foundational (~T001-T018)
2. **Phase 3**: A1 - OIDC Auth (~T019-T023)
3. **Phase 5**: B1 - Messages (~T028-T031)
4. **Phase 18**: H1 - Profile (~T083-T089)

**Result**: Authenticated users can chat and view streamer profile

### Full P1 Implementation

Add remaining P1 stories:
- E1: Connection events
- F1: Online/offline status  
- G1-G2: Visual consistency + accessibility
- J1: Stream page layout
- L1: Channel navigation

**Result**: Core platform with professional UI/UX

### Incremental P2 Delivery

Add P2 stories in priority order:
- A2: Login UI polish
- B2: Auto-scroll
- C1, D1: Likes & reactions
- E2: System message styling
- H2, I1: Admin customization + schedule
- J2, K1, L2: Stream indicator, moderation, unread

**Result**: Feature-complete platform

### P3 Enhancements

Optional enhancements:
- F2: Session metrics widget
- G5: System message polish

---

## Parallel Example: Foundational Phase

```bash
# All schema additions can happen simultaneously (different tables):
Task T005: "Add StreamerProfile table to spacetimedb/src/index.ts"
Task T006: "Add StreamScheduleDay table to spacetimedb/src/index.ts"
Task T007: "Add ReportedMessage table to spacetimedb/src/index.ts"
Task T008: "Add ChannelUnread table to spacetimedb/src/index.ts"
Task T010: "Add isLiveChat field to Channel table"

# Frontend infrastructure (different files):
Task T014: "Create src/types/streamer.ts"
Task T015: "Create src/utils/constants.ts"  
Task T016: "Add Rosie mascot to src/assets/"
Task T017: "Create src/hooks/useStreamStatus.ts"
Task T018: "Create src/hooks/useChannelUnread.ts"
```

---

## Notes

- **[P] = Parallelizable**: Different files, no blocking dependencies
- **[Story]**: Maps to user story for tracking (A1, B1, H1, etc.)
- **Tests NOT included**: Spec doesn't request TDD, focus on implementation
- **Existing code**: Many features already exist, tasks focus on gaps + new streamer features
- **Constitution compliance**: Mind Principle VI (Testing) gap - consider adding tests in Polish phase
- Each user story should be independently testable via acceptance scenarios in spec.md
- Commit after each task or logical group
- Stop at any checkpoint to validate story works independently
