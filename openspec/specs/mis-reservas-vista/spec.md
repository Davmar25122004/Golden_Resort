# Spec: Mis Reservas (Vista de Cliente)

## Purpose

Permitir que un usuario autenticado visualice sus reservas pasadas y futuras, con detalles como tipo de habitación, número, fechas y estado, así como permitir la cancelación de reservas que aún no han comenzado (PRÓXIMAS).

## Requirements

### Requirement: Endpoint de reservas del usuario autenticado
El sistema SHALL exponer `GET /api/reservas/mis-reservas` que devuelve la lista de reservas del usuario en sesión como DTOs planos, sin referencias circulares entre entidades JPA.

#### Scenario: Cliente autenticado consulta sus reservas
- **WHEN** un usuario autenticado llama a `GET /api/reservas/mis-reservas`
- **THEN** el sistema responde 200 OK con una lista de objetos `{ id, fechaEntrada, fechaSalida, habitacionTipo, habitacionNumero, precioNoche }`

#### Scenario: Cliente sin reservas
- **WHEN** el usuario autenticado no tiene ninguna reserva
- **THEN** el sistema responde 200 OK con una lista vacía `[]`

#### Scenario: Usuario no autenticado
- **WHEN** se llama al endpoint sin sesión activa
- **THEN** el sistema responde 401 Unauthorized

### Requirement: Vista de reservas del cliente con tarjetas horizontales
El sistema SHALL mostrar la sección "Mis Reservas" con una tarjeta por reserva en layout horizontal (imagen izquierda, detalles derecha), coherente con el design system del hotel pero visualmente distinta de las cards de habitaciones.

#### Scenario: Renderizado de tarjeta con datos completos
- **WHEN** el frontend recibe una reserva del endpoint
- **THEN** cada tarjeta muestra: imagen del tipo de habitación, tipo, número de habitación, fechas de entrada y salida, número de noches, precio total (precioNoche × noches) y badge de estado

#### Scenario: Estado PRÓXIMA
- **WHEN** la fecha de entrada es posterior a hoy
- **THEN** el badge muestra "PRÓXIMA" en color `var(--gold)` y aparece el botón "Cancelar"

#### Scenario: Estado EN CURSO
- **WHEN** hoy está entre fecha de entrada y fecha de salida (inclusive)
- **THEN** el badge muestra "EN CURSO" en verde (#27ae60) y no aparece botón de cancelación

#### Scenario: Estado PASADA
- **WHEN** la fecha de salida es anterior a hoy
- **THEN** el badge muestra "PASADA" en `var(--text-muted-custom)` gris y la tarjeta tiene opacidad reducida; no aparece botón de cancelación

### Requirement: Estado vacío cuando no hay reservas
El sistema SHALL mostrar un mensaje elegante con CTA cuando el cliente no tiene reservas.

#### Scenario: Sin reservas
- **WHEN** el endpoint devuelve lista vacía
- **THEN** se muestra un mensaje "Todavía no tienes reservas" y un botón "Explorar habitaciones" que navega al inicio

### Requirement: Cancelación de reservas futuras
El sistema SHALL permitir cancelar reservas con estado PRÓXIMA desde la vista "Mis Reservas".

#### Scenario: Cancelación exitosa
- **WHEN** el cliente hace clic en "Cancelar" en una reserva PRÓXIMA y confirma
- **THEN** el frontend llama a `DELETE /api/reservas/{id}`, la tarjeta desaparece y la lista se refresca

#### Scenario: Cancelación solo disponible en reservas PRÓXIMAS
- **WHEN** una reserva tiene estado EN CURSO o PASADA
- **THEN** no se muestra el botón "Cancelar" en esa tarjeta
