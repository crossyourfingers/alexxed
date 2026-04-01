# Feature Specification: Alexxed Chat Platform - Level Set

**Feature Branch**: `001-unified-minimal-ui`  
**Created**: 2026-03-06  
**Status**: Active  

## Vision

Alexxed is a streamer community platform built on SpacetimeDB with:
- **Authentication**: SpacetimeAuth (OIDC) with provider abstraction
- **Streamer Profile**: Avatar, bio, schedule, social links with online/offline status
- **Stream Page**: Static placeholder (16:9) with live chat or replay channels
- **Real-time Chat**: Messages, likes, emoji reactions, system messages
- **Moderation**: Report button for message flagging to admins
- **User Presence**: Online/offline status with session metrics
- **Channel Navigation**: Sidebar with unread indicators (passive notifications)
- **Unified UI**: Minimal green/black theme with WCAG AAA accessibility


## Clarifications

### Session 2026-03-06

- Q: Should message sending have rate limiting? → A: No rate limiting (trust users, handle abuse reactively)
- Q: What is the session cleanup retention period? → A: 7 days (aggressive cleanup)
- Q: What is the maximum message length? → A: 2000 characters (Discord-style)
- Q: Can users have multiple simultaneous connections? → A: Yes, multiple connections allowed (all receive messages)
- Q: How should offline user list be filtered? → A: Show only users active within last 7 days

### Session 2026-03-06 - Platform Features

- Q: What aspect ratio/sizing for video placeholder? → A: 16:9 responsive to container width
- Q: What schedule format? → A: Recurring weekly with 7 themed days (Stardew Valley, Farming Games, Fantasy Adventure, Science Fiction, Horror/Scary, Puzzle/Platformer, Any Category)
- Q: What style for online/offline indicator? → A: Colored dot (Discord/Slack/AIM style)
- Q: How to handle moderation? → A: Report button sends alert to admin with message reference
- Q: What notifications? → A: Passive only (dot + bold text for unread channels, no browser alerts/sounds)
- Q: Channel navigation? → A: Sidebar list for channel switching
- Q: Profile content? → A: Avatar, name, bio, schedule, social platform links (YouTube, Twitch, Discord, etc.)
- Q: Mascot usage? → A: Rosie the Riveter styled avatar as default for users without uploads, 404 page with eyes covered
- Q: Customization boundaries? → A: Streamer can select themes and edit profile/schedule data
- Q: Stream/Community page relationship? → A: Stream shows video placeholder + live chat (or replay), Community shows searchable channels + members

---

## SECTION A: Authentication System

### User Story A1 - OIDC Authentication Flow (Priority: P1)

Authenticated users login via SpacetimeAuth (OIDC) and establish secure SpacetimeDB connections with their identity.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** they open the application, **Then** they see the login form with "Sign In" button and "Powered by SpacetimeAuth" attribution
2. **Given** a user clicks "Sign In", **When** SpacetimeAuth authentication completes, **Then** tokens are received and the user is connected to SpacetimeDB with their identity
3. **Given** a user is authenticated, **When** viewing user information, **Then** user ID comes from `sub` claim, username from `preferred_username`, email from `email` claim
4. **Given** a user clicks logout, **When** signout completes, **Then** they are redirected to SpacetimeAuth signout endpoint and session is terminated

### User Story A2 - Login UI Experience (Priority: P2)

The login form displays a welcoming interface with chibi raven mascot animation matching the application theme.

**Acceptance Scenarios**:

1. **Given** the login form renders, **When** user views it, **Then** a chibi raven SVG animation is displayed with large anime eyes and cute proportions
2. **Given** SpacetimeAuth mode is active, **When** login form displays, **Then** "Sign in with SpacetimeAuth to continue" description appears
3. **Given** the mascot animation runs, **When** user observes, **Then** color scheme matches application green/black theme

---

## SECTION B: Core Chat Messaging

### User Story B1 - Send and Receive Messages (Priority: P1)

Authenticated users send messages that are persisted and broadcast to all connected clients in real-time.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they submit a non-empty message, **Then** message is stored with timestamp and sender identity
2. **Given** a message is sent, **When** it's stored, **Then** all connected clients receive the message in real-time via subscription
3. **Given** messages exist, **When** viewing the chat, **Then** messages display sender name, text content, and timestamp in chronological order

### User Story B2 - Auto-Scroll Behavior (Priority: P2)

Chat automatically scrolls to new messages unless user is reviewing history.

**Acceptance Scenarios**:

1. **Given** user is scrolled to bottom, **When** new message arrives, **Then** view auto-scrolls to show new message
2. **Given** user has scrolled up to read history, **When** new message arrives, **Then** auto-scroll is paused
3. **Given** auto-scroll is paused, **When** user scrolls back to bottom, **Then** auto-scroll resumes

---

## SECTION C: Message Likes

### User Story C1 - Like/Unlike Messages (Priority: P2)

Users can like messages from other users with real-time count updates.

**Acceptance Scenarios**:

1. **Given** a message from another user, **When** user clicks like button, **Then** like is recorded, count increments, button shows liked state
2. **Given** user has liked a message, **When** clicking like button again, **Then** like is removed, count decrements, button shows unliked state
3. **Given** a user's own message, **When** clicking like button, **Then** toast notification shows "nah, that's not cool" and no like is recorded
4. **Given** `ENABLE_MESSAGE_LIKES` is false, **When** viewing messages, **Then** like buttons are not displayed

---

## SECTION D: Emoji Reactions

### User Story D1 - Add/Remove Reactions (Priority: P2)

Users can add emoji reactions to any message (including their own) with real-time aggregation.

**Acceptance Scenarios**:

1. **Given** a message exists, **When** user selects emoji from picker (👍 ❤️ 😂 😮 😢 🎉), **Then** reaction is recorded and count updates in real-time
2. **Given** user has reacted with specific emoji, **When** clicking same emoji again, **Then** reaction is removed
3. **Given** multiple users reacted, **When** viewing message, **Then** reactions grouped by emoji with counts; user's own reactions highlighted
4. **Given** `ENABLE_EMOJI_REACTIONS` is false, **When** viewing messages, **Then** reaction buttons and existing reactions hidden

---

## SECTION E: System Messages

### User Story E1 - Persistent Connection Events (Priority: P1)

Connection/disconnect events are persisted as system messages visible to all users.

**Acceptance Scenarios**:

1. **Given** user authenticates, **When** connection established, **Then** system message inserted with `messageType: 'connect'`, `sender: Identity.zero()`, timestamp
2. **Given** user is online, **When** they disconnect, **Then** system message inserted with `messageType: 'disconnect'`, `sender: Identity.zero()`, timestamp
3. **Given** multiple users connected in channel, **When** new user joins/leaves, **Then** all clients receive system message in real-time
4. **Given** system message includes channel context, **When** stored, **Then** `channelId` is present for proper filtering

### User Story E2 - System Message Display (Priority: P2)

System messages are visually distinct from user messages with muted styling.

**Acceptance Scenarios**:

1. **Given** system message appears in feed, **When** viewing, **Then** uses muted text color (--color-text-muted), centered alignment, smaller badge
2. **Given** consecutive system messages appear, **When** displayed, **Then** visually grouped with minimal spacing
3. **Given** user scrolls through feed, **When** system messages pass, **Then** quickly scanable without disrupting reading flow

---

## SECTION F: User Presence & Session Metrics

### User Story F1 - Online/Offline Status (Priority: P1)

Users see who is currently online with separate lists for online and offline users.

**Acceptance Scenarios**:

1. **Given** user authenticates, **When** connection established, **Then** user appears in "Online" list and system message announces arrival
2. **Given** user disconnects, **When** connection closes, **Then** user moves to "Offline" list and system message announces departure
3. **Given** viewing chat interface, **When** user lists render, **Then** "Online" and "Offline" sections are separated with clear labeling

### User Story F2 - Session Metrics Widget (Priority: P3)

Users see their session duration and total session count in a header widget.

**Acceptance Scenarios**:

1. **Given** user is connected, **When** viewing header, **Then** SessionWidget shows live-updating "connected for Xm Ys"
2. **Given** user has history, **When** viewing header, **Then** total session count is displayed
3. **Given** session data unavailable, **When** widget renders, **Then** graceful fallback state is shown

---

---

## SECTION G: UI/UX Consistency

### User Story G1 - Consistent Visual Experience Across Pages (Priority: P1)

Users navigate between different pages (Community, Stream) and experience a unified visual language with consistent spacing, colors, and typography throughout the application.

**Why this priority**: Visual consistency is foundational to professional UI/UX. Without it, the app feels disjointed and unprofessional, directly impacting user trust and adoption.

**Independent Test**: Navigate from Stream to Community page. All header elements, spacing, buttons, and text should feel like the same application with identical design patterns.

**Acceptance Scenarios**:

1. **Given** a user is on the Stream page, **When** they navigate to the Community page, **Then** header height, spacing, and button styles are identical
2. **Given** a user views any page, **When** they observe spacing between elements, **Then** all gaps use consistent spacing tokens (--space-2, --space-4, etc.)
3. **Given** components use the theme system, **When** rendered on any page, **Then** colors derive from CSS custom properties not hardcoded values
4. **Given** interactive elements exist on any page, **When** user hovers over them, **Then** hover states are consistent and predictable

### User Story G2 - Accessible High-Contrast Reading Experience (Priority: P1)

Users with visual impairments or those working in various lighting conditions can read all text comfortably with WCAG AAA compliant contrast ratios (7:1 minimum) between text and backgrounds.

**Why this priority**: Accessibility is non-negotiable and legally required in many contexts. Poor contrast causes eye strain and excludes users with visual impairments.

**Independent Test**: Use browser DevTools or automated accessibility checker to verify all text elements meet WCAG AAA contrast requirements (7:1 ratio).

**Acceptance Scenarios**:

1. **Given** primary text is displayed on dark background, **When** measured with contrast checker, **Then** ratio is ≥7:1 (e.g., #f5f5f5 on #0a0a0a)
2. **Given** secondary text appears (timestamps, metadata), **When** contrast is measured, **Then** ratio is ≥4.5:1 minimum for AA compliance
3. **Given** system messages are muted for visual hierarchy, **When** contrast is measured, **Then** they still meet AA compliance (4.5:1) for legibility
4. **Given** buttons display primary green color, **When** text contrast is measured, **Then** on-primary text has ≥7:1 ratio

### User Story G3 - Clear Visual Hierarchy and Scanability (Priority: P2)

Users can quickly scan the interface and understand information hierarchy through consistent use of typography scale, font weights, and spacing without visual clutter.

**Why this priority**: Clear hierarchy improves task completion speed and reduces cognitive load. Users should never wonder "what should I look at first?"

**Independent Test**: Ask 5 users to identify the most important action on each page within 3 seconds. 80%+ should correctly identify primary CTAs.

**Acceptance Scenarios**:

1. **Given** a page with multiple text sizes, **When** user scans the content, **Then** headings (--text-xl, --text-2xl) are clearly larger than body text (--text-base)
2. **Given** a message feed with mixed message types, **When** viewing the feed, **Then** user messages are prominent while system messages are visually de-emphasized but readable
3. **Given** interactive elements (buttons, links), **When** comparing them to static text, **Then** primary actions use primary color while secondary actions use muted colors
4. **Given** form inputs exist, **When** focused, **Then** clear focus indicator (--color-border-focus) appears with no ambiguity

### User Story G4 - Comfortable Extended Use Without Eye Fatigue (Priority: P2)

Users engage with the application for extended periods (2+ hours) without experiencing eye strain or fatigue from the color palette, with smooth transitions and comfortable brightness levels.

**Why this priority**: Chat/community applications see extended use sessions. Uncomfortable UI causes user abandonment and negative perception.

**Independent Test**: User feedback after 1-hour session: subjective report of comfort level and any eye strain symptoms.

**Acceptance Scenarios**:

1. **Given** dark mode is active (default), **When** user views for extended periods, **Then** black backgrounds are pure black (#0a0a0a) not gray to reduce light emission
2. **Given** green accent colors are used, **When** viewing them, **Then** saturation is moderate (HSL saturation ~60-70%) not neon-bright to prevent fatigue
3. **Given** state transitions occur (hover, focus), **When** animations play, **Then** duration is 150-300ms (subtle, not jarring)
4. **Given** text is displayed, **When** user reads for 30+ minutes, **Then** font smoothing (-webkit-font-smoothing: antialiased) improves clarity

### User Story G5 - System Messages Visually Distinguished (Priority: P3)

System-generated messages (user joined, user left) are clearly distinguishable from user messages but don't interrupt the reading flow with appropriate muted styling.

**Why this priority**: Prevents confusion about who said what, maintains context, but should be subtle to avoid distraction from actual conversations.

**Independent Test**: Show mixed feed of user and system messages to 5 new users. All should correctly identify which are system vs user messages within 5 seconds.

**Acceptance Scenarios**:

1. **Given** system message appears in feed, **When** user views it, **Then** it uses muted text color (--color-text-muted) and centered alignment
2. **Given** system message has timestamp, **When** rendered, **Then** timestamp format matches user messages but with smaller font (--text-xs)
3. **Given** consecutive system messages appear, **When** displayed, **Then** they're visually grouped with minimal spacing between them
4. **Given** user scrolls through feed, **When** system messages pass, **Then** they're quickly scanable without disrupting reading flow

---

### Edge Cases

- **High Contrast Mode**: When OS-level high contrast mode is enabled, does the theme system respect user preferences via prefers-contrast media query?
- **Reduced Motion**: When user has prefers-reduced-motion enabled, are all animations disabled or reduced to instant transitions?
- **Color Blindness**: Can users with deuteranopia (red-green color blindness) still differentiate UI states using brightness/saturation differences?
- **Very Long Content**: When messages contain 1000+ characters or code blocks, does spacing remain consistent?
- **Small Screens**: On 320px wide screens (iPhone SE), do spacing tokens scale appropriately or cause layout breaks?
- **Light Mode Toggle**: If light mode is added later, do all components respect the data-mode attribute without hardcoded colors?

---

## SECTION H: Streamer Profile & Branding

### User Story H1 - Streamer Profile Display (Priority: P1)

Users can view the streamer's profile with avatar, bio, streaming schedule, and social platform links.

**Acceptance Scenarios**:

1. **Given** a user views the streamer profile, **When** the profile loads, **Then** avatar, name, bio, schedule, and platform links are displayed
2. **Given** the profile includes social links, **When** displayed, **Then** icons for YouTube, Twitch, Discord and other supported platforms appear with working links
3. **Given** a user has not uploaded an avatar, **When** profile displays, **Then** chibi raven mascot styled as Rosie the Riveter appears as default avatar
4. **Given** streamer is offline, **When** profile displays, **Then** colored dot indicator shows offline status (Discord/Slack/AIM style)

### User Story H2 - Branding Customization (Priority: P2)

Streamer can select themes and edit profile/schedule data through admin interface.

**Authorization Model**: Single-streamer platform - the streamer IS the admin. Admin identity is hardcoded as `ADMIN_IDENTITY` constant (SpacetimeDB Identity). All admin-only reducers verify `ctx.sender === ADMIN_IDENTITY` before executing.

**Acceptance Scenarios**:

1. **Given** streamer has admin access (ctx.sender === ADMIN_IDENTITY), **When** viewing settings, **Then** theme selection interface shows available themes
2. **Given** streamer edits profile data (via update_streamer_profile reducer), **When** saved, **Then** changes reflect immediately on public profile
3. **Given** streamer updates schedule, **When** saved, **Then** schedule displays updated information across all pages
4. **Given** a non-admin user attempts admin action, **When** calling admin-only reducer, **Then** SenderError("Only admin can ...") is returned

---

## SECTION I: Stream Schedule

### User Story I1 - Weekly Schedule Display (Priority: P2)

Users can view the streamer's recurring weekly schedule with themed days.

**Acceptance Scenarios**:

1. **Given** a user views the schedule, **When** it displays, **Then** 7 days are shown with themes: Day 1 (Stardew Valley), Day 2 (Farming Games), Day 3 (Fantasy Adventure), Day 4 (Science Fiction), Day 5 (Horror/Scary), Day 6 (Puzzle/Platformer), Day 7 (Any Category)
2. **Given** schedule displays, **When** user views it, **Then** current day is highlighted or visually distinguished
3. **Given** schedule is part of profile, **When** profile loads, **Then** schedule appears below bio and platform links

---

## SECTION J: Stream Page & Video Placeholder

### User Story J1 - Stream Page Layout (Priority: P1)

Users view the Stream page with video area and associated stream chat.

**Acceptance Scenarios**:

1. **Given** streamer is active, **When** Stream page loads, **Then** static image placeholder (16:9 aspect ratio) and live chat are displayed side-by-side
2. **Given** streamer is inactive, **When** Stream page loads, **Then** previous stream placeholder image and chat replay channel are shown
3. **Given** video placeholder renders, **When** displayed, **Then** it uses responsive sizing to fit container width while maintaining 16:9 ratio
4. **Given** stream chat is active, **When** displayed, **Then** messages are in real-time for live streams, or historical for replays

### User Story J2 - Stream Online/Offline Indicator (Priority: P2)

Users can see at a glance whether the stream is currently live.

**Acceptance Scenarios**:

1. **Given** stream is live, **When** indicator displays, **Then** colored dot shows online state (green) with Discord/Slack/AIM styling
2. **Given** stream is offline, **When** indicator displays, **Then** colored dot shows offline state (gray/muted)
3. **Given** indicator is present, **When** stream status changes, **Then** indicator updates within 500ms

---

## SECTION K: Moderation & Reporting

### User Story K1 - Message Reporting (Priority: P2)

Users can report problematic messages to alert administrators.

**Moderation Queue Implementation**: `reported_message` table with private admin-only view filtered by `ctx.sender === ADMIN_IDENTITY`. Reports have status field ('pending', 'reviewed', 'resolved') for workflow tracking.

**Acceptance Scenarios**:

1. **Given** a message is displayed, **When** user interacts with message options, **Then** "Report" button is available
2. **Given** user clicks "Report", **When** confirmed (via report_message reducer), **Then** row inserted in reported_message table with status='pending'
3. **Given** message is reported, **When** admin (ADMIN_IDENTITY) views moderation queue, **Then** reported message, timestamp, reporter, and status are visible
4. **Given** non-admin user, **When** attempting to access moderation queue, **Then** view returns empty (filtered by admin identity)

---

## SECTION L: Channel Navigation & Notifications

### User Story L1 - Channel Sidebar Navigation (Priority: P1)

Users navigate between chat channels using a sidebar list.

**Acceptance Scenarios**:

1. **Given** multiple channels exist, **When** user views chat interface, **Then** sidebar displays list of available channels
2. **Given** user clicks a channel in sidebar, **When** selected, **Then** chat view switches to that channel's messages
3. **Given** active channel is selected, **When** sidebar displays, **Then** current channel is highlighted or marked as active

### User Story L2 - Passive Unread Notifications (Priority: P2)

Users see unread message indicators without active alerts.

**Acceptance Scenarios**:

1. **Given** a channel has unread messages, **When** sidebar displays, **Then** theme-matching dot appears next to channel name
2. **Given** a channel has unread messages, **When** sidebar displays, **Then** channel name appears in bold font-weight
3. **Given** user switches to a channel, **When** viewing messages, **Then** unread indicators clear for that channel
4. **Given** this is a web app, **When** user receives new messages, **Then** no browser notifications, sounds, or popups occur (passive only)

---

### Edge Cases

- **High Contrast Mode**: When OS-level high contrast mode is enabled, does the theme system respect user preferences via prefers-contrast media query?
- **Reduced Motion**: When user has prefers-reduced-motion enabled, are all animations disabled or reduced to instant transitions?
- **Color Blindness**: Can users with deuteranopia (red-green color blindness) still differentiate UI states using brightness/saturation differences?
- **Very Long Content**: When messages contain 1000+ characters or code blocks, does spacing remain consistent?
- **Small Screens**: On 320px wide screens (iPhone SE), do spacing tokens scale appropriately or cause layout breaks?

- **FR-A01**: System MUST provide unified AuthProvider interface with login, logout, getUser, getToken, and status methods
- **FR-A02**: System MUST configure OIDC with SpacetimeAuth authority (auth.spacetimedb.com)
- **FR-A03**: System MUST extract user info from OIDC tokens: sub → userId, preferred_username → username, email → email
- **FR-A04**: System MUST redirect users to SpacetimeAuth signout endpoint on logout
- **FR-A05**: System MUST establish SpacetimeDB connection with authentication token
- **FR-A06**: System MUST display chibi raven mascot animation on login form
- **FR-A07**: System SHOULD allow adding new OAuth2 providers with minimal changes (provider extensibility)

### Chat Messaging Requirements

- **FR-B01**: Authenticated users MUST be able to send text messages to chat
- **FR-B02**: Messages MUST be stored with sender identity, text, and timestamp
- **FR-B03**: All connected clients MUST receive messages in real-time via subscriptions
- **FR-B04**: Messages MUST display in chronological order with sender name and timestamp
- **FR-B05**: Auto-scroll MUST activate when user is at bottom of message list
- **FR-B06**: Auto-scroll MUST pause when user scrolls up to read history
- **FR-B07**: Auto-scroll MUST resume when user returns to bottom
- **FR-B08**: Messages MUST be limited to 2000 characters maximum
- **FR-B09**: Messages exceeding 2000 characters MUST be rejected with user-friendly error

### Message Like Requirements

- **FR-C01**: Users MUST be able to like messages from other users
- **FR-C02**: Like button MUST toggle between liked/unliked state
- **FR-C03**: Like counts MUST update in real-time for all connected clients
- **FR-C04**: Users MUST NOT be able to like their own messages (toast: "nah, that's not cool")
- **FR-C05**: Duplicate likes for same user/message MUST be prevented
- **FR-C06**: Like feature MUST be toggleable via `ENABLE_MESSAGE_LIKES` flag

### Emoji Reaction Requirements

- **FR-D01**: Users MUST be able to add emoji reactions to any message (including own)
- **FR-D02**: Available emojis MUST be: 👍 ❤️ 😂 😮 😢 🎉
- **FR-D03**: Clicking same emoji again MUST remove the reaction (toggle behavior)
- **FR-D04**: Reactions MUST display grouped by emoji with counts
- **FR-D05**: User's own reactions MUST be visually highlighted
- **FR-D06**: Reaction feature MUST be toggleable via `ENABLE_EMOJI_REACTIONS` flag

### System Message Requirements

- **FR-E01**: System MUST persist connection events in `system_message` table
- **FR-E02**: System messages MUST use `sender: Identity.zero()` for attribution
- **FR-E03**: Connect events MUST have `messageType: 'connect'`
- **FR-E04**: Disconnect events MUST have `messageType: 'disconnect'`
- **FR-E05**: System messages MUST include `channelId` for filtering
- **FR-E06**: System messages MUST include `createdAt` timestamp (microsecond resolution)
- **FR-E07**: All connected clients MUST receive system messages in real-time
- **FR-E08**: System messages MUST support efficient indexed queries (no full-table iteration)

### User Presence & Session Requirements

- **FR-F01**: System MUST track online/offline status for all users
- **FR-F02**: User connecting MUST appear in "Online" list
- **FR-F03**: User disconnecting MUST move to "Offline" list
- **FR-F04**: System MUST store session records with sessionId, userId, connectedAt, disconnectedAt
- **FR-F05**: SessionWidget MUST display live "connected for Xm Ys" counter
- **FR-F06**: SessionWidget MUST display total session count for user
- **FR-F07**: Session data MUST be private to the authenticated user (view with ctx.sender)
- **FR-F08**: Scheduled cleanup MUST delete sessions older than 7 days
- **FR-F09**: Users MAY have multiple simultaneous connections (all receive messages)
- **FR-F10**: Offline user list MUST only show users active within the last 7 days

### UI/UX Requirements

**Design System Foundation**

- **FR-001**: System MUST define all colors via CSS custom properties in theme.css with no hardcoded hex values in components
- **FR-002**: System MUST provide spacing tokens (--space-1 through --space-12) with consistent 0.25rem increments
- **FR-003**: System MUST define typography scale (--text-xs through --text-3xl) with clear hierarchy
- **FR-004**: System MUST provide semantic color tokens (--color-text-primary, --color-bg-base) not primitive colors

**Theme Management**

- **FR-005**: System MUST support data-theme="green" attribute on html element for green/black theme
- **FR-006**: System MUST support data-mode="dark" (default) and data-mode="light" for future light mode
- **FR-007**: System MUST cascade theme tokens from :root with proper CSS specificity
- **FR-008**: System MUST provide fallback values for browsers without full CSS custom property support

**Color Palette**

- **FR-009**: Primary green MUST be #22c55e (emerald-500) with hover state #16a34a (emerald-600)
- **FR-010**: Background base MUST be #0a0a0a (near-black) for OLED-friendly pure blacks
- **FR-011**: Text primary MUST be #f5f5f5 (neutral-100) for maximum readability on dark backgrounds
- **FR-012**: System MUST provide gradations of neutral colors for surfaces (#111111, #171717, #1f1f1f)

**Accessibility**

- **FR-013**: All body text (--text-base) on backgrounds MUST achieve ≥7:1 contrast ratio (WCAG AAA)
- **FR-014**: Secondary text MUST achieve ≥4.5:1 contrast ratio (WCAG AA minimum)
- **FR-015**: Focus indicators MUST be visible with ≥3:1 contrast against adjacent colors
- **FR-016**: Interactive elements MUST have minimum 44x44px touch targets on mobile

**Spacing Consistency**

- **FR-017**: All component padding MUST use spacing tokens (var(--space-N)) not arbitrary pixel values
- **FR-018**: Vertical rhythm MUST be consistent with --space-4 (1rem) as baseline unit
- **FR-019**: Component gaps (flexbox/grid) MUST use spacing tokens for uniformity
- **FR-020**: Page-level padding MUST be --space-4 on mobile, --space-6 on desktop

**Typography**

- **FR-021**: Body text MUST use --text-base (1rem/16px) with 1.5 line-height for readability
- **FR-022**: Headings MUST use font-weight-semibold (600) to establish hierarchy
- **FR-023**: Code/monospace text MUST use --font-mono family with syntax appropriate sizing
- **FR-024**: Font smoothing MUST be enabled (-webkit-font-smoothing: antialiased)

**Interactive States**

- **FR-025**: Buttons MUST have hover state with --color-primary-hover background
- **FR-026**: Buttons MUST have active state with translateY(1px) subtle press effect
- **FR-027**: Links MUST have hover color transition within 150-200ms duration
- **FR-028**: Focus-visible MUST show 2px solid outline with 2px offset

**Component Styling**

- **FR-029**: Headers MUST use consistent height and z-index (--z-header: 200) across pages
- **FR-030**: Buttons MUST use border-radius (--radius-md: 0.375rem) for subtle rounding
- **FR-031**: Cards/surfaces MUST use --color-bg-surface with optional shadow-sm elevation
- **FR-032**: System messages MUST use centered text-align with --color-text-muted color

### Streamer Profile & Branding Requirements

- **FR-H01**: Profile MUST display avatar, name, bio, streaming schedule, and social platform links
- **FR-H02**: Profile MUST support social links for YouTube, Twitch, Discord, and other platforms (stored as JSON array: `Array<{platform: string, url: string}>`)
- **FR-H03**: Default avatar MUST be chibi raven mascot styled as Rosie the Riveter for users without uploaded avatar
- **FR-H04**: Profile MUST display colored dot indicator (Discord/Slack/AIM style) for online/offline status (see also FR-J05 for stream-specific indicator reusing same pattern)
- **FR-H05**: Streamer MUST be able to select from available themes via admin interface
- **FR-H06**: Streamer MUST be able to edit profile data (bio, links) with immediate public reflection
- **FR-H07**: Streamer MUST be able to update schedule data with immediate display updates

### Stream Schedule Requirements

- **FR-I01**: Schedule MUST display recurring weekly format with 7 days
- **FR-I02**: Schedule MUST show 7 recurring daily themes: Day 1 (Stardew Valley), Day 2 (Farming Games), Day 3 (Fantasy Adventure), Day 4 (Science Fiction), Day 5 (Horror/Scary), Day 6 (Puzzle/Platformer), Day 7 (Any Category)
- **FR-I03**: Schedule MUST visually highlight or distinguish the current day
- **FR-I04**: Schedule MUST appear below bio and platform links in profile display

### Stream Page & Video Placeholder Requirements

- **FR-J01**: Stream page MUST display static image placeholder with 16:9 aspect ratio
- **FR-J02**: Video placeholder MUST use responsive sizing to fit container width while maintaining aspect ratio
- **FR-J03**: Stream page MUST show live chat when streamer is active
- **FR-J04**: Stream page MUST show previous stream placeholder and chat replay when streamer is inactive (replay = historical messages from channel filtered by time range, no separate table)
- **FR-J05**: Stream online/offline indicator MUST use colored dot (green for online, gray for offline) with Discord/Slack/AIM styling (reuses pattern from FR-H04)
- **FR-J06**: Stream status indicator MUST update within 500ms of status change

### Moderation & Reporting Requirements

- **FR-K01**: Messages MUST display "Report" button in message options
- **FR-K02**: Report action MUST send alert to admin with message reference and reporter identity
- **FR-K03**: Admins MUST have access to moderation queue showing reported messages, timestamps, and reporters

### Channel Navigation & Notification Requirements

- **FR-L01**: Sidebar MUST display list of available channels
- **FR-L02**: Clicking a channel in sidebar MUST switch chat view to that channel's messages
- **FR-L03**: Active channel MUST be highlighted or marked in sidebar
- **FR-L04**: Channels with unread messages MUST display theme-matching dot indicator
- **FR-L05**: Channels with unread messages MUST display channel name in bold font-weight
- **FR-L06**: Unread indicators MUST clear when user switches to that channel
- **FR-L07**: System MUST NOT trigger browser notifications, sounds, or popups (passive indicators only)
- **FR-L08**: Message character limit (2000) MUST be consistently enforced in UI validation

### Key Entities

**Data Entities**

- **User**: identity (primary key), name (optional, from OIDC preferred_username or set_name), online status, avatarUrl (optional)
- **Message**: id (auto-inc), sender identity, text, timestamp, channelId
- **MessageLike**: user identity, message timestamp (composite key)
- **MessageReaction**: user identity, message timestamp, emoji (composite key)
- **SystemMessage**: id (auto-inc), sender (Identity.zero()), messageType, channelId, createdAt
- **UserSession**: sessionId (auto-inc), userId, clientId (optional), connectedAt, disconnectedAt (optional)
- **Channel**: id (auto-inc), name, description, createdAt, isLiveChat (boolean)
- **StreamerProfile**: id (primary key = ADMIN_IDENTITY), name, bio, avatarUrl, socialLinks (JSON array: `Array<{platform: string, url: string}>`), streamStatus (online/offline)
- **StreamScheduleDay**: dayNumber (1-7), theme, description (optional)
- **ReportedMessage**: id (auto-inc), messageId, reporterIdentity, timestamp, status (pending/reviewed/resolved)
- **ChannelUnread**: userId, channelId, lastReadTimestamp (composite key for tracking unread per user/channel)

**Design Tokens**

- **Spacing Scale**: 12-step scale from --space-1 (0.25rem) to --space-12 (3rem)
- **Typography Scale**: 7 sizes from --text-xs to --text-3xl with consistent line-heights
- **Color System**: Semantic tokens (text-*, bg-*, border-*) mapping to theme-specific values
- **Animation Tokens**: Transition durations (fast: 150ms, base: 200ms, slow: 300ms)
- **Elevation System**: 4-level shadow scale for surface depth indication

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Authentication**

- **SC-A01**: OIDC login flow completes within 10 seconds (redirect + token exchange)
- **SC-A02**: Token refresh happens automatically before expiry with no user interruption
- **SC-A03**: Logout redirects to SpacetimeAuth and clears local session within 2 seconds

**Chat Messaging**

- **SC-B01**: Messages appear to all connected clients within 100ms of send (real-time)
- **SC-B02**: Message history loads within 500ms on initial subscription
- **SC-B03**: Auto-scroll correctly detects bottom position with 99%+ accuracy

**Message Likes**

- **SC-C01**: Like/unlike action reflects in UI within 100ms (optimistic update + confirmation)
- **SC-C02**: Like counts are accurate across all connected clients (no count drift)
- **SC-C03**: Self-like prevention toast appears within 200ms

**Emoji Reactions**

- **SC-D01**: Reaction picker opens within 150ms of click
- **SC-D02**: Reaction counts update across all clients within 100ms
- **SC-D03**: User's own reactions are visually distinct with 100% reliability

**System Messages**

- **SC-E01**: Connect/disconnect events persisted within same transaction as connection state change
- **SC-E02**: System messages visible to all clients within 100ms
- **SC-E03**: System message queries use indexed lookups (no iter() in views)

**User Presence & Sessions**

- **SC-F01**: Online/offline status updates within 500ms of connection state change
- **SC-F02**: Session widget updates "connected for" display every second with <100ms drift
- **SC-F03**: Session data restricted to authenticated user only (verified via view security)

**Accessibility Compliance**

- **SC-G01**: 100% of text elements pass WCAG AAA contrast checker (7:1 for large text, 4.5:1 for small)
- **SC-G02**: Application scores 100/100 on Lighthouse Accessibility audit
- **SC-G03**: All interactive elements have minimum 44x44px touch targets (mobile)
- **SC-G04**: Keyboard navigation reaches all interactive elements with visible focus indicators

**Visual Consistency**

- **SC-G05**: Zero hardcoded hex colors in component files (grep audit passes)
- **SC-G06**: All spacing uses tokens (no arbitrary px/rem values except in theme.css)
- **SC-G07**: 95%+ of users identify the application as having "consistent design" in feedback survey
- **SC-G08**: Visual regression tests pass with <5px tolerance across page transitions

**Performance**

- **SC-G09**: Theme token CSS loads in <50ms (minified and gzipped)
- **SC-G10**: CSS paint time for theme application <16ms (60fps threshold)
- **SC-G11**: No JavaScript required for theme rendering (pure CSS solution)
- **SC-G12**: Hover/focus state transitions complete within 150-300ms window

**User Comfort**

- **SC-G13**: 80%+ of users report "comfortable for extended use" in usability testing
- **SC-G14**: Eye strain complaints decrease by 50% compared to baseline (if measuring)
- **SC-G15**: User session duration increases by 20%+ (indicating improved comfort)
- **SC-G16**: Net Promoter Score (NPS) for UI quality increases to 8+/10

**Developer Experience**

- **SC-G17**: New components can be styled using theme tokens without touching theme.css
- **SC-G18**: Dark/light mode toggle can be added with <10 lines of code change
- **SC-G19**: Design system documentation exists with visual examples of all tokens
- **SC-G20**: Component style inconsistencies can be identified with automated linting

**Streamer Profile**

- **SC-H01**: Profile loads and displays all components (avatar, bio, links, schedule) within 500ms
- **SC-H02**: Default Rosie the Riveter avatar renders for 100% of users without uploaded avatar
- **SC-H03**: Social platform links are valid and clickable with 100% reliability
- **SC-H04**: Online/offline indicator updates within 500ms of status change

**Stream Schedule**

- **SC-I01**: Schedule displays all 7 themed days with 100% accuracy
- **SC-I02**: Current day highlighting is visually distinct to 95%+ of users in testing
- **SC-I03**: Schedule updates reflect in UI within 2 seconds of admin save

**Stream Page & Video**

- **SC-J01**: Video placeholder maintains 16:9 aspect ratio across all viewport sizes
- **SC-J02**: Stream status indicator updates within 500ms (matches FR-J06)
- **SC-J03**: Chat switches between live/replay modes correctly 100% of the time based on stream status

**Moderation**

- **SC-K01**: Report button is visible and accessible within 3 clicks from any message
- **SC-K02**: Report submission completes within 1 second with confirmation feedback
- **SC-K03**: 100% of reports appear in admin moderation queue within 2 seconds

**Navigation & Notifications**

- **SC-L01**: Channel switching completes within 200ms with content update
- **SC-L02**: Unread indicators display within 500ms of new message arrival
- **SC-L03**: No false-positive unread indicators (0% error rate)
- **SC-L04**: Unread indicators clear immediately on channel view

## Assumptions

- SpacetimeDB v2.0.1+ is deployed and accessible
- SpacetimeAuth (OIDC) is configured with valid client credentials
- Users primarily use dark mode (default); light mode support deferred to future iteration
- Target browsers support CSS custom properties (95%+ browser coverage)
- Primary use case is desktop/tablet; mobile responsive but not mobile-first
- English language only (font stack optimized for Latin characters)
- Accessibility targets WCAG 2.1 AAA for text contrast, AA for other criteria
- Feature flags (`ENABLE_MESSAGE_LIKES`, `ENABLE_EMOJI_REACTIONS`) control feature visibility

## Out of Scope

- **Video streaming/playback** (live streams, VOD, embeds, player controls) - deferred to future spec; static image placeholder used
- Multiple OAuth2 providers beyond SpacetimeAuth (future extensibility designed in)
- Private/direct messaging between users
- Message editing or deletion
- File attachments or media sharing
- Message threading or conversation threading
- Channel creation/management UI (backend support only)
- Dynamic theme switching UI (picker component) - foundation only
- Animation choreography beyond simple transitions
- Custom focus indicator shapes (using browser default with color override)
- Print stylesheet optimization
- High contrast mode specific overrides (relies on browser defaults)
- RTL (right-to-left) language support
