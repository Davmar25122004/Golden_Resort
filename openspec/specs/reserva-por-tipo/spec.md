# Spec: Reserva por Tipo de Habitación

## Purpose

Permitir que un usuario autenticado reserve una habitación indicando solo el tipo y las fechas deseadas, con el backend seleccionando automáticamente una habitación libre, y con soporte en el frontend para definir fechas inline si no hay búsqueda previa.

## Requirements

### Requirement: Reserva de habitación por tipo desde el frontend
El sistema SHALL permitir que un usuario autenticado reserve una habitación indicando solo el tipo y las fechas deseadas; el backend seleccionará automáticamente una habitación libre de ese tipo.

#### Scenario: Reserva exitosa con disponibilidad
- **WHEN** un usuario autenticado envía `POST /api/reservas/por-tipo` con `{ "tipo": "SUITE", "fechaEntrada": "2025-06-01", "fechaSalida": "2025-06-05" }`
- **THEN** el sistema encuentra la primera habitación SUITE libre, crea la reserva y responde 200 OK con los datos de la reserva creada

#### Scenario: Sin disponibilidad para el tipo y fechas solicitados
- **WHEN** las 10 habitaciones del tipo solicitado tienen reservas que solapan con las fechas indicadas
- **THEN** el sistema responde 409 Conflict con mensaje "Sin disponibilidad para ese tipo de habitación en las fechas indicadas"

#### Scenario: Usuario no autenticado intenta reservar
- **WHEN** se llama al endpoint sin sesión activa
- **THEN** el sistema responde 401 Unauthorized

#### Scenario: Fechas inválidas en la solicitud de reserva
- **WHEN** `fechaEntrada >= fechaSalida` o alguna fecha es nula
- **THEN** el sistema responde 400 Bad Request

### Requirement: Flujo de reserva en el frontend con selector de fechas
El sistema SHALL mostrar un formulario de fechas dentro del flujo de reserva cuando el usuario no ha realizado búsqueda previa.

#### Scenario: Reserva con fechas de búsqueda ya definidas
- **WHEN** el usuario hace clic en "Reservar" y `state.searchDates` está definido
- **THEN** el sistema usa directamente esas fechas y muestra el resumen con botón "Confirmar Reserva"

#### Scenario: Reserva sin fechas previas — selector inline
- **WHEN** el usuario hace clic en "Reservar" y `state.searchDates` es null
- **THEN** el sistema muestra un formulario con Flatpickr para seleccionar fechaEntrada y fechaSalida antes de confirmar

#### Scenario: Confirmación exitosa en el frontend
- **WHEN** el usuario confirma la reserva y el backend responde 200 OK
- **THEN** el frontend muestra un mensaje de éxito y recarga la sección de habitaciones para actualizar los contadores de disponibilidad

#### Scenario: Error de disponibilidad en el frontend
- **WHEN** el backend responde 409 Conflict
- **THEN** el frontend muestra un mensaje de error "No hay habitaciones disponibles de ese tipo para las fechas seleccionadas"
