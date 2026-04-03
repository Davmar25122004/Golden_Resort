## ADDED Requirements

### Requirement: Admin puede crear servicios
El sistema SHALL proveer `POST /api/servicios` accesible solo para `ROLE_ADMIN`. El body SHALL incluir `nombre` (único) y `precio`. Devuelve 201 Created con el servicio creado.

#### Scenario: Admin crea un servicio válido
- **WHEN** un usuario ADMIN hace POST /api/servicios con nombre y precio válidos
- **THEN** el sistema persiste el servicio y devuelve 201

#### Scenario: Nombre de servicio duplicado
- **WHEN** un usuario ADMIN hace POST /api/servicios con un nombre ya existente
- **THEN** el sistema devuelve 409 Conflict

#### Scenario: Cliente no puede crear servicios
- **WHEN** un usuario ROLE_CLIENTE hace POST /api/servicios
- **THEN** el sistema devuelve 403 Forbidden

### Requirement: Admin puede editar servicios
El sistema SHALL proveer `PUT /api/servicios/{id}` accesible solo para `ROLE_ADMIN`. Permite actualizar `nombre` y `precio`. Devuelve 200 OK o 404 si no existe.

#### Scenario: Admin edita el precio de un servicio
- **WHEN** un usuario ADMIN hace PUT /api/servicios/{id} con nuevo precio
- **THEN** el sistema actualiza el precio y devuelve 200 con el servicio actualizado

### Requirement: Admin puede eliminar servicios
El sistema SHALL proveer `DELETE /api/servicios/{id}` accesible solo para `ROLE_ADMIN`. Devuelve 204 si se elimina correctamente o 404 si no existe. No elimina en cascada las referencias históricas en `reserva_servicio`.

#### Scenario: Admin elimina un servicio existente
- **WHEN** un usuario ADMIN hace DELETE /api/servicios/{id} con id válido
- **THEN** el sistema elimina el servicio y devuelve 204

#### Scenario: Admin elimina servicio inexistente
- **WHEN** un usuario ADMIN hace DELETE /api/servicios/{id} con id no existente
- **THEN** el sistema devuelve 404

### Requirement: El panel admin gestiona servicios con CRUD visual
El frontend SHALL mostrar en el tab "Servicios" una tabla con todos los servicios (nombre, precio) y botones "Editar" y "Eliminar" por fila, más un botón "Nuevo Servicio". Crear y editar SHALL usar un modal con formulario.

#### Scenario: Admin edita un servicio desde el panel
- **WHEN** el admin abre el modal de edición, cambia el precio y guarda
- **THEN** el precio actualizado aparece en la tabla sin recargar la página
