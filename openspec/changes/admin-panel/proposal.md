## Why

El panel de administración de Hotel DAW está vacío (`showAdmin()` devuelve "Pendiente de backend"). Los administradores no tienen forma de gestionar reservas, habitaciones, servicios ni ver métricas del hotel desde la aplicación — todo se hace directamente en base de datos.

## What Changes

- **Nuevo**: Dashboard de métricas (reservas hoy/mes, ingresos totales, ocupación, próximas llegadas)
- **Nuevo**: Gestión de reservas — el admin puede ver y cancelar cualquier reserva de cualquier cliente
- **Nuevo**: CRUD de habitaciones — crear, editar y eliminar (el delete cancela reservas asociadas en cascada)
- **Nuevo**: CRUD de servicios — crear, editar y eliminar
- **Nuevo**: Listado de usuarios (solo lectura: nombre, email, rol)
- **Nuevo**: `AdminController` con endpoints `/api/admin/stats` y `/api/admin/usuarios`
- **Modificado**: `HabitacionController` — añade POST, PUT, DELETE protegidos por ROLE_ADMIN
- **Modificado**: `ServicioController` — añade POST, PUT, DELETE protegidos por ROLE_ADMIN
- **Modificado**: `ReservaController` — el GET devuelve todas las reservas con datos enriquecidos; añade DELETE para admin
- **Modificado**: `SecurityConfig` — nuevas reglas de autorización para endpoints de admin
- **Modificado**: `showAdmin()` en app.js — panel completo con 5 tabs

## Capabilities

### New Capabilities

- `admin-dashboard`: Métricas del hotel en tiempo real (reservas, ingresos, ocupación, próximas llegadas)
- `admin-reservas`: Visualización y cancelación de reservas de cualquier cliente por parte del admin
- `admin-habitaciones`: CRUD completo de habitaciones con eliminación en cascada de reservas
- `admin-servicios`: CRUD completo de servicios del hotel
- `admin-usuarios`: Listado de usuarios registrados con su rol (solo lectura)

### Modified Capabilities

<!-- No hay specs existentes en openspec/specs/ — todos son capabilities nuevos -->

## Impact

- **Backend**: 1 controller nuevo (`AdminController`), 3 controllers modificados (`HabitacionController`, `ServicioController`, `ReservaController`), `SecurityConfig` actualizado
- **Frontend**: `app.js` — función `showAdmin()` completamente reescrita con panel de 5 tabs; nuevas funciones auxiliares para cada sección
- **Base de datos**: Sin cambios de esquema — solo nuevas queries de lectura y operaciones de delete en cascada sobre tablas existentes (`reserva`, `reserva_servicio`, `habitacion`, `servicio`)
- **Seguridad**: Endpoints `/api/admin/**` y métodos de escritura en habitaciones/servicios restringidos a `ROLE_ADMIN`
