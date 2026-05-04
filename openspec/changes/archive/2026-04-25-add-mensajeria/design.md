## Context

El proyecto es un Spring Boot + Thymeleaf con persistencia en Supabase Postgres. Ya existe el patrón de "rol staff con su propio panel" (ver `add-staff-recepcion`): tabla en `roles`, plantilla dedicada, controller protegido por `@PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")`, JS con polling tipo SPA. Esta funcionalidad reutiliza esos mismos patrones.

Restricciones relevantes:
- `spring.jpa.hibernate.ddl-auto=update` está activo, pero usaremos el MCP de Supabase para aplicar las migraciones de forma explícita y controlada.
- Frontend con Thymeleaf + JS vanilla + Bootstrap (sin frameworks SPA).
- Una sola instancia del backend en producción actualmente.
- Sin sistema de notificaciones push, sin Redis, sin colas.

## Goals / Non-Goals

**Goals:**
- Canal asíncrono persistente entre cliente y recepción dentro del sistema.
- Cero clicks de "abrir chat" para el cliente: el tab Mensajes está disponible siempre.
- Inbox compartido para todos los recepcionistas/admins.
- Badge numérico de no leídos visible en barra de navegación (campanita) para staff.
- Vista enriquecida del cliente al abrir su chat (reservas activas, próximas, históricas, totales).
- Cero modificaciones a tablas o flujos existentes (solo aditivo).
- Backend real contra Supabase, sin mocks ni datos en memoria persistentes.

**Non-Goals:**
- Tiempo real (WebSocket, SSE, "está escribiendo…").
- Notificaciones push del navegador o por email.
- Adjuntar archivos, imágenes o audio.
- Editar o borrar mensajes después de enviarlos.
- Tickets, estados de conversación (abierta/cerrada), asignación a recepcionista concreto.
- Mensajes entre clientes (solo cliente↔recepción).
- Búsqueda full-text dentro de mensajes (v1).

## Decisions

### 1. Auto-creación de la conversación al alta de un cliente
La fila `conversacion` se crea programáticamente cuando un usuario adquiere `ROLE_CLIENTE` por primera vez (verificación de email o primer login OAuth). El cliente nunca pulsa "abrir chat" y recepción no necesita inicializar conversación por cliente.

**Alternativas descartadas:**
- *Crear al primer mensaje del cliente*: requeriría que el endpoint POST detecte ausencia de conversación y la cree, ramificación extra y race conditions si dos requests llegan a la vez.
- *Solo recepción inicia (Lectura 1 estricta)*: deja al cliente sin canal hasta que recepción decida abrir uno; rompe la idea de "opción de contacto siempre disponible". Si el usuario lo prefiere se puede cambiar añadiendo un endpoint `POST /api/mensajeria/iniciar` solo para staff.

**Backfill** para clientes que ya existen en BBDD: un componente `MensajeriaBootstrap` con `@PostConstruct` ejecuta una sola vez al arranque un INSERT con SELECT que cubre todos los `usuarios` con `ROLE_CLIENTE` que aún no tengan conversación. Idempotente.

### 2. Un único hilo por cliente (constraint UNIQUE)
La tabla `conversacion` tiene `cliente_id BIGINT UNIQUE`. Modelo "WhatsApp": cada cliente tiene UNA conversación que crece para siempre.

**Alternativa descartada:** modelo "tickets" (múltiples conversaciones por cliente con estado abierto/cerrado/resuelto). Más complejidad de UI y de modelado para un volumen bajo. Se puede evolucionar a tickets en el futuro sin migración destructiva (añadir campo `estado`, quitar UNIQUE).

### 3. Contadores de no leídos en la conversación, no por mensaje
La tabla `conversacion` lleva dos columnas: `no_leidos_cliente` y `no_leidos_recepcion`. Cada `INSERT` en `mensaje` incrementa el contador del lado opuesto. Cada vez que un lado abre la conversación, su contador se pone a 0.

**Alternativa descartada:** boolean `leido` por mensaje, calculado vía `COUNT(*) WHERE leido = false`. Más simple semánticamente, pero requiere COUNT por conversación para mostrar badges → cara cuando el inbox crece. Los contadores en `conversacion` son O(1) en lectura.

**Trade-off:** los contadores son derivados — si por error se desincronizan, hay que reconciliarlos. Para mitigarlo se ofrece (no se implementa en v1) un endpoint admin de re-cálculo a partir de `mensaje`.

### 4. Polling como mecanismo de actualización
El cliente refresca su conversación cada 8 s, recepción refresca su inbox + chat abierto cada 5 s. Solo cuando la pestaña es visible (Page Visibility API).

**Alternativa descartada:** WebSocket / SSE. Requeriría dependencias y configuración nuevas (`spring-boot-starter-websocket`, brokers, sticky sessions detrás de balanceador). Para 1-3 recepcionistas concurrentes el polling es indistinguible y mucho más sencillo.

### 5. Rate limit en memoria (in-process)
Antes de aceptar un mensaje, `MensajeriaService` consulta un `ConcurrentHashMap<Long, Deque<Long>>` (clave = `usuarioId`, valor = timestamps de los últimos N envíos). Si en los últimos 10 s hay ≥20 → 429 Too Many Requests.

**Alternativa descartada:** Bucket4j sobre Redis o tabla. La app corre en una sola instancia; la complejidad extra no compensa. Si en algún momento se escala horizontal, conmutar a Bucket4j+Redis es localizado en el service.

**Trade-off:** al reiniciar el backend, los contadores se resetean. Aceptable porque el reinicio es excepcional y un atacante coordinado contra esto es irrelevante para el caso de uso.

### 6. Tope 2000 caracteres en backend y frontend
Columna `texto VARCHAR(2000)` + `@Size(max = 2000)` en la entidad + `maxlength="2000"` en `<textarea>`. Mensajes que excedan responden 400 con mensaje claro.

### 7. Mensajes inmutables
No se exponen endpoints PUT/DELETE sobre `mensaje`. Una vez enviado, queda. Simplifica el modelo (sin auditoría de ediciones) y la confianza en el historial.

### 8. Endpoints separados por audiencia
Dos espacios bien diferenciados:
- `/api/mensajeria/mi-conversacion` (cliente, autenticado): GET su hilo, POST para añadir mensaje, POST para marcar leído.
- `/api/mensajeria/recepcion/*` (staff): GET inbox, GET conversación de cualquier cliente, POST para responder, GET ficha 360.

Cada bloque protegido con su `requestMatcher`. Más legible que un único endpoint con ramificación interna por rol.

### 9. Vista "Cliente 360" como endpoint dedicado
`GET /api/mensajeria/recepcion/cliente/{id}/ficha` devuelve un objeto agregado: usuario, reservas activas, próximas, históricas (cantidad y total), métodos de pago, último pago. Reusa repositorios existentes (`ReservaRepository`, `PagoRepository`, `MetodoPagoRepository`). Sin tablas nuevas.

**Alternativa descartada:** reusar `/api/perfil` (es del propio usuario autenticado, no sirve para staff que consulta a otro). Otra alternativa, devolver toda la información en `/conversacion/{id}` mezclada con los mensajes — peor cohesión.

### 10. Campanita en navbar global (staff)
Nuevo `<span id="nav-bell">` con icono SVG y `<span class="nav-bell-badge">N</span>`. Visible solo si `state.user.roles` contiene `ROLE_RECEPCION` o `ROLE_ADMIN`. Polling cada 5 s a `/api/mensajeria/recepcion/no-leidos` (devuelve un entero, suma de `no_leidos_recepcion` de todas las conversaciones). Click navega a `/mensajeria`.

Insertado en los 7 navbars de plantillas existentes + en `mensajeria.html`. Sin tabla nueva, sin estado adicional.

### 11. Cliente: badge en perfil, no en navbar global
Para no contaminar el navbar del cliente con un nuevo widget que solo aplica a una pestaña, el indicador de mensajes no leídos del cliente vive **dentro** de su tab "Mensajes" en `/perfil` (un punto al lado del título "Mensajes" en la sidebar del perfil, similar al patrón ya usado en "Habitaciones Guardadas"). Si más adelante se quiere notificación global, reusamos el componente de campanita.

### 12. Sin clase `Conversacion` separada para "tickets"
La tabla `conversacion` no lleva campo `estado`. Si en el futuro se requiere cerrar/reabrir, se añade nullable y se interpreta `null` = abierta.

## Risks / Trade-offs

- **Polling consume 1 req/5-8s por sesión activa** → ~12-17 req/min por usuario. Para 1-3 recepcionistas y N clientes intermitentes, irrelevante. Si llega a 50+ recepcionistas concurrentes, migrar a SSE.

- **Rate limit in-memory no sobrevive a reinicios y no es global cluster-wide** → aceptado por la escala actual; documentado.

- **Backfill al arrancar puede ser lento si hay millones de clientes existentes** → el INSERT con SELECT FILTER es una sola query y los volúmenes actuales (≤30 usuarios) lo hacen instantáneo.

- **Marcado de leído basado en "último que abrió"** → si dos recepcionistas abren simultáneamente, ambos resetean a 0. Sin tracking individual de quién leyó qué, lo cual es consistente con el modelo de inbox compartido (decisión 8).

- **"Cliente 360" puede disparar queries pesadas** si el cliente tiene cientos de reservas/pagos → mitigación: limitar resultados (TOP 5 reservas pasadas, TOP 5 pagos) en el endpoint y pedir explícitamente "ver más" si se necesita.

- **Cliente nuevo registrado pero todavía no logueado nunca** → su conversación se crea cuando confirma el email (en `UsuarioService.confirmarVerificacion`) o cuando hace su primer login OAuth (`OAuth2UserServiceCustom.loadUser`). Si el cliente abandona la verificación, no se crea conversación huérfana.

- **Campanita en TODAS las páginas** → 7 plantillas a tocar. Igual que con `nav-recepcion`. Tedioso pero seguro.

- **Posible scroll roto al recibir un mensaje nuevo durante el polling**: si el recepcionista está leyendo arriba en el chat, el render no debe forzar scroll al fondo — solo si ya estaba en el fondo. Detalle de UX en JS.

## Migration Plan

1. **Migración de esquema (Supabase MCP)**:
   ```sql
   CREATE TABLE public.conversacion (...);
   CREATE TABLE public.mensaje (...);
   CREATE INDEX ...;
   ```
   Aplicada con `mcp__supabase__apply_migration`. Reversible con `DROP TABLE` si fuera necesario (sin riesgo: tablas vacías hasta que se despliega backend).

2. **Backfill de conversaciones**:
   ```sql
   INSERT INTO conversacion (cliente_id)
   SELECT u.id
   FROM usuarios u
   JOIN usuarios_roles ur ON ur.usuario_id = u.id
   JOIN roles r            ON r.id = ur.role_id
   WHERE r.name = 'ROLE_CLIENTE'
     AND NOT EXISTS (SELECT 1 FROM conversacion c WHERE c.cliente_id = u.id);
   ```
   Ejecutado a mano vía MCP **después** de crear las tablas, **antes** de desplegar el backend. Alternativamente, `MensajeriaBootstrap.@PostConstruct` lo hace al primer arranque.

3. **Despliegue backend**: nuevas entidades, service, controller, hooks en `UsuarioService` y `OAuth2UserServiceCustom`, actualización de `SecurityConfig`. Compatible con la BBDD: si se despliega antes de las migraciones, falla solo en el endpoint nuevo y no rompe nada existente.

4. **Despliegue frontend**: nueva ruta `/mensajeria`, plantilla, JS, CSS. Modificación de `03-navegacion.js`, `04-ui-core.js`, `16-perfil.js`. Adición de `<span id="nav-bell">` y `<span id="nav-mensajeria">` en los 7 navbars.

5. **Smoke test manual**:
   - Cliente envía un mensaje desde `/perfil → Mensajes`.
   - Recepción lo ve en el inbox de `/mensajeria` con badge 1.
   - Recepción lo abre, ve el chat + ficha cliente, responde.
   - Cliente recibe la respuesta en su tab tras 8 s.
   - Probar rate limit: enviar 21 mensajes rápidos → el 21º responde 429.
   - Probar tope de tamaño: enviar 2001 caracteres → 400.

**Rollback**: revertir despliegue + `DROP TABLE conversacion CASCADE; DROP TABLE mensaje;`. No afecta datos del resto.

## Open Questions

- **Lectura 1 vs Lectura 3**: la decisión asumida (3, auto-creación al alta de cliente) sigue pendiente de confirmación explícita. Si el usuario prefiere "solo recepción inicia y nada de auto-creación", se elimina el bootstrap y se añade endpoint staff `POST /api/mensajeria/recepcion/iniciar` con `cliente_id`. Cambio mínimo en `MensajeriaService` y proposal/spec.
- **¿El contador del cliente vive en su perfil o también en navbar global?** Resuelto en decisión 11 (en perfil, v1). Reabrir si la UX se queda corta tras pruebas reales.
- **¿Qué hacer al eliminar un usuario?** Política CASCADE en `conversacion.cliente_id → usuarios.id` y `mensaje.conversacion_id → conversacion.id`. Eliminar un cliente borra su conversación e historial. Si se quiere preservar para auditoría, cambiar a `ON DELETE SET NULL` y nullable, pero rompe el modelo "1 conversación = 1 cliente".
- **Paginación de mensajes**: hoy el endpoint devuelve el hilo completo. Si una conversación crece a miles de mensajes, debería paginar. Pendiente cuando se observe el primer caso.
- **Idioma**: los textos visibles ("escribir mensaje", "no leídos", "ficha del cliente"…) van en castellano hardcodeados como el resto del proyecto. Si más adelante se internacionaliza, añadir entradas a `14-i18n.js`.
