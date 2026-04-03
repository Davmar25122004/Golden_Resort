## ADDED Requirements

### Requirement: Listar servicios disponibles
El sistema SHALL exponer un endpoint público (para usuarios autenticados) que devuelva todos los servicios del catálogo con su nombre y precio.

#### Scenario: Usuario lista servicios
- **WHEN** un usuario autenticado hace GET /api/servicios
- **THEN** el sistema retorna 200 con la lista de servicios (id, nombre, precio)

#### Scenario: Sin servicios registrados
- **WHEN** un usuario autenticado hace GET /api/servicios y el catálogo está vacío
- **THEN** el sistema retorna 200 con una lista vacía

### Requirement: Crear servicio (solo ADMIN)
El sistema SHALL permitir a usuarios con rol ADMIN crear nuevos servicios en el catálogo.

#### Scenario: Admin crea servicio exitosamente
- **WHEN** un admin hace POST /api/servicios con nombre y precio válidos
- **THEN** el sistema persiste el servicio y retorna 200 con el servicio creado

#### Scenario: Usuario sin rol ADMIN intenta crear servicio
- **WHEN** un usuario sin rol ADMIN hace POST /api/servicios
- **THEN** el sistema retorna 403 Forbidden

#### Scenario: Nombre duplicado
- **WHEN** un admin hace POST /api/servicios con un nombre ya existente
- **THEN** el sistema retorna 400 Bad Request

### Requirement: Actualizar servicio (solo ADMIN)
El sistema SHALL permitir a usuarios con rol ADMIN modificar el nombre y/o precio de un servicio existente.

#### Scenario: Admin actualiza servicio exitosamente
- **WHEN** un admin hace PUT /api/servicios/{id} con datos válidos
- **THEN** el sistema actualiza el servicio y retorna 200 con el servicio actualizado

#### Scenario: Servicio no encontrado
- **WHEN** un admin hace PUT /api/servicios/{id} con un id inexistente
- **THEN** el sistema retorna 404 Not Found

#### Scenario: Usuario sin rol ADMIN intenta actualizar
- **WHEN** un usuario sin rol ADMIN hace PUT /api/servicios/{id}
- **THEN** el sistema retorna 403 Forbidden

### Requirement: Eliminar servicio (solo ADMIN)
El sistema SHALL permitir a usuarios con rol ADMIN eliminar un servicio del catálogo.

#### Scenario: Admin elimina servicio exitosamente
- **WHEN** un admin hace DELETE /api/servicios/{id} y el servicio existe
- **THEN** el sistema elimina el servicio y retorna 204 No Content

#### Scenario: Servicio no encontrado al eliminar
- **WHEN** un admin hace DELETE /api/servicios/{id} con un id inexistente
- **THEN** el sistema retorna 404 Not Found

#### Scenario: Usuario sin rol ADMIN intenta eliminar
- **WHEN** un usuario sin rol ADMIN hace DELETE /api/servicios/{id}
- **THEN** el sistema retorna 403 Forbidden
