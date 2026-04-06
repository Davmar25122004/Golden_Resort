## ADDED Requirements

### Requirement: Admin puede ver todas las reservas del hotel
El sistema SHALL proveer `GET /api/reservas` que, cuando es llamado por un usuario con `ROLE_ADMIN`, devuelva todas las reservas de todos los clientes. Cada reserva SHALL incluir: id, fechaEntrada, fechaSalida, nombre y email del cliente, número y tipo de habitación, precio por noche y lista de servicios contratados.

#### Scenario: Admin lista todas las reservas
- **WHEN** un usuario con ROLE_ADMIN hace GET /api/reservas
- **THEN** el sistema devuelve 200 OK con la lista completa de reservas enriquecidas

#### Scenario: Cliente solo ve sus propias reservas
- **WHEN** un usuario con ROLE_CLIENTE hace GET /api/reservas
- **THEN** el sistema devuelve solo las reservas pertenecientes a ese usuario

### Requirement: Admin puede cancelar cualquier reserva
El sistema SHALL permitir a un usuario con `ROLE_ADMIN` eliminar cualquier reserva mediante `DELETE /api/reservas/{id}`. La eliminación SHALL borrar también los registros de `reserva_servicio` asociados a esa reserva (en cascada).

#### Scenario: Admin cancela una reserva existente
- **WHEN** un usuario con ROLE_ADMIN hace DELETE /api/reservas/{id} con un id válido
- **THEN** el sistema elimina la reserva y sus servicios asociados y devuelve 204 No Content

#### Scenario: Admin intenta cancelar una reserva inexistente
- **WHEN** un usuario con ROLE_ADMIN hace DELETE /api/reservas/{id} con un id que no existe
- **THEN** el sistema devuelve 404 Not Found

#### Scenario: Cliente no puede cancelar reservas de otros usuarios
- **WHEN** un usuario con ROLE_CLIENTE hace DELETE /api/reservas/{id} de una reserva que no le pertenece
- **THEN** el sistema devuelve 403 Forbidden

### Requirement: El panel admin muestra las reservas en una tabla
El frontend SHALL mostrar en el tab "Reservas" una tabla con todas las reservas que incluya cliente, habitación, fechas y un botón "Cancelar" por fila. Al cancelar SHALL pedir confirmación antes de ejecutar el DELETE.

#### Scenario: Admin cancela reserva desde el panel
- **WHEN** el admin hace clic en "Cancelar" en una fila y confirma
- **THEN** la reserva desaparece de la tabla sin recargar la página
