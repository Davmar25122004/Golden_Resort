## Why

El sistema de reservas tiene el modelo de dominio para servicios adicionales (`Servicio`, `ReservaServicio`) pero ninguna capa de acceso ni interfaz los expone. Los huéspedes no pueden agregar servicios (desayuno, spa, parking) a sus reservas, y los administradores no tienen forma de gestionar el catálogo.

## What Changes

- **Nuevo**: CRUD de servicios vía `/api/servicios` — solo admins pueden crear, editar y eliminar; cualquier usuario autenticado puede listar
- **Nuevo**: Al crear una reserva, el usuario puede incluir una lista de servicios con cantidad
- **Nuevo**: Endpoints para agregar/quitar servicios en una reserva existente
- **Modificado**: `ReservaDTO` incluye la lista de servicios contratados y el costo total calculado
- **Nuevo**: Frontend muestra servicios disponibles con precio en el flujo de reserva y en "mis reservas"

## Capabilities

### New Capabilities

- `catalogo-servicios`: CRUD de servicios del hotel, acceso de escritura restringido a ADMIN
- `servicios-en-reserva`: Asociar servicios con cantidad a una reserva (al crear y post-creación), con cálculo de total

### Modified Capabilities

- (ninguna)

## Impact

- **Nuevos archivos**: `ServicioRepository`, `ServicioController`, `ReservaServicioRepository`
- **Modificados**: `ReservaController` (crear reserva, nuevos endpoints), `ReservaDTO` (servicios + total), `app.js` (UI flujo de reserva y mis-reservas)
- **Seguridad**: Usar `@PreAuthorize("hasRole('ADMIN')")` para operaciones de escritura sobre servicios; `@EnableMethodSecurity` ya está activo en `SecurityConfig`
- **Sin breaking changes** en endpoints existentes
