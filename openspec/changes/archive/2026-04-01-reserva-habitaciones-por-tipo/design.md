## Context

Hotel DAW es una app Spring Boot con Supabase (PostgreSQL). Hay 40 habitaciones en BD (10 por tipo: NORMAL, DOBLE, SUITE, LUJO). El modelo `reserva` ya existe con `habitacion_id` individual, `fecha_entrada`, `fecha_salida` y `usuario_id`. El frontend trabaja agrupando habitaciones por tipo — el usuario nunca elige una habitación individual, sino un tipo. El backend ya tiene `contarReservasSolapadas()` por habitación individual. La sesión de usuario está gestionada por Spring Security (form login).

## Goals / Non-Goals

**Goals:**
- Exponer disponibilidad real por tipo para un rango de fechas
- Permitir que el frontend reserve indicando solo el tipo (el backend elige la habitación)
- Actualizar el badge "Quedan X" con datos reales cuando hay fechas seleccionadas
- Bloquear la reserva cuando no hay habitaciones libres de ese tipo en esas fechas

**Non-Goals:**
- Cambiar el modelo de datos (tablas existentes sin alteraciones)
- Gestión de pagos o confirmaciones por email
- Elegir habitación individual desde el frontend
- Panel de administración de reservas

## Decisions

### D1: El frontend reserva por tipo, el backend asigna habitación
**Decisión:** Nuevo endpoint `POST /api/reservas/por-tipo` que recibe `tipo`, `fechaEntrada`, `fechaSalida`. El backend busca con JPQL la primera habitación libre de ese tipo y la asigna.

**Alternativa descartada:** Que el frontend llame a `/disponibles`, obtenga un `habitacionId` específico y luego haga el POST con ese ID. Más pasos, más surface de race conditions.

**Rationale:** Un solo POST atómico; si dos usuarios reservan simultáneamente el mismo tipo, el segundo encontrará que la habitación ya está ocupada y el backend elegirá la siguiente libre. Más seguro y simple.

---

### D2: Query JPQL para habitación disponible
**Decisión:** Añadir en `HabitacionRepository`:
```java
@Query("SELECT h FROM Habitacion h WHERE h.tipo = :tipo " +
       "AND h.id NOT IN (SELECT r.habitacion.id FROM Reserva r " +
       "WHERE r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada) " +
       "ORDER BY h.id ASC")
List<Habitacion> findAvailableByTipo(
    @Param("tipo") TipoHabitacion tipo,
    @Param("fechaEntrada") LocalDate fechaEntrada,
    @Param("fechaSalida") LocalDate fechaSalida,
    Pageable pageable   // Pageable.ofSize(1) para traer solo 1
);
```
Usar `Pageable.ofSize(1)` para traer solo la primera, sin necesidad de un método separado `findFirst`.

**Alternativa descartada:** SQL nativo. El JPQL mantiene consistencia con el resto del repositorio.

---

### D3: Endpoint de disponibilidad devuelve Map por tipo
**Decisión:** `GET /api/habitaciones/disponibles?fechaEntrada=X&fechaSalida=Y` devuelve:
```json
{ "NORMAL": 8, "DOBLE": 10, "SUITE": 3, "LUJO": 10 }
```
Se calculan los 4 tipos en una sola petición con una query agrupada o 4 calls al repositorio (tolerable con 4 tipos fijos).

**Rationale:** El frontend necesita los 4 tipos para pintar todas las cards. Una sola petición es más eficiente.

---

### D4: Usuario obtenido de la sesión Spring Security
**Decisión:** En `POST /api/reservas/por-tipo`, el `usuarioId` se obtiene del `Authentication` inyectado por Spring Security, no del body del request.

**Rationale:** Más seguro — el cliente no puede falsificar el ID de usuario. Si no hay sesión, Spring devuelve 401 automáticamente (configurado en `SecurityConfig`).

---

### D5: Flujo de reserva en frontend — Option B
**Decisión:** El badge "Quedan X" solo aparece cuando `state.searchDates` está definido. Sin fechas, se muestra "● Disponible" genérico. Al hacer clic en "Reservar", si no hay `searchDates`, el modal de reserva incluye un selector de fechas (Flatpickr). Si ya hay `searchDates`, se usan esas fechas directamente.

**Rationale:** Es el comportamiento natural de un hotel — el precio y disponibilidad dependen de las fechas.

## Risks / Trade-offs

- **Race condition suave**: Dos usuarios reservan el mismo tipo simultáneamente → el backend asigna habitaciones distintas (hay 10 por tipo). Solo problemático si quedan muy pocas habitaciones libres y hay mucha concurrencia simultánea. Riesgo bajo para este contexto académico; mitigación: el JPQL con `ORDER BY h.id` es determinista.

- **Fechas sin validar en frontend**: El usuario podría enviar `fechaEntrada >= fechaSalida`. Mitigación: validar en el backend antes de consultar la BD (retornar 400).

- **Seguridad de SecurityConfig**: Hay que verificar que `POST /api/reservas/por-tipo` requiere autenticación en `SecurityConfig.java`. Si está con `permitAll()`, cualquier request anónimo podría crear reservas.

## Migration Plan

No hay cambios de esquema. Despliegue directo: backend primero, luego frontend. Sin rollback complejo — eliminar los dos endpoints nuevos es suficiente.

## Open Questions

- ¿Debe `GET /api/habitaciones/disponibles` requerir autenticación o ser público? (Recomendado: público, para que el badge se muestre sin login.)
- ¿Se muestra la vista "Mis Reservas" listando las reservas del usuario tras confirmar? (Actualmente pendiente de backend según el código.)
