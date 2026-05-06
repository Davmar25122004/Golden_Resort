## 1. Migración Supabase (MCP)

- [x] 1.1 Crear tabla `conversacion` con `id BIGSERIAL`, `cliente_id BIGINT UNIQUE NOT NULL` (FK a `usuarios(id)` ON DELETE CASCADE), `creada_en TIMESTAMP DEFAULT NOW()`, `ultima_actividad TIMESTAMP DEFAULT NOW()`, `no_leidos_cliente INT DEFAULT 0`, `no_leidos_recepcion INT DEFAULT 0`
- [x] 1.2 Crear tabla `mensaje` con `id BIGSERIAL`, `conversacion_id BIGINT NOT NULL` (FK ON DELETE CASCADE), `autor_id BIGINT NOT NULL`, `autor_rol VARCHAR(20) NOT NULL CHECK (autor_rol IN ('CLIENTE','RECEPCION'))`, `texto VARCHAR(2000) NOT NULL`, `creado_en TIMESTAMP DEFAULT NOW()`
- [x] 1.3 Crear índice `idx_mensaje_conv_creado` sobre `mensaje(conversacion_id, creado_en)`
- [x] 1.4 Crear índice `idx_conversacion_actividad` sobre `conversacion(ultima_actividad DESC)`
- [x] 1.5 Backfill: insertar una `conversacion` para cada `usuarios` con `ROLE_CLIENTE` que aún no tenga (single SQL idempotente)
- [x] 1.6 Verificar con `SELECT COUNT(*) FROM conversacion;` que hay tantas filas como clientes existentes

## 2. Entidades JPA y repositorios

- [x] 2.1 Crear entidad `Conversacion` en `domain/` con los campos del esquema, anotaciones JPA, Lombok, `@PrePersist` para timestamps
- [x] 2.2 Crear entidad `Mensaje` en `domain/` con relación implícita por id (no usar @ManyToOne para evitar lazy loading innecesario; un `Long conversacionId` basta como en `NotaReserva`), `@Size(max = 2000)` en `texto`
- [x] 2.3 Crear `ConversacionRepository extends JpaRepository<Conversacion, Long>` con `Optional<Conversacion> findByClienteId(Long)`, `List<Conversacion> findAllByOrderByUltimaActividadDesc()`, `@Query` para sumar `no_leidos_recepcion` total
- [x] 2.4 Crear `MensajeRepository extends JpaRepository<Mensaje, Long>` con `List<Mensaje> findByConversacionIdOrderByCreadoEnAsc(Long)` y `Optional<Mensaje> findTopByConversacionIdOrderByCreadoEnDesc(Long)` (para preview en inbox)

## 3. MensajeriaService

- [x] 3.1 Crear esqueleto de `MensajeriaService` en `service/` con dependencias: `ConversacionRepository`, `MensajeRepository`, `UsuarioRepository`, `RoleRepository`, `ReservaRepository`, `PagoRepository`, `MetodoPagoRepository`
- [x] 3.2 Implementar `obtenerOCrearConversacion(Usuario cliente)` — devuelve la `Conversacion` del cliente, creándola si no existe (usado por hooks de alta y como salvaguarda)
- [x] 3.3 Implementar `miConversacion(Usuario cliente)` — DTO con metadatos + lista completa de mensajes ordenados ASC, resetea `no_leidos_cliente` a 0
- [x] 3.4 Implementar `enviarMensajeCliente(Usuario cliente, String texto)` — valida texto (no vacío, ≤2000), aplica rate limit, persiste mensaje con `autor_rol='CLIENTE'`, incrementa `no_leidos_recepcion`, actualiza `ultima_actividad`
- [x] 3.5 Implementar `inboxRecepcion()` — lista DTOs (`conversacionId`, `clienteId`, `email`, `nombre`, `noLeidosRecepcion`, `ultimaActividad`, `previewUltimoMensaje`) ordenados por `ultimaActividad DESC`
- [x] 3.6 Implementar `conversacionParaRecepcion(Long conversacionId)` — DTO con metadatos + lista completa de mensajes, resetea `no_leidos_recepcion` a 0
- [x] 3.7 Implementar `enviarMensajeRecepcion(Usuario staff, Long conversacionId, String texto)` — análogo a 3.4 pero `autor_rol='RECEPCION'`, incrementa `no_leidos_cliente`
- [x] 3.8 Implementar `noLeidosTotalRecepcion()` — devuelve `int` con la suma de `no_leidos_recepcion` (para badge campanita)
- [x] 3.9 Implementar `fichaCliente(Long clienteId)` — DTO agregado: usuario, reservas activas (en estancia hoy), próximas, top-5 pasadas, total gastado, top-5 pagos COMPLETADO, métodos de pago
- [x] 3.10 Implementar `RateLimiter` interno con `ConcurrentHashMap<Long, Deque<Long>>` (clave usuarioId, valores timestamps), método `permitirOLanzar(usuarioId)` que lanza `ResponseStatusException(429)` si > 20 envíos en últimos 10 s

## 4. MensajeriaController + endpoints

- [x] 4.1 Crear `MensajeriaController` con `@Controller` (no @RestController, para servir también la vista) y helper `usuario(Authentication)` igual al de `RecepcionController`
- [x] 4.2 `@GetMapping("/mensajeria")` → return "mensajeria" (vista Thymeleaf), protegido por `@PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")`
- [x] 4.3 `@GetMapping("/api/mensajeria/mi-conversacion")` → llama `miConversacion`, `@ResponseBody`
- [x] 4.4 `@PostMapping("/api/mensajeria/mi-conversacion/mensajes")` → llama `enviarMensajeCliente`, body `{texto}`
- [x] 4.5 `@PostMapping("/api/mensajeria/mi-conversacion/leer")` → resetea contador del cliente sin devolver mensajes
- [x] 4.6 `@GetMapping("/api/mensajeria/recepcion/conversaciones")` → llama `inboxRecepcion`
- [x] 4.7 `@GetMapping("/api/mensajeria/recepcion/conversaciones/{id}")` → llama `conversacionParaRecepcion`
- [x] 4.8 `@PostMapping("/api/mensajeria/recepcion/conversaciones/{id}/mensajes")` → llama `enviarMensajeRecepcion`, body `{texto}`
- [x] 4.9 `@GetMapping("/api/mensajeria/recepcion/no-leidos")` → devuelve `{total: <int>}` para la campanita
- [x] 4.10 `@GetMapping("/api/mensajeria/recepcion/cliente/{id}/ficha")` → llama `fichaCliente`
- [x] 4.11 Manejar 401/403/400/404/429 con `ResponseStatusException` y mensajes claros en body

## 5. Hooks de auto-creación y bootstrap

- [x] 5.1 En `UsuarioService.confirmarVerificacion`, tras asignar `ROLE_CLIENTE`, llamar `mensajeriaService.obtenerOCrearConversacion(usuario)` (inyectar `MensajeriaService`)
- [x] 5.2 En `OAuth2UserServiceCustom.loadUser`, tras crear/recuperar el `Usuario`, llamar `obtenerOCrearConversacion(...)` si tiene `ROLE_CLIENTE`
- [x] 5.3 Crear `MensajeriaBootstrap` en `config/` con `@PostConstruct` que ejecute backfill SQL idempotente (un INSERT con SELECT) por si quedaran clientes pre-existentes sin conversación tras desplegar
- [x] 5.4 Verificar que ambos hooks no fallan si la conversación ya existe (idempotencia)

## 6. SecurityConfig

- [x] 6.1 Añadir `requestMatchers("/mensajeria", "/mensajeria/**").hasAnyRole("ADMIN","RECEPCION")`
- [x] 6.2 Añadir `requestMatchers("/api/mensajeria/recepcion/**").hasAnyRole("ADMIN","RECEPCION")`
- [x] 6.3 Añadir `requestMatchers("/api/mensajeria/mi-conversacion", "/api/mensajeria/mi-conversacion/**").authenticated()`
- [x] 6.4 Asegurar que NINGÚN patrón existente queda invalidado por los nuevos (ojo al orden de los matchers)

## 7. Plantilla `/mensajeria` (panel staff)

- [x] 7.1 Crear `templates/mensajeria.html` con la misma estructura shell que `recepcion.html` (navbar + main-content + modales)
- [x] 7.2 Layout 2 columnas: izquierda inbox de conversaciones, centro chat abierto, derecha ficha cliente 360
- [x] 7.3 Incluir `nav-recepcion`, `nav-admin`, `nav-mensajeria` y `nav-bell` en el navbar
- [x] 7.4 Crear `static/css/mensajeria.css` con estilos del inbox (lista de conversaciones), chat (burbujas cliente vs recepción), ficha cliente (cards), badge de no leídos
- [x] 7.5 Crear `static/js/19-mensajeria.js`: estado `_msgState`, init en DOMContentLoaded, polling cada 5 s, render de inbox, render de chat, envío de respuesta, render de ficha, scroll inteligente (no desplazar si el usuario está leyendo arriba)

## 8. Tab "Mensajes" en `/perfil` (cliente)

- [x] 8.1 En `16-perfil.js`, añadir un nuevo `perfil-menu-item` con icono y texto "Mensajes" (después de "Habitaciones Guardadas") con badge condicional `<span id="perfil-mensajes-unread">`
- [x] 8.2 Añadir nuevo `<div id="perfil-tab-mensajes" class="perfil-tab-panel">` con el chat (lista de mensajes scrollable + textarea + botón enviar)
- [x] 8.3 En el handler `perfilShowTab('mensajes', ...)`, llamar GET `/api/mensajeria/mi-conversacion`, renderizar burbujas, ocultar el badge no-leídos
- [x] 8.4 Implementar polling cada 8 s mientras el tab esté activo y la pestaña visible
- [x] 8.5 Implementar envío con POST y deshabilitar botón 1 s tras click (UX anti-flood antes del rate limit servidor)

## 9. Campanita global (staff) en navbars

- [x] 9.1 En `templates/index.html`, añadir `<span id="nav-bell" style="display:none;">` con icono SVG campana + `<span class="nav-bell-badge"></span>`, antes del `nav-user`
- [x] 9.2 Replicar el span en `mis-reservas.html`, `perfil.html`, `habitacion.html`, `servicio.html`, `admin.html`, `recepcion.html`, `mensajeria.html`
- [x] 9.3 Añadir CSS de la campanita en `base.css` o `layout.css` (icon size, badge rojo, posición relativa)
- [x] 9.4 En `04-ui-core.js`, dentro de `updateNav()`: si `esStaff`, mostrar `nav-bell` y arrancar polling cada 5 s a `/api/mensajeria/recepcion/no-leidos`; si la respuesta `total > 0`, mostrar el badge con el número, si no ocultarlo
- [x] 9.5 Click sobre la campanita navega a `/mensajeria`

## 10. Verificación end-to-end

- [x] 10.1 `./mvnw clean compile` debe terminar BUILD SUCCESS
- [x] 10.2 Arrancar app, comprobar log `MensajeriaBootstrap` o ausencia de errores de auto-creación
- [x] 10.3 Login como cliente → /perfil → tab Mensajes visible y vacío → enviar mensaje → aparece en el historial al refrescar
- [x] 10.4 Login como recepcionista (`recepcion@goldenresort.com`) → /mensajeria → ver el mensaje del cliente en el inbox con badge `1` → abrir conversación → la ficha cliente 360 carga datos reales (reservas, pagos)
- [x] 10.5 Recepcionista responde → cliente refresca su tab → ve la respuesta en ≤8 s, badge desaparece al abrir
- [x] 10.6 Probar rate limit enviando 21 mensajes desde frontend rápido → confirmar 429 en consola del navegador
- [x] 10.7 Probar tope de longitud enviando ≥2001 caracteres → confirmar 400
- [x] 10.8 Probar autorización: cliente accede a `/mensajeria` → 403; anónimo accede a `/api/mensajeria/mi-conversacion` → 401
- [x] 10.9 Confirmar campanita visible en index/admin/recepcion/perfil/etc. para staff y oculta para cliente
- [x] 10.10 Confirmar que reservas, pagos, panel recepción y demás flujos siguen funcionando idénticos a antes
