## ADDED Requirements

### Requirement: Admin puede ver la lista de usuarios registrados
El sistema SHALL proveer `GET /api/admin/usuarios` accesible solo para `ROLE_ADMIN`. Devuelve la lista de todos los usuarios con: `id`, `nombre`, `email` y `rol` (nombre del rol principal). No incluye contraseñas.

#### Scenario: Admin lista usuarios
- **WHEN** un usuario ADMIN hace GET /api/admin/usuarios
- **THEN** el sistema devuelve 200 OK con la lista de usuarios sin exponer passwords

#### Scenario: Cliente no puede listar usuarios
- **WHEN** un usuario ROLE_CLIENTE hace GET /api/admin/usuarios
- **THEN** el sistema devuelve 403 Forbidden

### Requirement: El panel admin muestra usuarios en tabla de solo lectura
El frontend SHALL mostrar en el tab "Usuarios" una tabla con nombre, email y rol de cada usuario. No SHALL haber controles de edición ni cambio de rol — es una vista informativa únicamente.

#### Scenario: Admin ve la lista de usuarios
- **WHEN** el admin hace clic en el tab "Usuarios"
- **THEN** el sistema muestra la tabla con todos los usuarios registrados y sus roles
