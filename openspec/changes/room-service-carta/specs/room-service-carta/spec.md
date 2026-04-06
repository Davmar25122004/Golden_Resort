## ADDED Requirements

### Requirement: Carta de ítems del Room Service
El sistema SHALL exponer una carta real de ítems de Room Service agrupados por categoría, con datos almacenados en la tabla `room_service_item`. Los ítems tienen nombre, descripción, precio, categoría (DESAYUNO, ALMUERZO, CENA, SNACKS, BEBIDAS) y flag de disponibilidad.

#### Scenario: Listar carta completa
- **WHEN** cualquier usuario autenticado hace GET /api/room-service/items
- **THEN** el sistema responde 200 OK con todos los ítems disponibles incluyendo id, nombre, descripcion, precio, categoria y disponible

#### Scenario: Carta vacía
- **WHEN** no hay ítems en la base de datos
- **THEN** el sistema responde 200 OK con lista vacía []

### Requirement: CRUD de ítems de la carta (Admin)
El sistema SHALL permitir al administrador crear, actualizar y eliminar ítems de la carta del Room Service.

#### Scenario: Admin crea un ítem
- **WHEN** un usuario con rol ADMIN hace POST /api/room-service/items con nombre, precio y categoría válidos
- **THEN** el sistema persiste el ítem y responde 201 Created con el ítem creado

#### Scenario: Admin actualiza un ítem
- **WHEN** un usuario con rol ADMIN hace PUT /api/room-service/items/{id} con nuevos valores
- **THEN** el sistema actualiza el ítem y responde 200 OK con el ítem actualizado

#### Scenario: Admin elimina un ítem
- **WHEN** un usuario con rol ADMIN hace DELETE /api/room-service/items/{id}
- **THEN** el sistema elimina el ítem y responde 204 No Content

#### Scenario: No-admin intenta crear ítem
- **WHEN** un usuario sin rol ADMIN intenta POST /api/room-service/items
- **THEN** el sistema responde 403 Forbidden

#### Scenario: Ítem no encontrado al actualizar
- **WHEN** el id del ítem no existe
- **THEN** el sistema responde 404 Not Found

### Requirement: Pedidos de Room Service por reserva
El sistema SHALL permitir al usuario añadir, modificar cantidad y eliminar ítems de un pedido de Room Service asociado a una reserva concreta.

#### Scenario: Ver pedido de una reserva
- **WHEN** un usuario autenticado hace GET /api/room-service/pedidos/{reservaId}
- **THEN** el sistema responde 200 OK con la lista de ítems pedidos (itemId, nombre, precio, cantidad, subtotal por línea)

#### Scenario: Añadir ítem al pedido
- **WHEN** un usuario autenticado hace POST /api/room-service/pedidos/{reservaId} con itemId y cantidad válidos
- **THEN** el sistema crea el registro en pedido_room_service y responde 201 Created

#### Scenario: Modificar cantidad de un ítem pedido
- **WHEN** un usuario autenticado hace PUT /api/room-service/pedidos/{pedidoId} con nueva cantidad
- **THEN** el sistema actualiza la cantidad y responde 200 OK

#### Scenario: Eliminar ítem del pedido
- **WHEN** un usuario autenticado hace DELETE /api/room-service/pedidos/{pedidoId}
- **THEN** el sistema elimina la línea y responde 204 No Content

#### Scenario: Reserva no encontrada al crear pedido
- **WHEN** el reservaId no existe
- **THEN** el sistema responde 404 Not Found

#### Scenario: Ítem no encontrado al crear pedido
- **WHEN** el itemId no existe en room_service_item
- **THEN** el sistema responde 404 Not Found

### Requirement: Carta interactiva en el modal de reserva
El sistema SHALL mostrar la carta del Room Service desplegable en el modal de reserva cuando el usuario activa la opción de Room Service, con selectores de cantidad por ítem y subtotal actualizado en tiempo real.

#### Scenario: Desplegar carta al activar Room Service
- **WHEN** el usuario activa el checkbox de Room Service en el modal de reserva
- **THEN** se despliega la carta agrupada por categoría con selectores [− n +] para cada ítem

#### Scenario: Actualización de subtotal en tiempo real
- **WHEN** el usuario modifica la cantidad de cualquier ítem
- **THEN** el subtotal del Room Service se recalcula y muestra al instante

#### Scenario: Enviar pedido al confirmar reserva
- **WHEN** el usuario confirma la reserva con ítems de room service seleccionados (cantidad > 0)
- **THEN** el frontend hace POST /api/room-service/pedidos/{reservaId} para cada ítem seleccionado tras crear la reserva

### Requirement: Gestión de pedidos desde Mis Reservas
El sistema SHALL mostrar los ítems pedidos de Room Service en la tarjeta de cada reserva y permitir añadir, modificar y borrar ítems desde esa vista.

#### Scenario: Ver ítems de room service en tarjeta de reserva
- **WHEN** el frontend carga "Mis Reservas"
- **THEN** cada tarjeta muestra la lista de ítems pedidos con cantidad, precio unitario y subtotal de room service

#### Scenario: Abrir gestión de pedido
- **WHEN** el usuario hace clic en "Gestionar Room Service" en una tarjeta de reserva
- **THEN** se abre la carta completa con las cantidades actuales pre-rellenadas para editar

#### Scenario: Guardar cambios del pedido
- **WHEN** el usuario modifica cantidades y confirma
- **THEN** el frontend sincroniza los cambios (PUT para existentes, POST para nuevos, DELETE para los puestos a 0) y la tarjeta refleja el pedido actualizado

### Requirement: Gestión de la carta en el panel Admin
El sistema SHALL mostrar una sección "Carta Room Service" en el panel de administración con la lista de ítems agrupados por categoría y controles para crear, editar y eliminar.

#### Scenario: Listar ítems en panel admin
- **WHEN** el administrador accede al panel
- **THEN** se muestra la sección de Room Service con todos los ítems agrupados por categoría

#### Scenario: Crear ítem desde panel
- **WHEN** el admin rellena el formulario de nuevo ítem (nombre, precio, categoría) y guarda
- **THEN** el ítem aparece inmediatamente en la lista y se persiste en el backend

#### Scenario: Editar ítem desde panel
- **WHEN** el admin hace clic en "Editar" en un ítem y modifica sus datos
- **THEN** los cambios se persisten y la lista se actualiza

#### Scenario: Eliminar ítem desde panel
- **WHEN** el admin hace clic en "Eliminar" y confirma
- **THEN** el ítem se borra del backend y desaparece de la lista
