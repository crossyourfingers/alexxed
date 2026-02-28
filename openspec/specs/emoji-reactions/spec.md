# Emoji Reactions Specification

## Reactions

### Requirement: Add Reaction
The system SHALL allow authenticated users to add emoji reactions to any message.

#### Scenario: Add reaction to a message
- **GIVEN** a message exists in the chat
- **WHEN** the user selects an emoji from the reaction picker
- **THEN** the reaction is recorded with the message timestamp, user identity, and emoji
- **AND** all connected clients see the updated reaction count in real-time

#### Scenario: Add reaction to own message
- **GIVEN** a message sent by the current user
- **WHEN** the user adds a reaction to their own message
- **THEN** the reaction is recorded normally (self-reactions are allowed)

### Requirement: Remove Reaction
The system SHALL allow users to remove their own reactions.

#### Scenario: Remove existing reaction
- **GIVEN** the user has reacted to a message with a specific emoji
- **WHEN** the user clicks the same emoji reaction again
- **THEN** the reaction is removed
- **AND** all connected clients see the updated reaction count

### Requirement: Reaction Aggregation
The system SHALL display reactions grouped by emoji with counts.

#### Scenario: View aggregated reactions
- **GIVEN** multiple users have reacted to a message
- **WHEN** viewing the message
- **THEN** reactions are displayed grouped by emoji
- **AND** each emoji shows the total count of users who reacted with it

#### Scenario: Highlight own reactions
- **GIVEN** the user has reacted to a message
- **WHEN** viewing the message
- **THEN** the user's own reactions are visually highlighted

### Requirement: Reaction Picker
The system SHALL provide a UI to select reaction emojis.

#### Scenario: Open reaction picker
- **WHEN** the user clicks the reaction button on a message
- **THEN** a picker appears showing available emojis: 👍 ❤️ 😂 😮 😢 🎉

#### Scenario: Quick react via existing reaction
- **GIVEN** a message has existing reactions
- **WHEN** the user clicks an existing reaction emoji
- **THEN** the user's reaction is toggled for that emoji (add if not present, remove if present)

### Requirement: Reaction Feature Toggle
The system MUST allow emoji reactions to be disabled via configuration flag.

#### Scenario: Reactions disabled
- **GIVEN** ENABLE_EMOJI_REACTIONS is set to false
- **WHEN** viewing messages
- **THEN** reaction buttons and existing reactions are not displayed
