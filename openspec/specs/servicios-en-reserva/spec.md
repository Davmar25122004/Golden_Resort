# Spec: Servicios en Reserva

## Purpose

Permitir que los clientes contraten servicios adicionales (como desayuno, parking, etc.) tanto en el momento de crear su reserva como de forma posterior. El sistema gestiona la relación entre reservas y servicios, incluyendo las cantidades y el cálculo del total actualizado en el comprobante (DTO).

## Requirements

### Requirement: Incluir servicios al crear reserva
El sistema SHALL permitir al usuario incluir una lista opcional de servicios con cantidad al crear una reserva por tipo.

#### Scenario: Reserva creada con servicios
- **WHEN** un usuario autenticado hace POST /api/reservas/por-tipo con una lista de servicios válida
- **THEN** el sistema crea la reserva con los ReservaServicio asociados y retorna la reserva persistida

#### Scenario: Reserva creada sin servicios
- **WHEN** un usuario autenticado hace POST /api/reservas/por-tipo sin campo servicios (o lista vacía)
- **THEN** el sistema crea la reserva normalmente sin servicios asociados

#### Scenario: Servicio inexistente en la lista
- **WHEN** un usuario incluye un servicioId que no existe en el catálogo
- **THEN** el sistema retorna 400 Bad Request

### Requirement: Agregar servicio a reserva existente
El sistema SHALL permitir al usuario agregar un servicio con cantidad a una reserva ya creada.

#### Scenario: Agregar servicio exitosamente
- **WHEN** un usuario autenticado hace POST /api/reservas/{id}/servicios con servicioId y cantidad válidos
- **THEN** el sistema crea el ReservaServicio y retorna 200

#### Scenario: Reserva no encontrada al agregar servicio
- **WHEN** el id de reserva no existe
- **THEN** el sistema retorna 404 Not Found

#### Scenario: Servicio no encontrado al agregar
- **WHEN** el servicioId no existe en el catálogo
- **THEN** el sistema retorna 404 Not Found

### Requirement: Quitar servicio de reserva existente
El sistema SHALL permitir al usuario eliminar un servicio de una reserva existente.

#### Scenario: Quitar servicio exitosamente
- **WHEN** un usuario autenticado hace DELETE /api/reservas/{id}/servicios/{servicioId}
- **THEN** el sistema elimina el ReservaServicio correspondiente y retorna 204 No Content

#### Scenario: Servicio no asociado a la reserva
- **WHEN** el servicioId no está asociado a la reserva indicada
- **THEN** el sistema retorna 404 Not Found

### Requirement: Total calculado en el DTO de reserva
El sistema SHALL incluir en el DTO de reserva la lista de servicios contratados y el costo total calculado.

#### Scenario: DTO con servicios y total
- **WHEN** un usuario consulta GET /api/reservas/mis-reservas
- **THEN** cada reserva en la respuesta incluye la lista de servicios (nombre, precio, cantidad) y el campo total calculado como (días × precioNoche) + Σ(precio × cantidad)

#### Scenario: DTO sin servicios
- **WHEN** una reserva no tiene servicios asociados
- **THEN** el campo servicios es una lista vacía y el total equivale solo a días × precioNoche

### Requirement: Mostrar servicios en el frontend
El sistema SHALL mostrar los servicios disponibles con su precio durante el flujo de reserva y en la vista de mis reservas.

#### Scenario: Selección de servicios al reservar
- **WHEN** el usuario completa el formulario de reserva en el frontend
- **THEN** se muestra una lista de servicios disponibles con checkbox y precio, y el total estimado se actualiza en tiempo real

#### Scenario: Servicios visibles en mis reservas
- **WHEN** el usuario consulta sus reservas en el frontend
- **THEN** cada reserva muestra los servicios contratados y el total de la reserva
