## Why

El cliente ya puede reservar habitaciones, pero no tiene ninguna forma de ver sus reservas activas o pasadas. La sección "Mis Reservas" existe en el frontend pero muestra un placeholder estático. Completar este ciclo es la última pieza del flujo del cliente: reservar → ver → cancelar si es necesario.

## What Changes

- **Nuevo endpoint** `GET /api/reservas/mis-reservas` que devuelve las reservas del usuario autenticado como DTOs simples (sin referencias circulares), incluyendo datos de la habitación.
- **`showMisReservas()` funcional** — sustituye el placeholder por llamada real al nuevo endpoint y renderiza las tarjetas de reserva.
- **Vista de tarjetas de reserva** con diseño original y coherente con el hotel: layout horizontal (imagen izquierda, detalles derecha), badge de estado (EN CURSO / PRÓXIMA / PASADA), total calculado.
- **Estado vacío** — mensaje elegante con CTA cuando el cliente no tiene reservas.
- **Cancelar reserva** — botón visible solo en reservas PRÓXIMAS que llama al `DELETE /api/reservas/{id}` existente y refresca la lista.
- **Estilos nuevos** en `style.css` para `.reserva-card` y sus elementos, sin duplicar los estilos de las cards de habitaciones.

## Capabilities

### New Capabilities
- `mis-reservas-vista`: Vista del cliente para consultar su historial de reservas con estados, totales y opción de cancelación para reservas futuras.

### Modified Capabilities

## Impact

- **Backend**: `ReservaController.java` — nuevo endpoint con DTO interno
- **Frontend**: `app.js` — función `showMisReservas()`, nueva función `cancelarReserva()`
- **CSS**: `style.css` — nuevas clases `.reserva-card`, `.reserva-estado-badge`, `.reserva-empty`
- **Sin cambios al modelo de datos**
- **Seguridad**: el endpoint requiere sesión activa (protegido por `anyRequest().authenticated()`)
