## ADDED Requirements

### Requirement: Admin puede ver métricas del hotel en tiempo real
El sistema SHALL proveer un endpoint `GET /api/admin/stats` accesible solo para usuarios con `ROLE_ADMIN` que devuelva métricas agregadas del hotel.

La respuesta SHALL incluir:
- `reservasHoy`: número de reservas con `fecha_entrada` igual a la fecha actual
- `reservasMes`: número de reservas con `fecha_entrada` en el mes y año actuales
- `ingresosTotal`: suma de (días de estancia × precio_noche) + suma de (cantidad × precio de servicio) de todas las reservas
- `ocupacionHoy`: número de habitaciones con una reserva activa hoy (fecha_entrada <= hoy < fecha_salida) sobre el total de habitaciones
- `proximasLlegadas`: lista de hasta 10 reservas con `fecha_entrada >= hoy`, ordenadas por fecha ascendente, con nombre del cliente, número y tipo de habitación

#### Scenario: Admin obtiene stats correctamente
- **WHEN** un usuario con ROLE_ADMIN hace GET /api/admin/stats
- **THEN** el sistema devuelve 200 OK con el objeto de métricas completo

#### Scenario: Cliente no puede acceder a stats
- **WHEN** un usuario con ROLE_CLIENTE hace GET /api/admin/stats
- **THEN** el sistema devuelve 403 Forbidden

#### Scenario: Ingresos incluyen habitación y servicios
- **WHEN** existe una reserva de 2 noches a 150€ con un servicio de 45€
- **THEN** `ingresosTotal` incluye 300€ (habitación) + 45€ (servicio) = 345€

### Requirement: El dashboard se muestra como primera tab del panel admin
El frontend SHALL mostrar el dashboard de métricas como tab activo por defecto al abrir el panel admin. Las métricas SHALL mostrarse en tarjetas visuales y las próximas llegadas en una tabla.

#### Scenario: Admin abre el panel admin
- **WHEN** un usuario ADMIN hace clic en "Admin" en la navbar
- **THEN** el sistema muestra el panel con el tab Dashboard activo y las métricas cargadas
