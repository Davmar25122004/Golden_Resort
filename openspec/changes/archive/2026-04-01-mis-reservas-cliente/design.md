## Context

Hotel DAW — Spring Boot + Supabase. El cliente puede reservar habitaciones por tipo (implementado). La función `showMisReservas()` en app.js existe pero solo muestra un placeholder. El backend tiene `GET /api/reservas/usuario/{id}` pero requiere el ID del usuario, que el frontend no tiene disponible en `state.user` (solo tiene email y rol). El `DELETE /api/reservas/{id}` ya existe y funciona.

Design system: `--dark-3: #252525`, `--gold: #C9A84C`, `--cream: #F5F0E8`, `--text-muted-custom: #9A9A9A`. Fuentes: Cormorant Garamond (serif, headings) + Montserrat (sans, body). Estilo dark luxury.

## Goals / Non-Goals

**Goals:**
- Endpoint que devuelve reservas del usuario autenticado sin necesitar su ID explícito
- Vista de reservas con diseño original: horizontal, imagen + detalles, badge de estado
- Cancelación de reservas futuras desde el frontend
- Estado vacío elegante

**Non-Goals:**
- Modificar o repaginar reservas pasadas
- Editar fechas de una reserva existente
- Notificaciones o emails de cancelación

## Decisions

### D1: DTO para evitar referencias circulares
**Decisión:** Crear clase interna `ReservaDTO` en `ReservaController` con campos planos: `id`, `fechaEntrada`, `fechaSalida`, `habitacionTipo`, `habitacionNumero`, `precioNoche`. El endpoint construye y devuelve `List<ReservaDTO>`.

**Rationale:** La entidad `Reserva` tiene `List<ReservaServicio>` ↔ `ReservaServicio.reserva` — referencia circular que causa StackOverflow en Jackson. El DTO plano rompe el ciclo sin tocar las entidades del dominio.

---

### D2: Usuario desde Authentication, no desde el body
**Decisión:** `GET /api/reservas/mis-reservas` inyecta `Authentication` y obtiene el usuario por email, igual que `POST /api/reservas/por-tipo`.

**Rationale:** Consistente con el patrón ya establecido. El frontend no necesita conocer el ID del usuario.

---

### D3: Diseño horizontal con imagen lateral
**Decisión:** `.reserva-card` usa `display: flex` con imagen fija a la izquierda (200×160px) y bloque de detalles a la derecha. En mobile (< 600px) colapsa a columna.

**Alternativa descartada:** Grid de tarjetas verticales como las de habitaciones. Se quiere algo visualmente distinto — la horizontalidad da sensación de "ticket de reserva" / "boarding pass".

---

### D4: Badge de estado calculado en el frontend
**Decisión:** El estado (PRÓXIMA / EN CURSO / PASADA) se calcula en JavaScript comparando las fechas con `new Date()`. No se añade campo al DTO.

**Rationale:** Es lógica de presentación pura; el backend ya tiene las fechas y no necesita saber el "estado" conceptual.

---

### D5: Ordenación de reservas
**Decisión:** EN CURSO primero, luego PRÓXIMAS (más cercana primero), luego PASADAS (más reciente primero).

**Rationale:** Lo más relevante para el usuario es lo que está pasando ahora y lo que viene próximamente.

## Risks / Trade-offs

- **Reservas PASADAS con imagen rota**: si el tipo de habitación ya no existe en `TIPO_IMAGES`, la imagen fallará. Mitigación: fallback a un placeholder oscuro con el nombre del tipo.
- **Cancelar reserva activa por error**: el botón "Cancelar" solo se muestra en PRÓXIMAS, nunca en EN CURSO o PASADAS. Protección suficiente para este contexto.

## Migration Plan

Sin cambios de esquema. El nuevo endpoint es aditivo — no afecta a endpoints existentes.
