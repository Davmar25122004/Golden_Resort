## ADDED Requirements

### Requirement: Mostrar ítems de Room Service en tarjeta de reserva
El sistema SHALL mostrar los ítems pedidos de Room Service (si los hay) dentro de la tarjeta de cada reserva en la vista "Mis Reservas".

#### Scenario: Tarjeta con pedido de room service
- **WHEN** una reserva tiene ítems de room service asociados
- **THEN** la tarjeta muestra una sección "Room Service" con cada ítem (nombre, cantidad, subtotal por línea) y el total del pedido

#### Scenario: Tarjeta sin pedido de room service
- **WHEN** una reserva no tiene ítems de room service
- **THEN** la sección de Room Service no aparece (o muestra "Sin pedido") con opción de añadir

### Requirement: Botón de gestión de pedido de Room Service por reserva
El sistema SHALL mostrar un botón "Gestionar Room Service" en cada tarjeta de reserva que abre la carta completa para añadir, modificar o borrar ítems del pedido.

#### Scenario: Abrir gestión desde tarjeta PRÓXIMA o EN CURSO
- **WHEN** el usuario hace clic en "Gestionar Room Service" en una reserva PRÓXIMA o EN CURSO
- **THEN** se abre la carta con las cantidades actuales pre-cargadas

#### Scenario: Gestión no disponible en reservas PASADAS
- **WHEN** la reserva tiene estado PASADA
- **THEN** el botón "Gestionar Room Service" no se muestra (solo lectura)
