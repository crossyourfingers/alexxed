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
- **AND** system messages (join/leave) are distinguished from user messages

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
- **AND** a system message announces the user joined

#### Scenario: User disconnects
- **GIVEN** a user is currently online
- **WHEN** the user disconnects
- **THEN** the user moves to the "Offline" list
- **AND** a system message announces the user left

### Requirement: User List Display
The system SHALL display separate lists of online and offline users.

#### Scenario: View user lists
- **WHEN** viewing the chat interface
- **THEN** online users are listed in an "Online" section
- **AND** offline users are listed in an "Offline" section
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
The system SHALL display system messages in a subtle, unobtrusive style.

#### Scenario: View system messages
- **GIVEN** system messages exist (join/leave notifications)
- **WHEN** viewing the message list
- **THEN** system messages appear in small, centered, gray text
- **AND** system messages are visually distinct from user messages

### Requirement: YouTube Video Embedding
The system SHALL allow embedding YouTube videos in the sidebar.

#### Scenario: Embed YouTube video
- **GIVEN** a user has a YouTube video URL
- **WHEN** the user pastes the URL in the YouTube embed input
- **THEN** the video player appears below the offline users list
- **AND** the player supports standard YouTube embed features

#### Scenario: Invalid YouTube URL
- **GIVEN** the YouTube URL input contains invalid text
- **WHEN** viewing the sidebar
- **THEN** no video player is displayed

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
