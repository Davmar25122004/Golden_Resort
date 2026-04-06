## 1. Seguridad y Configuración

- [x] 1.1 Actualizar `SecurityConfig` para proteger `/api/admin/**` con `ROLE_ADMIN`
- [x] 1.2 Añadir reglas en `SecurityConfig` para POST/PUT/DELETE en `/api/habitaciones/**` y `/api/servicios/**` con `ROLE_ADMIN`

## 2. AdminController (nuevo)

- [x] 2.1 Crear `AdminController.java` con `@RequestMapping("/api/admin")` y `@PreAuthorize("hasRole('ADMIN')")`
- [x] 2.2 Implementar `GET /api/admin/stats` — calcular reservasHoy, reservasMes, ingresosTotal (habitación + servicios), ocupacionHoy y proximasLlegadas (hasta 10)
- [x] 2.3 Implementar `GET /api/admin/usuarios` — devolver lista de usuarios con id, nombre, email y rol (sin password)

## 3. HabitacionController — Ampliar

- [x] 3.1 Añadir `POST /api/habitaciones` con `@PreAuthorize("hasRole('ADMIN')")` — crear habitación, devolver 201; manejar 409 si número duplicado
- [x] 3.2 Añadir `PUT /api/habitaciones/{id}` con `@PreAuthorize("hasRole('ADMIN')")` — actualizar campos, devolver 200 o 404
- [x] 3.3 Añadir `DELETE /api/habitaciones/{id}` con `@PreAuthorize("hasRole('ADMIN')")` y `@Transactional` — eliminar reserva_servicio → reservas → habitación, devolver 204 o 404

## 4. ServicioController — Ampliar

- [x] 4.1 Añadir `POST /api/servicios` con `@PreAuthorize("hasRole('ADMIN')")` — crear servicio, devolver 201; manejar 409 si nombre duplicado
- [x] 4.2 Añadir `PUT /api/servicios/{id}` con `@PreAuthorize("hasRole('ADMIN')")` — actualizar nombre y precio, devolver 200 o 404
- [x] 4.3 Añadir `DELETE /api/servicios/{id}` con `@PreAuthorize("hasRole('ADMIN')")` — eliminar servicio, devolver 204 o 404

## 5. ReservaController — Completar

- [x] 5.1 Verificar que `GET /api/reservas` devuelve datos enriquecidos (usuario, habitación, servicios) para ADMIN y filtrado por usuario para CLIENTE
- [x] 5.2 Añadir `DELETE /api/reservas/{id}` con `@Transactional` — eliminar reserva_servicio y reserva; devolver 204 o 404; verificar que CLIENTE solo puede borrar las suyas

## 6. Frontend — Panel Admin (app.js)

- [x] 6.1 Reescribir `showAdmin()` para renderizar el contenedor de tabs (Dashboard | Reservas | Habitaciones | Servicios | Usuarios) usando `showDynamic()`
- [x] 6.2 Implementar `loadAdminDashboard()` — llamar a `/api/admin/stats` y renderizar 4 tarjetas métricas + tabla de próximas llegadas
- [x] 6.3 Implementar `loadAdminReservas()` — llamar a `/api/reservas`, renderizar tabla con columnas cliente/habitación/fechas/total + botón Cancelar con confirmación
- [x] 6.4 Implementar `loadAdminHabitaciones()` — llamar a `/api/habitaciones`, renderizar tabla con botones Editar/Eliminar + botón "Nueva Habitación"
- [x] 6.5 Implementar modal crear/editar habitación con formulario (numero, tipo, precioNoche, descripcion) y submit a POST o PUT según contexto
- [x] 6.6 Implementar `deleteHabitacion(id)` — confirmar con aviso de cancelación de reservas, llamar DELETE, refrescar tabla
- [x] 6.7 Implementar `loadAdminServicios()` — llamar a `/api/servicios`, renderizar tabla con botones Editar/Eliminar + botón "Nuevo Servicio"
- [x] 6.8 Implementar modal crear/editar servicio con formulario (nombre, precio) y submit a POST o PUT
- [x] 6.9 Implementar `deleteServicio(id)` — confirmar, llamar DELETE, refrescar tabla
- [x] 6.10 Implementar `loadAdminUsuarios()` — llamar a `/api/admin/usuarios`, renderizar tabla de solo lectura (nombre, email, rol)
- [x] 6.11 Conectar los tabs para que cada uno llame a su función de carga al activarse
