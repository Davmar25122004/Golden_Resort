## ADDED Requirements

### Requirement: Consulta de habitaciones disponibles por tipo y rango de fechas
El sistema SHALL exponer un endpoint público `GET /api/habitaciones/disponibles?fechaEntrada=YYYY-MM-DD&fechaSalida=YYYY-MM-DD` que devuelva un objeto JSON con el número de habitaciones libres para cada tipo en el rango solicitado.

#### Scenario: Consulta exitosa con fechas válidas
- **WHEN** se llama a `GET /api/habitaciones/disponibles?fechaEntrada=2025-06-01&fechaSalida=2025-06-05`
- **THEN** el sistema responde 200 OK con `{ "NORMAL": N, "DOBLE": N, "SUITE": N, "LUJO": N }` donde N es el número de habitaciones de ese tipo sin reservas solapadas en el rango

#### Scenario: Disponibilidad 0 cuando todas las habitaciones de un tipo están reservadas
- **WHEN** las 10 habitaciones de tipo SUITE tienen reservas que solapan con el rango solicitado
- **THEN** el sistema devuelve `{ ..., "SUITE": 0, ... }` en el JSON de respuesta

#### Scenario: Parámetros de fecha ausentes o inválidos
- **WHEN** se omite `fechaEntrada` o `fechaSalida`, o `fechaEntrada >= fechaSalida`
- **THEN** el sistema responde 400 Bad Request

#### Scenario: Endpoint accesible sin autenticación
- **WHEN** un usuario no autenticado llama al endpoint con fechas válidas
- **THEN** el sistema responde 200 OK (endpoint público)

### Requirement: El frontend muestra disponibilidad real cuando hay fechas de búsqueda
El sistema SHALL actualizar los badges de disponibilidad en la sección de habitaciones usando los datos del endpoint cuando `state.searchDates` está definido.

#### Scenario: Badge actualizado tras búsqueda por fechas
- **WHEN** el usuario introduce fechaEntrada y fechaSalida en el formulario de búsqueda y lo envía
- **THEN** cada card de habitación muestra "● Quedan N" con el valor real devuelto por la API para esas fechas

#### Scenario: Botón deshabilitado cuando disponibilidad es 0
- **WHEN** el endpoint devuelve 0 para un tipo de habitación en las fechas buscadas
- **THEN** el botón "Reservar" de esa card aparece deshabilitado y con texto "Sin disponibilidad"

#### Scenario: Badge genérico sin fechas de búsqueda
- **WHEN** el usuario no ha realizado ninguna búsqueda por fechas
- **THEN** cada card muestra "● Disponible" y el botón "Reservar" permanece activo
