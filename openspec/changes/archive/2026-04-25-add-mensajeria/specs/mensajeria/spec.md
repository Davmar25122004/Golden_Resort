## ADDED Requirements

### Requirement: Auto-creation of client conversation

When a user gains the `ROLE_CLIENTE` role, the system SHALL ensure exactly one `conversacion` row exists for that user, without any explicit user action and without duplicating existing rows.

#### Scenario: New client confirms email

- **WHEN** a new user completes email verification and is granted `ROLE_CLIENTE`
- **THEN** the system creates one `conversacion` row with `cliente_id` referencing that user

#### Scenario: New client signs in via Google OAuth for the first time

- **WHEN** an OAuth user authenticates for the first time and is granted `ROLE_CLIENTE`
- **THEN** the system creates one `conversacion` row for that user

#### Scenario: Existing client without conversation at startup

- **WHEN** the application starts and finds clients with `ROLE_CLIENTE` but no row in `conversacion`
- **THEN** the system backfills one `conversacion` per missing client exactly once

#### Scenario: Auto-creation does not duplicate

- **WHEN** the auto-creation logic runs for a client that already has a `conversacion`
- **THEN** the system does not create a duplicate row

### Requirement: Single conversation per client

The `conversacion` table SHALL enforce a UNIQUE constraint on `cliente_id` so that each client has at most one conversation.

#### Scenario: Database rejects duplicate

- **WHEN** an attempt is made to insert a second `conversacion` row for an existing `cliente_id`
- **THEN** the database rejects the insert with a unique constraint violation and the API returns 409 or surfaces the error appropriately

### Requirement: Client reads own conversation

An authenticated client SHALL be able to retrieve their conversation with the full message history sorted by `creado_en` ascending.

#### Scenario: Authenticated client requests their conversation

- **WHEN** a client calls `GET /api/mensajeria/mi-conversacion`
- **THEN** the system responds 200 with the conversation metadata and the array of messages ordered chronologically

#### Scenario: Unauthenticated request to client endpoint

- **WHEN** an unauthenticated request hits `GET /api/mensajeria/mi-conversacion`
- **THEN** the system responds 401 and returns no data

#### Scenario: Client cannot read another client's conversation

- **WHEN** any non-staff user attempts to retrieve conversation data scoped to a different `cliente_id`
- **THEN** no API path exposes another client's conversation; the only client-facing endpoint resolves the conversation from the authenticated principal

### Requirement: Client sends message

An authenticated client SHALL be able to append a text message to their own conversation by `POST /api/mensajeria/mi-conversacion/mensajes` with a JSON body containing `texto`.

#### Scenario: Successful client message

- **WHEN** a client posts a `texto` of 1 to 2000 characters
- **THEN** the system persists the message with `autor_rol = 'CLIENTE'`, sets `autor_id` to the authenticated user, increments `no_leidos_recepcion` by 1, updates `ultima_actividad` to NOW, and responds 200 with the created message including its `id` and `creado_en`

#### Scenario: Empty or whitespace-only message

- **WHEN** the `texto` is null, empty or contains only whitespace
- **THEN** the system responds 400 and does not create a message

#### Scenario: Oversized message

- **WHEN** the `texto` exceeds 2000 characters
- **THEN** the system responds 400 and does not create a message

### Requirement: Recepcionist sends message

A user with `ROLE_RECEPCION` or `ROLE_ADMIN` SHALL be able to append a message to any client's conversation by `POST /api/mensajeria/recepcion/conversaciones/{id}/mensajes`.

#### Scenario: Successful staff reply

- **WHEN** a staff user posts a `texto` of 1 to 2000 characters to an existing conversation id
- **THEN** the system persists the message with `autor_rol = 'RECEPCION'`, sets `autor_id` to the staff user, increments `no_leidos_cliente` by 1, updates `ultima_actividad` to NOW, and responds 200

#### Scenario: Conversation not found

- **WHEN** a staff user posts to a non-existent `{id}`
- **THEN** the system responds 404

### Requirement: Per-user rate limit on outgoing messages

The system SHALL enforce a per-user rate limit of at most 20 messages within any rolling 10 second window, applied to both client and staff endpoints.

#### Scenario: Within the limit

- **WHEN** a user has sent up to 20 messages in the previous 10 seconds
- **THEN** each message is accepted

#### Scenario: Exceeding the limit

- **WHEN** a user attempts a 21st message within the same 10 second rolling window
- **THEN** the system responds 429 Too Many Requests and does not persist the message

#### Scenario: Window slides

- **WHEN** more than 10 seconds elapse since the user's earliest message in the window
- **THEN** the user can send again according to the same rule

### Requirement: Recepcionist lists all conversations

A user with `ROLE_RECEPCION` or `ROLE_ADMIN` SHALL be able to retrieve a list of conversations summarizing each client and their unread count for staff.

#### Scenario: Staff requests inbox

- **WHEN** a staff user calls `GET /api/mensajeria/recepcion/conversaciones`
- **THEN** the system responds 200 with an array ordered by `ultima_actividad` descending; each item includes the conversation `id`, `cliente_id`, client email, client name, `no_leidos_recepcion`, `ultima_actividad`, and a preview of the last message

#### Scenario: Non-staff user accesses inbox

- **WHEN** a client without staff role calls the same endpoint
- **THEN** the system responds 403

### Requirement: Recepcionist reads any conversation

A staff user SHALL be able to fetch the full message history of any client's conversation, and opening the conversation SHALL reset `no_leidos_recepcion` to zero.

#### Scenario: Staff opens a conversation

- **WHEN** a staff user calls `GET /api/mensajeria/recepcion/conversaciones/{id}`
- **THEN** the system responds 200 with all messages chronologically and sets `no_leidos_recepcion` to 0 for that conversation

#### Scenario: Conversation not found

- **WHEN** a staff user requests a non-existent `{id}`
- **THEN** the system responds 404

### Requirement: Read counters track unread messages

The `conversacion` row SHALL maintain `no_leidos_cliente` and `no_leidos_recepcion`, each incremented when the opposite side adds a message and reset to zero when the same side opens the conversation.

#### Scenario: Counter increments on client message

- **WHEN** a client sends a message
- **THEN** `no_leidos_recepcion` increases by 1 and `no_leidos_cliente` is unchanged

#### Scenario: Counter increments on staff message

- **WHEN** a staff user sends a message
- **THEN** `no_leidos_cliente` increases by 1 and `no_leidos_recepcion` is unchanged

#### Scenario: Recepcion counter resets on staff read

- **WHEN** a staff user opens a conversation via the GET endpoint
- **THEN** `no_leidos_recepcion` becomes 0

#### Scenario: Cliente counter resets on client read

- **WHEN** a client calls `POST /api/mensajeria/mi-conversacion/leer` (or implicitly via the read GET endpoint)
- **THEN** `no_leidos_cliente` becomes 0

### Requirement: Cliente 360 view for staff

A staff user SHALL be able to retrieve aggregated information about a client containing email, name, registration date, current stays, upcoming reservations, count and total of past reservations, completed payments and saved payment methods.

#### Scenario: Staff requests client information

- **WHEN** a staff user calls `GET /api/mensajeria/recepcion/cliente/{id}/ficha`
- **THEN** the system responds 200 with the aggregate object including the listed fields

#### Scenario: Past data is bounded

- **WHEN** the client has many historical reservations or payments
- **THEN** the response limits the most recent items shown (top N) and includes counts and totals to avoid unbounded responses

#### Scenario: Non-staff user requests ficha

- **WHEN** a non-staff user calls the ficha endpoint
- **THEN** the system responds 403

### Requirement: Unread badge in staff navbar

The navigation bar SHALL display a bell icon with a numeric badge for users with `ROLE_RECEPCION` or `ROLE_ADMIN`, showing the total unread messages summed across all conversations; clicking the bell SHALL navigate to `/mensajeria`.

#### Scenario: Staff with unread messages

- **WHEN** a staff user loads any page and three conversations each contain one unread message
- **THEN** the navbar bell shows a badge with value 3

#### Scenario: No unread messages

- **WHEN** all conversations have `no_leidos_recepcion` equal to 0
- **THEN** the badge is hidden

#### Scenario: Non-staff user

- **WHEN** a client without staff role loads the page
- **THEN** the bell icon is not displayed

#### Scenario: Badge updates via polling

- **WHEN** the staff page remains visible and 5 seconds elapse
- **THEN** the frontend calls `GET /api/mensajeria/recepcion/no-leidos` and updates the badge from the response

### Requirement: Unread indicator in client profile

The client profile UI SHALL show an unread indicator on the Mensajes tab when `no_leidos_cliente` is greater than zero; opening the tab SHALL clear the indicator.

#### Scenario: Indicator visible

- **WHEN** the client has unread messages and opens `/perfil`
- **THEN** the Mensajes menu item displays an unread visual mark

#### Scenario: Indicator cleared on open

- **WHEN** the client opens the Mensajes tab
- **THEN** the system marks the conversation as read for the client and the indicator disappears

### Requirement: Messages are immutable

The system SHALL not expose endpoints to modify or delete an existing message; once persisted, content cannot be changed.

#### Scenario: No edit endpoint

- **WHEN** any user attempts PUT or PATCH against a message id under any messaging path
- **THEN** the system has no such mapping and responds 404 or 405

#### Scenario: No delete endpoint

- **WHEN** any user attempts DELETE against a message id under any messaging path
- **THEN** the system has no such mapping and responds 404 or 405

### Requirement: Polling refresh strategy

The frontend SHALL refresh messaging data by polling REST endpoints; the client polls every 8 seconds and staff polls every 5 seconds, only while the page is visible.

#### Scenario: Client tab visible

- **WHEN** the client has the Mensajes tab open and the browser tab is visible
- **THEN** the JS calls `GET /api/mensajeria/mi-conversacion` every 8 seconds

#### Scenario: Staff page visible

- **WHEN** the staff has `/mensajeria` open and the browser tab is visible
- **THEN** the JS refreshes inbox and the open chat every 5 seconds

#### Scenario: Tab hidden

- **WHEN** the user switches to another browser tab
- **THEN** polling pauses; it resumes when the tab regains visibility

### Requirement: Endpoint authorization

Messaging endpoints SHALL be secured by Spring Security: client endpoints require authentication; staff endpoints require `ROLE_ADMIN` or `ROLE_RECEPCION`.

#### Scenario: Anonymous request to client endpoint

- **WHEN** an unauthenticated request reaches `/api/mensajeria/mi-*`
- **THEN** the system responds 401

#### Scenario: Client request to staff endpoint

- **WHEN** a user without staff role calls `/api/mensajeria/recepcion/**`
- **THEN** the system responds 403

#### Scenario: Staff request to staff endpoint

- **WHEN** a user with `ROLE_RECEPCION` or `ROLE_ADMIN` calls a staff endpoint
- **THEN** the request is allowed

### Requirement: No attachments in v1

The messaging API SHALL accept only text content; multipart payloads and URLs to externally hosted files SHALL not be processed by the message endpoints in v1.

#### Scenario: Client posts multipart body

- **WHEN** a client posts `multipart/form-data` to a message creation endpoint
- **THEN** the system rejects with 415 or 400; only `application/json` with the `texto` field is accepted

### Requirement: Additive change preserves existing flows

Adding messaging SHALL be purely additive: no existing table column, controller method, security rule or template is modified in a way that changes prior observable behavior.

#### Scenario: Existing reservation flow unchanged

- **WHEN** a client books a room and pays without ever opening Mensajes
- **THEN** the booking, payment and email flows behave exactly as before this change

#### Scenario: Existing role assignment unchanged

- **WHEN** a new user registers
- **THEN** they still receive `ROLE_CLIENTE` exactly as today; the only addition is the auto-creation of their `conversacion` row

#### Scenario: Existing recepcion panel unchanged

- **WHEN** a recepcionist navigates to `/recepcion`
- **THEN** the panel renders the same llegadas, en estancia, salidas, walk-in and notes features as before this change
