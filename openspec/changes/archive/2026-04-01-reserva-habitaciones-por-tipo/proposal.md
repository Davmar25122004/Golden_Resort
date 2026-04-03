## Why

El sistema de Hotel DAW tiene 40 habitaciones en base de datos (10 por tipo) y la infraestructura de reservas ya existe en el backend, pero el flujo de reserva no está conectado con el frontend. Los clientes ven un botón "Próximamente" sin poder reservar, y los contadores de disponibilidad son estáticos. Se necesita cerrar ese ciclo para que el sistema sea funcional.

## What Changes

- **Nuevo endpoint** `GET /api/habitaciones/disponibles` con parámetros `fechaEntrada` y `fechaSalida` → devuelve habitaciones libres por tipo en tiempo real.
- **Nuevo endpoint** `POST /api/reservas/por-tipo` → recibe tipo, fechas y usuario de la sesión; selecciona automáticamente una habitación libre y crea la reserva.
- **Nuevo query JPQL** en `HabitacionRepository` para encontrar la primera habitación disponible de un tipo en un rango de fechas.
- **Frontend actualizado**: `loadRooms()` consume el nuevo endpoint de disponibilidad cuando hay fechas buscadas; badge "Quedan X" refleja datos reales.
- **Frontend actualizado**: `selectRoom()` abre un flujo de reserva real con selector de fechas (Flatpickr) y confirmación, reemplazando el botón "Próximamente".
- Cuando disponibilidad llega a 0 para un tipo en un día, el botón queda deshabilitado y no se puede reservar.

## Capabilities

### New Capabilities
- `disponibilidad-habitaciones`: Consulta de habitaciones libres por tipo para un rango de fechas dado; base para mostrar contadores reales y bloquear reservas cuando no hay disponibilidad.
- `reserva-por-tipo`: Flujo completo de reserva desde el frontend — el cliente elige tipo y fechas, el backend asigna una habitación concreta libre y registra la reserva en BD.

### Modified Capabilities
<!-- Ninguna especificación existente cambia sus requisitos -->

## Impact

- **Backend**: `HabitacionController.java`, `ReservaController.java`, `HabitacionRepository.java`
- **Frontend**: `app.js` — funciones `loadRooms()` y `selectRoom()`
- **API nueva**: dos endpoints REST nuevos
- **Sin cambios al modelo de datos**: tablas `habitacion` y `reserva` sin modificaciones
- **Seguridad**: el endpoint de reserva requiere sesión activa (Spring Security); usuario anónimo recibe 401
