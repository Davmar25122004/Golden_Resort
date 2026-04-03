## 1. Backend — Query de disponibilidad en HabitacionRepository

- [x] 1.1 Añadir query JPQL `findAvailableByTipo` en `HabitacionRepository.java`: devuelve habitaciones de un tipo cuyo `id` no aparece en reservas solapadas con el rango de fechas dado (usar `Pageable` para traer solo 1 resultado cuando se necesite)
- [x] 1.2 Añadir query JPQL `countAvailableByTipo` en `HabitacionRepository.java`: cuenta cuántas habitaciones de un tipo no tienen reservas solapadas, para calcular disponibilidad por tipo

## 2. Backend — Endpoint de disponibilidad por tipo

- [x] 2.1 Añadir método `getDisponibles(@RequestParam fechaEntrada, @RequestParam fechaSalida)` en `HabitacionController.java` mapeado a `GET /api/habitaciones/disponibles`
- [x] 2.2 Validar que `fechaEntrada` sea anterior a `fechaSalida`; retornar 400 si no
- [x] 2.3 Para cada tipo (NORMAL, DOBLE, SUITE, LUJO), llamar a `countAvailableByTipo` y construir el `Map<String, Long>` de respuesta
- [x] 2.4 Permitir acceso público al endpoint en `SecurityConfig.java` (añadir `/api/habitaciones/disponibles` a los paths sin autenticación)

## 3. Backend — Endpoint reservar por tipo

- [x] 3.1 Añadir clase interna `ReservaPorTipoRequest` en `ReservaController.java` con campos `tipo` (String), `fechaEntrada`, `fechaSalida`
- [x] 3.2 Añadir método `crearPorTipo(@RequestBody, Authentication)` mapeado a `POST /api/reservas/por-tipo`
- [x] 3.3 Obtener el `Usuario` desde el email del `Authentication` de Spring Security usando `UsuarioRepository.findByEmail()`
- [x] 3.4 Validar que `fechaEntrada < fechaSalida`; retornar 400 si no
- [x] 3.5 Llamar a `findAvailableByTipo` con `Pageable.ofSize(1)`; si la lista está vacía retornar 409 Conflict con mensaje de error
- [x] 3.6 Crear y guardar la `Reserva` con la habitación encontrada, las fechas y el usuario; retornar 200 OK con la reserva creada
- [x] 3.7 Verificar en `SecurityConfig.java` que `POST /api/reservas/por-tipo` requiere autenticación

## 4. Frontend — loadRooms() con disponibilidad real

- [x] 4.1 En `loadRooms()`, cuando `state.searchDates` está definido, hacer `fetch` a `/api/habitaciones/disponibles?fechaEntrada=X&fechaSalida=Y` para obtener los conteos reales
- [x] 4.2 Usar los conteos devueltos por la API (en vez de `h.count` del total) para calcular el badge de disponibilidad y si el botón está habilitado
- [x] 4.3 Si la API devuelve 0 para un tipo, mostrar badge "● Sin disponibilidad" y deshabilitar el botón "Reservar" para ese tipo

## 5. Frontend — Flujo de reserva en selectRoom()

- [x] 5.1 En `selectRoom()`, reemplazar el botón "Próximamente" por un flujo de reserva real
- [x] 5.2 Si `state.searchDates` está definido, mostrar directamente las fechas seleccionadas y un botón "Confirmar Reserva"
- [x] 5.3 Si `state.searchDates` es null, mostrar dos inputs de fecha con Flatpickr (fechaEntrada, fechaSalida) y un botón "Confirmar Reserva"
- [x] 5.4 Al hacer clic en "Confirmar Reserva", hacer `POST /api/reservas/por-tipo` con `{ tipo, fechaEntrada, fechaSalida }`
- [x] 5.5 Si la respuesta es 200 OK: mostrar mensaje de éxito y llamar a `loadRooms()` para refrescar los contadores
- [x] 5.6 Si la respuesta es 409: mostrar mensaje "No hay habitaciones disponibles de ese tipo para las fechas seleccionadas"
- [x] 5.7 Si la respuesta es 401: redirigir al modal de login con `openAuthModal()`
