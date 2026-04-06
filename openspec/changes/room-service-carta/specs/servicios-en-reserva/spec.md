## MODIFIED Requirements

### Requirement: Total calculado en el DTO de reserva
El sistema SHALL incluir en el DTO de reserva la lista de servicios contratados, los ítems de room service pedidos y el costo total calculado incluyendo ambos.

#### Scenario: DTO con servicios y total
- **WHEN** un usuario consulta GET /api/reservas/mis-reservas
- **THEN** cada reserva en la respuesta incluye la lista de servicios (nombre, precio, cantidad) y el campo total calculado como (días × precioNoche) + Σ(servicio.precio × cantidad) + Σ(roomServiceItem.precio × cantidad)

#### Scenario: DTO sin servicios
- **WHEN** una reserva no tiene servicios asociados ni ítems de room service
- **THEN** el campo servicios es una lista vacía y el total equivale solo a días × precioNoche

#### Scenario: DTO con solo servicios normales (sin room service items)
- **WHEN** una reserva tiene servicios normales pero ningún ítem de room service
- **THEN** el total es (días × precioNoche) + Σ(servicio.precio × cantidad), igual que antes

#### Scenario: DTO con solo ítems de room service (sin otros servicios)
- **WHEN** una reserva tiene ítems de room service pero ningún otro servicio
- **THEN** el total es (días × precioNoche) + Σ(roomServiceItem.precio × cantidad)

## ADDED Requirements

### Requirement: Mostrar subtotal de room service en el frontend al reservar
El sistema SHALL mostrar el subtotal de los ítems de room service seleccionados de forma separada al total estimado de la reserva, y actualizarlo en tiempo real conforme el usuario ajusta cantidades.

#### Scenario: Total estimado incluye room service
- **WHEN** el usuario selecciona ítems de room service en el modal de reserva
- **THEN** el total estimado mostrado suma precio habitación × noches + otros servicios + subtotal room service
