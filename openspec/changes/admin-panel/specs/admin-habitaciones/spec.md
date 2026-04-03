## ADDED Requirements

### Requirement: Admin puede crear habitaciones
El sistema SHALL proveer `POST /api/habitaciones` accesible solo para `ROLE_ADMIN`. El body SHALL incluir: `numero` (único), `tipo` (NORMAL|DOBLE|SUITE|LUJO), `precioNoche` y `descripcion` (opcional). El sistema SHALL devolver 201 Created con la habitación creada.

#### Scenario: Admin crea una habitación válida
- **WHEN** un usuario ADMIN hace POST /api/habitaciones con datos válidos
- **THEN** el sistema persiste la habitación y devuelve 201 con el objeto creado

#### Scenario: Número de habitación duplicado
- **WHEN** un usuario ADMIN hace POST /api/habitaciones con un número ya existente
- **THEN** el sistema devuelve 409 Conflict

#### Scenario: Cliente no puede crear habitaciones
- **WHEN** un usuario ROLE_CLIENTE hace POST /api/habitaciones
- **THEN** el sistema devuelve 403 Forbidden

### Requirement: Admin puede editar habitaciones
El sistema SHALL proveer `PUT /api/habitaciones/{id}` accesible solo para `ROLE_ADMIN`. Permite actualizar `numero`, `tipo`, `precioNoche` y `descripcion`. Devuelve 200 OK con la habitación actualizada o 404 si no existe.

#### Scenario: Admin edita el precio de una habitación
- **WHEN** un usuario ADMIN hace PUT /api/habitaciones/{id} con nuevo precioNoche
- **THEN** el sistema actualiza el precio y devuelve 200 con los datos actualizados

### Requirement: Admin puede eliminar habitaciones con cancelación en cascada
El sistema SHALL proveer `DELETE /api/habitaciones/{id}` accesible solo para `ROLE_ADMIN`. La operación SHALL ejecutarse de forma atómica (`@Transactional`) en este orden:
1. Eliminar todos los `reserva_servicio` de las reservas de esa habitación
2. Eliminar todas las `reserva` de esa habitación
3. Eliminar la habitación

Si la habitación no existe SHALL devolver 404.

#### Scenario: Admin elimina habitación sin reservas
- **WHEN** un usuario ADMIN hace DELETE /api/habitaciones/{id} y la habitación no tiene reservas
- **THEN** el sistema elimina solo la habitación y devuelve 204

#### Scenario: Admin elimina habitación con reservas activas
- **WHEN** un usuario ADMIN hace DELETE /api/habitaciones/{id} y la habitación tiene reservas
- **THEN** el sistema elimina reserva_servicio, reservas y habitación en una transacción y devuelve 204

#### Scenario: Admin elimina habitación inexistente
- **WHEN** un usuario ADMIN hace DELETE /api/habitaciones/{id} con id no existente
- **THEN** el sistema devuelve 404

### Requirement: El panel admin gestiona habitaciones con CRUD visual
El frontend SHALL mostrar en el tab "Habitaciones" una tabla con todas las habitaciones y botones "Editar" y "Eliminar" por fila, más un botón "Nueva Habitación". Crear y editar SHALL usar un modal con formulario. Eliminar SHALL pedir confirmación indicando que se cancelarán las reservas asociadas.

#### Scenario: Admin crea habitación desde el panel
- **WHEN** el admin completa el formulario modal y envía
- **THEN** la nueva habitación aparece en la tabla sin recargar la página

#### Scenario: Admin elimina habitación con reservas
- **WHEN** el admin hace clic en "Eliminar" y confirma el aviso de cancelación de reservas
- **THEN** la habitación desaparece de la tabla
