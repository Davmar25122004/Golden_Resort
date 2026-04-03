## 1. Base de Datos — Migración SQL

- [x] 1.1 Crear tabla `room_service_item` (id, nombre, descripcion, precio, categoria CHECK, disponible, imagen_url) con secuencia propia
- [x] 1.2 Crear tabla `pedido_room_service` (id, reserva_id FK, item_id FK con ON DELETE RESTRICT, cantidad, fecha_pedido) con secuencia propia
- [x] 1.3 Insertar datos de ejemplo: al menos 2 ítems por cada categoría (DESAYUNO, ALMUERZO, CENA, SNACKS, BEBIDAS) en Supabase

## 2. Backend — Entidades y Repositorios

- [x] 2.1 Crear entidad `RoomServiceItem.java` con campos id, nombre, descripcion, precio, categoria (enum), disponible, imagenUrl y anotaciones JPA
- [x] 2.2 Crear enum `CategoriaRoomService.java` con valores DESAYUNO, ALMUERZO, CENA, SNACKS, BEBIDAS
- [x] 2.3 Crear entidad `PedidoRoomService.java` con campos id, reserva (ManyToOne), item (ManyToOne), cantidad, fechaPedido
- [x] 2.4 Crear `RoomServiceItemRepository.java` (JpaRepository, método findByDisponibleTrue, findAllGrouped o similar)
- [x] 2.5 Crear `PedidoRoomServiceRepository.java` (JpaRepository, métodos findByReservaId, deleteByReservaId)

## 3. Backend — Controlador y Endpoints

- [x] 3.1 Crear `RoomServiceController.java` con mapeo base `/api/room-service`
- [x] 3.2 Implementar `GET /api/room-service/items` — devuelve todos los ítems (cualquier usuario autenticado)
- [x] 3.3 Implementar `POST /api/room-service/items` — crear ítem (solo ADMIN, con @PreAuthorize)
- [x] 3.4 Implementar `PUT /api/room-service/items/{id}` — actualizar ítem (solo ADMIN)
- [x] 3.5 Implementar `DELETE /api/room-service/items/{id}` — eliminar ítem (solo ADMIN)
- [x] 3.6 Implementar `GET /api/room-service/pedidos/{reservaId}` — listar pedido de una reserva con DTO (itemId, nombre, precio, cantidad, subtotal)
- [x] 3.7 Implementar `POST /api/room-service/pedidos/{reservaId}` — añadir ítem al pedido (validar reserva e ítem existen)
- [x] 3.8 Implementar `PUT /api/room-service/pedidos/{pedidoId}` — actualizar cantidad de una línea
- [x] 3.9 Implementar `DELETE /api/room-service/pedidos/{pedidoId}` — eliminar línea del pedido

## 4. Backend — Actualizar Cálculo del Total

- [x] 4.1 Inyectar `PedidoRoomServiceRepository` en `ReservaController`
- [x] 4.2 En el método de mapeo a `ReservaDTO` (usado en `listar` y `misReservas`), sumar `Σ(item.precio × cantidad)` de los pedidos de room service de esa reserva al campo `total`
- [x] 4.3 Añadir campo `subtotalRoomService` al `ReservaDTO` para que el frontend pueda mostrarlo por separado

## 5. Frontend — Carta en Modal de Reserva

- [x] 5.1 Al cargar el modal de reserva (`selectRoom`), hacer fetch a `GET /api/room-service/items` y almacenar en variable local
- [x] 5.2 Cuando el checkbox de Room Service (id=6) se activa, desplegar la carta HTML agrupada por categoría con selectores `[− n +]` para cada ítem (cantidad inicial 0)
- [x] 5.3 Calcular y mostrar subtotal de room service en tiempo real al cambiar cantidades
- [x] 5.4 Incluir el subtotal de room service en el total estimado de la reserva (junto con habitación y otros servicios)
- [x] 5.5 Al confirmar la reserva (`confirmarReserva`), tras crear la reserva, hacer POST `/api/room-service/pedidos/{reservaId}` por cada ítem con cantidad > 0
- [x] 5.6 Si el checkbox de Room Service se desactiva, limpiar la carta y poner todas las cantidades a 0

## 6. Frontend — Gestión en Mis Reservas

- [x] 6.1 En `loadMisReservas`, para cada reserva hacer fetch a `GET /api/room-service/pedidos/{reservaId}` y añadir los ítems a la tarjeta (si hay pedido: mostrar lista con cantidad y subtotal)
- [x] 6.2 Añadir botón "Gestionar Room Service" en tarjetas con estado PRÓXIMA o EN CURSO
- [x] 6.3 Al hacer clic en el botón, abrir modal/panel con la carta completa y las cantidades actuales pre-rellenadas
- [x] 6.4 Al guardar cambios: PUT para ítems con cantidad modificada, POST para ítems nuevos con cantidad > 0, DELETE para ítems puestos a 0
- [x] 6.5 Tras guardar, refrescar la sección de room service de esa tarjeta

## 7. Frontend — Sección Admin para Gestionar la Carta

- [x] 7.1 Añadir sección "Carta Room Service" en el panel de administración (`AdminController` / template admin)
- [x] 7.2 Cargar y mostrar ítems desde `GET /api/room-service/items` agrupados por categoría
- [x] 7.3 Implementar formulario "Nuevo ítem" (nombre, descripcion, precio, categoria, disponible) con POST al backend
- [x] 7.4 Implementar botón "Editar" por ítem: formulario pre-rellenado con datos actuales, PUT al backend al guardar
- [x] 7.5 Implementar botón "Eliminar" por ítem con confirmación, DELETE al backend y refresco de lista

## 8. Seguridad y Permisos

- [x] 8.1 Verificar que `SecurityConfig` permite acceso autenticado a `/api/room-service/**` y restringe métodos POST/PUT/DELETE a ADMIN
- [x] 8.2 En `RoomServiceController`, validar que el usuario que gestiona un pedido es el propietario de la reserva o un ADMIN
