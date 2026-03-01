# System Messages Specification

## Persistent Connection Events

### Requirement: System Message Storage

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

### Requirement: System Message Content

The system SHALL include contextual information in system messages to improve user understanding.

#### Scenario: Message includes channel context

- **GIVEN** a user connects in a specific chat channel
- **WHEN** the connect system message is created
- **THEN** the message includes the `channelId`

#### Scenario: Message timing

- **GIVEN** a system message of any type
- **WHEN** the message is stored
- **THEN** the message includes a `createdAt` timestamp in microsecond resolution
- **AND** the timestamp reflects the server-side insertion time

### Requirement: Public System Messages

The system SHALL expose all `system_message` rows to all connected clients for real-time viewing.

#### Scenario: All clients see connect event

- **GIVEN** multiple users are connected in the same channel
- **WHEN** a new user joins
- **THEN** all clients receive the connect system message in real-time
- **AND** the message appears in each client's chat feed

#### Scenario: All clients see disconnect event

- **GIVEN** multiple users are connected in the same channel
- **WHEN** a user disconnects
- **THEN** all clients receive the disconnect system message in real-time
- **AND** the message appears in each client's chat feed

### Requirement: System Message Querying

The system SHALL support efficient querying of system messages for subscription filtering.

#### Scenario: Query by channel

- **GIVEN** system messages for multiple channels exist
- **WHEN** subscribing to a specific channel's chat
- **THEN** subscription queries should use indexed lookups or views
- **AND** the query should be efficient without full table scanning

#### Scenario: Query by message type

- **GIVEN** system messages of different types exist
- **WHEN** filtering for specific message types (e.g., only 'connect')
- **THEN** queries should support type filtering for targeted subscriptions
- **AND** filtering should not prevent real-time updates

### Requirement: System Message Update and Deletion

The system SHALL support proper transactional handling of system messages.

#### Scenario: System message persistence

- **GIVEN** a system message has been inserted
- **WHEN** the database transaction completes
- **THEN** the system message is permanently stored and cannot be altered
- **AND** deletion should only apply to system messages matching specific criteria
