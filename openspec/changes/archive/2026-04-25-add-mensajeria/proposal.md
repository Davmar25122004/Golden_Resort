## Why

Hoy los clientes y recepción no tienen ningún canal directo dentro del sistema. Si un cliente quiere preguntar algo (cambio de fechas, petición especial, dudas sobre la estancia) tiene que llamar al hotel o usar canales externos, con dos consecuencias: (1) la información no queda registrada junto a la reserva y (2) recepción no tiene historial de conversaciones para dar seguimiento. Una mensajería interna asíncrona resuelve ambos problemas usando la cuenta que el cliente ya tiene, sin infraestructura nueva ni dependencias externas.

## What Changes

- **Cliente**: nueva pestaña **Mensajes** en `/perfil` con su chat 1-a-1 con recepción. El cliente ve su historial completo y puede escribir mensajes nuevos.
- **Recepción/Admin**: nueva ruta `/mensajeria` con inbox compartido de todas las conversaciones. Click en un cliente → vista de chat + ficha completa del cliente.
- **Auto-creación**: cuando se registra un usuario con `ROLE_CLIENTE`, el sistema crea su `conversacion` vacía. El cliente nunca crea explícitamente el hilo; lo hace el sistema. Recepción tampoco necesita inicializar nada por cliente.
- **Modelo de hilo**: un único hilo por cliente (estilo WhatsApp). No hay tickets ni asignación entre recepcionistas — inbox compartido.
- **Restricciones de mensaje**: máximo 2000 caracteres, validado en backend y frontend. Mensajes inmutables (no se editan ni se borran).
- **Rate limit**: bloqueo si un usuario envía más de 20 mensajes en 10 segundos. Validación en backend (en memoria) y deshabilitación del botón en frontend.
- **Refresco**: polling cada 8 s (cliente) / 5 s (recepción) cuando la pestaña está visible. Sin WebSocket ni "está escribiendo…".
- **Notificaciones recepción**: campanita 🔔 a la derecha del navbar (en TODAS las páginas mientras esté logueado un recepcionista) con badge numérico de mensajes no leídos. Click navega a `/mensajeria`.
- **Notificaciones cliente**: badge similar discreto en el icono de perfil cuando recepción contesta. Sin emails.
- **Ficha "Cliente 360"** dentro de `/mensajeria`: al abrir un chat, panel lateral derecho con datos del cliente (email, alta), reservas en estancia hoy, reservas próximas, histórico (cantidad y total gastado), métodos de pago guardados. Reutiliza queries existentes — sin tablas nuevas.
- **Sin adjuntos** en v1.

No hay cambios **BREAKING**. Todo es aditivo. El flujo de reservas, pagos, autenticación y los paneles existentes (admin, recepción, perfil del cliente) quedan intactos.

## Capabilities

### New Capabilities

- `mensajeria`: chat asíncrono cliente↔recepción dentro del sistema, con un hilo persistente por cliente, contadores de no leídos, rate limit, ficha enriquecida del cliente para recepción y notificaciones visuales sin email.

### Modified Capabilities

(Ninguna — no se cambian requisitos de specs existentes.)

## Impact

- **Base de datos (Supabase)**: 2 tablas nuevas — `conversacion` (1 fila por cliente) y `mensaje` (N filas por conversación). Aplicadas vía MCP de Supabase. Nada se modifica en tablas existentes.
- **Backend (Spring Boot)**:
  - 2 entidades JPA + 2 repositorios.
  - 1 servicio `MensajeriaService` (alta de mensaje, listado, marcado leído, rate limit, ficha cliente).
  - 1 controller `MensajeriaController` con endpoints `/api/mensajeria/*`.
  - Hook en `UsuarioService.confirmarVerificacion(...)` y `OAuth2UserServiceCustom.loadUser(...)` para auto-crear la `conversacion` al alta de un cliente.
  - `SecurityConfig`: `/mensajeria/**` y `/api/mensajeria/**/recepcion` con `hasAnyRole('ADMIN','RECEPCION')`; `/api/mensajeria/mi-*` con `authenticated()`.
- **Frontend**:
  - Nueva plantilla `templates/mensajeria.html` + CSS `static/css/mensajeria.css` + JS `static/js/19-mensajeria.js` (panel del recepcionista).
  - Nuevo tab "Mensajes" en `static/js/16-perfil.js` con su panel y polling.
  - Modificación de `static/js/03-navegacion.js` y `static/js/04-ui-core.js` para insertar la campanita y gestionar su visibilidad por rol.
  - Inserción del span `<span id="nav-bell">` y `<span id="nav-mensajeria">` en los navbars de las 7 plantillas existentes (`index`, `mis-reservas`, `perfil`, `habitacion`, `servicio`, `admin`, `recepcion`).
- **Migraciones / seeds**: ejecutadas mediante MCP de Supabase. No se rompe `ddl-auto=update`.
- **Tests**: queda fuera del alcance de v1, igual que en `add-staff-recepcion`.
