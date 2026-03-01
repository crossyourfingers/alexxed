# Chat System Specification

## Core Messaging

### Requirement: Message Sending

The system SHALL allow authenticated users to send text messages to the chat.

#### Scenario: Send valid message

- **GIVEN** a user is authenticated
- **WHEN** the user submits a non-empty message
- **THEN** the message is stored with timestamp and sender identity
- **AND** all connected clients receive the message in real-time

### Requirement: Message Display

The system SHALL display messages in chronological order with sender information.

#### Scenario: View message history

- **GIVEN** messages exist in the system
- **WHEN** a user views the chat
- **THEN** messages are displayed showing sender name, text content, and timestamp
- **AND** user messages and system messages are distinguished with appropriate visual treatment

#### Scenario: System message styling

- **GIVEN** system messages exist (join/leave notifications)
- **WHEN** viewing the message list
- **THEN** system messages appear in a subtle style with muted text and smaller badge
- **AND** system messages are visually distinct from user messages but clearly identifiable
- **AND** system messages may include timestamps for temporal context

### Requirement: Auto-scroll Behavior

The system SHALL automatically scroll to show the most recent message.

#### Scenario: New message arrives

- **GIVEN** the user is scrolled to the bottom of the message list
- **WHEN** a new message arrives
- **THEN** the view automatically scrolls to show the new message

#### Scenario: User reads history

- **GIVEN** the user has scrolled up to read history
- **WHEN** a new message arrives
- **THEN** auto-scroll is paused to avoid interrupting reading
- **AND** auto-scroll resumes when user scrolls back to bottom

### Requirement: System Message Persistence

The system SHALL persist connection events as dedicated `system_message` rows with `sender: Identity.zero()` identity.

#### Scenario: Store connect event

- **GIVEN** a user successfully authenticates
- **WHEN** the connection is established
- **THEN** a system message is inserted with `messageType: 'connect'`, `sender: Identity.zero()`, and current timestamp
- **AND** the row is stored in the `system_message` table

#### Scenario: Store disconnect event

- **GIVEN** a user is currently online
- **WHEN** the user disconnects
- **THEN** a system message is inserted with `messageType: 'disconnect'`, `sender: Identity.zero()`, and current timestamp
- **AND** the row is stored in the `system_message` table

#### Scenario: All clients see system message

- **GIVEN** multiple users are connected in the same channel
- **WHEN** a new system message arrives
- **THEN** all clients receive the system message in real-time
- **AND** the message appears in each client's chat feed with appropriate styling

## Message Likes

### Requirement: Like Interactions

The system SHALL allow users to like messages from other users.

#### Scenario: Like another user's message

- **GIVEN** a message exists from another user
- **WHEN** the user clicks the like button
- **THEN** the like is recorded
- **AND** the like count increments immediately
- **AND** the button shows liked state

#### Scenario: Unlike a message

- **GIVEN** the user has already liked a message
- **WHEN** the user clicks the like button again
- **THEN** the like is removed
- **AND** the like count decrements
- **AND** the button shows unliked state

#### Scenario: Attempt to like own message

- **GIVEN** a message sent by the current user
- **WHEN** the user clicks the like button on their own message
- **THEN** a toast notification appears saying "nah, that's not cool"
- **AND** no like is recorded

### Requirement: Like Count Display

The system SHALL display the total number of likes for each message.

#### Scenario: View like count

- **GIVEN** a message with multiple likes
- **WHEN** viewing the message
- **THEN** the accurate like count is displayed next to the like button

### Requirement: Like Feature Toggle

The system MUST allow like feature to be disabled via configuration flag.

#### Scenario: Likes disabled

- **GIVEN** ENABLE_MESSAGE_LIKES is set to false
- **WHEN** viewing messages
- **THEN** like buttons are not displayed

## User Presence

### Requirement: Online Status

The system SHALL track and display which users are currently connected.

#### Scenario: User connects

- **GIVEN** a user authenticates successfully
- **WHEN** the connection is established
- **THEN** the user appears in the "Online" list
- **AND** a system message announces the user joined (persisted in `system_message` table)

#### Scenario: User disconnects

- **GIVEN** a user is currently online
- **WHEN** the user disconnects
- **THEN** the user moves to the "Offline" list
- **AND** a system message announces the user left (persisted in `system_message` table)

#### Scenario: System message visibility

- **GIVEN** a user connects in a specific chat channel
- **WHEN** the connect system message is created
- **THEN** the message includes the `channelId` for proper channel context
- **AND** all connected clients in that channel see the system message
- **AND** the system message is styled with muted text, smaller badge, and optional timestamp

### Requirement: User List Display

The system SHALL display separate lists of online and offline users.

#### Scenario: View user lists

- **WHEN** viewing the chat interface
- **THEN** online users are listed in an "Online" section
- **AND** offline users are listed in a "Offline" section
- **AND** users are identified by their username or identity

## Authentication

### Requirement: Authentication

The system SHALL authenticate users via SpacetimeAuth (OIDC).

#### Scenario: SpacetimeAuth login

- **GIVEN** a user is not authenticated
- **WHEN** the user opens the application
- **THEN** the user is redirected to SpacetimeAuth for OIDC authentication
- **AND** authentication tokens are managed via the OIDC flow

### Requirement: User Registration

The system SHALL allow authenticated users to set their display name.

#### Scenario: Set username

- **GIVEN** a user is authenticated
- **WHEN** the user submits a new username
- **THEN** the username is updated in the system
- **AND** future messages show the new username

### Requirement: Logout

The system SHALL allow users to logout via the OIDC signout flow.

#### Scenario: Logout

- **GIVEN** a user is authenticated via SpacetimeAuth
- **WHEN** the user clicks logout
- **THEN** the user is signed out via SpacetimeAuth signout endpoint

## User Experience

### Requirement: System Message Styling

The system SHALL display system messages in a consistent, visually distinctive style across all views.

#### Scenario: View system messages

- **GIVEN** system messages exist (join/leave notifications)
- **WHEN** viewing the message list on Community or Stream page
- **THEN** system messages appear with centered, inline-muted styling
- **AND** system messages use smaller badge compared to user messages
- **AND** system messages have adequate click/hit areas for interactive elements

#### Scenario: System message timestamps

- **GIVEN** a system message is displayed
- **WHEN** the message is rendered
- **THEN** appropriate timestamp display is provided for temporal context
- **AND** the timestamp format is consistent with user messages

#### Scenario: Visual feedback for interactive elements

- **GIVEN** a user interacts with community header items (header, navigation)
- **WHEN** the user hovers over the elements
- **THEN** appropriate hover states are applied
- **AND** the interactive elements have expanded hit areas to reduce cramping
- **AND** subtle animations enhance the user experience

### Requirement: UI Consistency

The system SHALL maintain consistent spacing and visual design across Community and Stream pages.

#### Scenario: Spacing token consistency

- **GIVEN** a component is rendered on Community or Stream page
- **WHEN** viewing the component
- **THEN** padding, margins, and gaps use the same spacing token values
- **AND** the `--space-*` token system is used across both themes

#### Scenario: Dark mode compatibility

- **GIVEN** dark mode is enabled
- **WHEN** viewing system messages or any component
- **THEN** appropriate CSS custom properties with dark mode fallbacks are defined
- **AND** the visual styling remains consistent and readable in dark mode

#### Scenario: MessageList rendering

- **GIVEN** system message rows exist in the data stream
- **WHEN** MessageList renders the feed
- **THEN** system messages are treated as a separate entity with dedicated markup
- **AND** user messages maintain their existing styling
- **AND** consecutive system messages may be visually grouped for readability

## Data Model

### Requirement: Message Persistence

The system SHALL persist messages in SpacetimeDB with immutable identifiers.

#### Scenario: Message storage

- **GIVEN** a user sends a message
- **WHEN** the message is stored
- **THEN** the message includes sender identity, text, and timestamp
- **AND** the timestamp is used as the unique identifier

### Requirement: User Persistence

The system SHALL persist user records with online status.

#### Scenario: User record

- **GIVEN** a user connects
- **WHEN** the user record is created or updated
- **THEN** the record includes identity, username, and online status

### Requirement: Like Persistence

The system SHALL persist message likes with user and message association.

#### Scenario: Like storage

- **GIVEN** a user likes a message
- **WHEN** the like is stored
- **THEN** the like record includes user identity and message timestamp
- **AND** duplicate likes for the same user/message are prevented

### Requirement: System Message Persistence

The system SHALL persist system messages in SpacetimeDB with appropriate indexing.

#### Scenario: System message storage

- **GIVEN** a system message of any type is created
- **WHEN** the message is inserted
- **THEN** the system message includes `sender: Identity.zero()`, `messageType`, `channelId`, and `createdAt`
- **AND** the message is stored in the `system_message` table with proper indexing
- **AND** the server maintains sender attribution through `Identity.zero()` convention
