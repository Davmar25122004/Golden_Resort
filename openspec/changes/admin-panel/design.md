## Context

Hotel DAW es una app Spring Boot con frontend SPA en vanilla JS. La autenticación usa Spring Security con sesiones HTTP y dos roles: `ROLE_ADMIN` y `ROLE_CLIENTE`. El frontend detecta el rol vía `/api/usuario-info` al iniciar y muestra/oculta el enlace "Admin" en la navbar.

Estado actual:
- `showAdmin()` en app.js renderiza solo el texto "Pendiente de backend"
- No existen endpoints de escritura para habitaciones ni servicios
- No existe `AdminController`
- `SecurityConfig` no tiene reglas específicas para rutas de admin

Base de datos (Supabase/PostgreSQL): `habitacion` (40 filas), `reserva`, `reserva_servicio`, `servicio` (6 filas), `usuarios`, `roles`, `usuarios_roles`.

## Goals / Non-Goals

**Goals:**
- Panel admin funcional con 5 secciones: Dashboard, Reservas, Habitaciones, Servicios, Usuarios
- Endpoints REST protegidos por `ROLE_ADMIN` usando `@PreAuthorize`
- Dashboard con métricas calculadas en el servidor (no en el cliente)
- Delete de habitación elimina en cascada sus `reserva_servicio` y `reserva` asociadas
- Frontend completamente dinámico — sin recargas de página, mismo patrón SPA existente

**Non-Goals:**
- Cambio de roles de usuarios desde el panel
- Registro de nuevos usuarios
- Paginación de tablas (el volumen de datos es bajo)
- Notificaciones al cliente cuando se cancela su reserva
- Subida de imágenes para habitaciones

## Decisions

**D1 — Seguridad: `@PreAuthorize` en controller vs reglas en `SecurityConfig`**

Usamos ambas capas: `SecurityConfig` añade reglas de URL para `/api/admin/**`, y los métodos de escritura en `HabitacionController` y `ServicioController` usan `@PreAuthorize("hasRole('ADMIN')")`. La doble capa es más explícita y resistente a errores de configuración.

Alternativa descartada: Solo `SecurityConfig` — menos explícito, más difícil de mantener cuando crecen los endpoints.

**D2 — Delete en cascada de habitación: lógica en Java, no en BD**

El delete de una habitación se implementa en el controller Java en este orden:
1. Buscar todas las reservas de esa habitación
2. Eliminar sus `reserva_servicio` asociadas
3. Eliminar las reservas
4. Eliminar la habitación

Alternativa descartada: `ON DELETE CASCADE` en la BD — evitamos alterar el esquema de Supabase para no crear migraciones en este cambio.

**D3 — Endpoint de stats: query SQL agregada en el servidor**

`GET /api/admin/stats` calcula en el servidor con queries JPQL/repositorios:
- `reservasHoy`: reservas con `fecha_entrada = hoy`
- `reservasMes`: reservas con `fecha_entrada` en el mes actual
- `ingresosTotal`: suma de `(días × precio_noche) + servicios` de todas las reservas
- `ocupacionHoy`: habitaciones con reserva activa hoy / total habitaciones
- `proximasLlegadas`: reservas con `fecha_entrada >= hoy`, ordenadas, límite 10

El cálculo de ingresos totales (habitación + servicios) se hace con una query nativa SQL o JPQL con JOIN a `reserva_servicio` y `servicio`.

Alternativa descartada: Calcular en el frontend — requeriría traer todos los datos raw al cliente.

**D4 — Frontend: panel de tabs con `showDynamic()`**

`showAdmin()` llama a `showDynamic()` (patrón ya existente en app.js) e inyecta HTML con un sistema de tabs Bootstrap. Cada tab tiene su propia función de carga asíncrona (`loadAdminDashboard()`, `loadAdminReservas()`, etc.). Los modales de crear/editar se inyectan en el mismo contenedor dinámico.

Alternativa descartada: Página separada — rompe el patrón SPA y requiere Thymeleaf templates adicionales.

**D5 — AdminController separado vs ampliar MainController**

Nuevo `AdminController` para rutas `/api/admin/**`. Mantiene separación de responsabilidades y facilita añadir más funcionalidad de admin en el futuro sin contaminar otros controllers.

## Risks / Trade-offs

- **[Riesgo] Delete en cascada manual** → Si la lógica Java falla a mitad (ej. excepción entre pasos), puede quedar estado inconsistente. Mitigación: envolver en `@Transactional` para garantizar atomicidad.
- **[Riesgo] Ingresos calculados sin columna `total` en BD** → El cálculo de `días × precio_noche` depende de que `precio_noche` en la habitación sea el precio al momento de la reserva, no el actual. Si se cambia el precio de una habitación, los "ingresos históricos" cambiarán. Mitigación: aceptado como trade-off — el esquema actual no tiene precio snapshot en la reserva.
- **[Trade-off] Sin paginación** → Con 40 habitaciones y pocas reservas, aceptable. Si el volumen crece necesitará paginación.
- **[Riesgo] `@PreAuthorize` requiere `@EnableMethodSecurity`** → Ya está activado en `SecurityConfig` (`@EnableMethodSecurity`). No es un riesgo, solo hay que verificarlo.

## Migration Plan

1. Desplegar backend (nuevos endpoints y SecurityConfig actualizado)
2. Desplegar frontend (app.js actualizado)
3. Sin cambios de esquema — no se requiere migración de base de datos
4. Rollback: revertir los ficheros Java y app.js modificados

## Open Questions

- *(Resuelto)* ¿Delete habitación cancela reservas? → Sí, en cascada por lógica Java con `@Transactional`
- *(Resuelto)* ¿Admin puede cancelar reservas de clientes? → Sí
- *(Resuelto)* ¿Ingresos incluyen servicios? → Sí, total real (habitación + servicios)
- *(Resuelto)* ¿Cambio de rol desde panel? → No
