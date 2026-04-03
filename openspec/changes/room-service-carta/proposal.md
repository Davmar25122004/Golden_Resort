## Why

El Room Service existe como servicio de tarifa plana (€20), pero no refleja una experiencia real: el huésped no puede elegir qué platos quiere ni ver el coste detallado. Añadir una carta real con ítems y precios convierte el Room Service en un servicio diferenciador que añade valor al hotel y aumenta el ticket medio por reserva.

## What Changes

- **Nueva carta del Room Service**: ítems reales (platos/bebidas) agrupados por categoría (DESAYUNO, ALMUERZO, CENA, SNACKS, BEBIDAS), cada uno con nombre, descripción, precio y disponibilidad.
- **Gestión admin de la carta**: el administrador puede crear, editar y eliminar ítems de la carta desde el panel de administración.
- **Pedidos de Room Service por reserva**: el usuario puede seleccionar ítems de la carta al hacer una reserva y también añadir/modificar/borrar ítems desde "Mis Reservas".
- **Total de reserva actualizado**: el total incluye el subtotal de los ítems de room service pedidos (precio × cantidad).
- El `servicio` id=6 ("Room Service", €20) se mantiene sin cambios en la tabla `servicio`; la carta opera de forma independiente mediante dos nuevas tablas.

## Capabilities

### New Capabilities
- `room-service-carta`: Carta de Room Service con ítems reales, CRUD de admin, pedidos por reserva y cálculo de subtotal.

### Modified Capabilities
- `mis-reservas-vista`: Los pedidos de Room Service (ítems seleccionados) se muestran y gestionan desde la vista de mis reservas.
- `servicios-en-reserva`: El cálculo del total de reserva debe incluir el subtotal de ítems de room service.

## Impact

- **Base de datos**: 2 nuevas tablas (`room_service_item`, `pedido_room_service`)
- **Backend**: 2 nuevas entidades + repositorios, 1 nuevo controlador (`RoomServiceController`) con ~8 endpoints, actualización de `ReservaController` para incluir subtotal de room service en el total
- **Frontend**: Carta interactiva en modal de reserva (al seleccionar Room Service), sección de gestión de pedidos en "Mis Reservas", sección de CRUD de carta en panel Admin
- **APIs afectadas**: `/api/reservas` (total), nuevas rutas `/api/room-service/**`
