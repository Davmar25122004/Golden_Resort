## Context

El proyecto es un hotel ficticio (Hotel DAW) con backend Spring Boot + JPA (Hibernate) conectado a Supabase (PostgreSQL) y un frontend en Vanilla JS + Bootstrap. La autenticación es por sesión HTTP con Spring Security. Ya existe la tabla `servicio` con el registro id=6 "Room Service" (€20 plano) y la tabla `reserva_servicio` que vincula servicios a reservas con una cantidad. El cálculo del total de la reserva vive en `ReservaController` y suma `precio × cantidad` para cada `ReservaServicio`.

## Goals / Non-Goals

**Goals:**
- Modelo de datos limpio con 2 nuevas tablas independientes del flujo de servicios existente
- CRUD completo de ítems de la carta para el admin
- Pedidos de room service vinculados a una reserva (crear, modificar cantidad, borrar)
- El total de la reserva refleja el coste real de los ítems pedidos
- Carta interactiva en el frontend: al reservar y desde "Mis Reservas"
- Datos reales del backend, no hardcodeados

**Non-Goals:**
- Sistema de estados del pedido (pendiente / en preparación / entregado) — queda fuera
- Notificaciones en tiempo real al personal de cocina
- Límite de tiempo de entrega o integración con cocina
- Modificar o eliminar el registro `servicio` id=6

## Decisions

### D1 — Tablas nuevas, independientes de `reserva_servicio`

**Decisión:** Los ítems de room service viven en `room_service_item` y los pedidos en `pedido_room_service`, completamente separados de la tabla `reserva_servicio`.

**Alternativa descartada:** Reutilizar `reserva_servicio` añadiendo un FK a un "ítem" — complica el modelo existente y mezcla dos semánticas distintas (servicios del hotel vs. platos de una carta).

**Rationale:** Separación de concerns clara, sin riesgo de romper el flujo de servicios existente.

---

### D2 — `servicio` id=6 como tarjeta de acceso a la carta

**Decisión:** El registro "Room Service" en `servicio` se mantiene tal cual (precio €20, se puede seguir añadiendo vía checkbox). La carta de ítems es una capa adicional accesible desde el modal de Room Service.

**Alternativa descartada:** Borrar el registro y sustituirlo por la carta — innecesario y puede romper reservas históricas.

**Rationale:** No tocar datos existentes, añadir sin romper.

---

### D3 — Un solo `RoomServiceController` para ítems y pedidos

**Decisión:** Agrupar los endpoints de la carta (`/api/room-service/items`) y de pedidos (`/api/room-service/pedidos`) en un único controlador.

**Rationale:** El dominio es cohesivo, no hay razón para fragmentarlo en dos clases.

---

### D4 — Total de room service calculado en `ReservaController`

**Decisión:** Añadir una consulta a `PedidoRoomServiceRepository` dentro del mapeo de `ReservaDTO` para sumar `item.precio × cantidad`.

**Alternativa:** Campo `total_room_service` persistido en `reserva` — añade sincronía problemática.

**Rationale:** El total siempre se calcula al vuelo en el DTO; mantener esa consistencia es más sencillo.

---

### D5 — Frontend: carta desplegable al activar Room Service en reserva

**Decisión:** Cuando el usuario activa el checkbox de Room Service en el modal de reserva, se despliega la carta agrupada por categoría con selectores de cantidad `[− n +]`. Al confirmar reserva, los ítems con cantidad > 0 se envían al backend.

**Rationale:** UX intuitiva, similar a una aplicación de pedido de comida. No requiere nuevo paso en el flujo.

---

### D6 — Esquema de la BD: `categoria` como VARCHAR con CHECK

**Decisión:** `room_service_item.categoria` es VARCHAR con CHECK constraint (`DESAYUNO`, `ALMUERZO`, `CENA`, `SNACKS`, `BEBIDAS`). En Java se mapea como `enum` en la entidad.

**Alternativa:** Tabla `categoria` separada — over-engineering para 5 valores fijos.

## Risks / Trade-offs

- **Reservas históricas sin ítems de room service** → El DTO devuelve lista vacía y subtotal €0, sin problema.
- **Concurrencia al modificar pedidos desde Mis Reservas** → Riesgo bajo; Spring `@Transactional` es suficiente para el scope actual.
- **La carta puede quedar desincronizada si se borra un ítem con pedidos activos** → Mitigación: `DELETE` de ítem solo si `disponible=false` primero; añadir `ON DELETE RESTRICT` en la FK de `pedido_room_service.item_id`.

## Migration Plan

1. Ejecutar migración SQL (crear tablas `room_service_item` y `pedido_room_service`)
2. Insertar datos de ejemplo en `room_service_item` (platos por categoría)
3. Desplegar backend con nuevas entidades y controlador
4. Desplegar frontend actualizado

Rollback: las tablas nuevas son aditivas; eliminarlas no afecta al resto del sistema.

## Open Questions

- ¿Se quiere imagen por ítem de la carta (campo `imagen_url`)? Incluido como nullable, puede quedar vacío inicialmente.
- ¿Límite de ítems por pedido o por reserva? Por ahora sin límite.
