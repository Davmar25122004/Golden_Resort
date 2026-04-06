## ADDED Requirements

### Requirement: Poblar descripciones de habitaciones en la BD

El sistema SHALL tener una descripción no nula para cada tipo de habitación (NORMAL, DOBLE, SUITE, LUJO) en la tabla `habitacion` de Supabase, actualizada mediante SQL.

#### Scenario: Descripción disponible en la API

- **WHEN** el frontend llama a `GET /api/habitaciones`
- **THEN** cada habitación en el JSON SHALL incluir el campo `descripcion` con texto no vacío correspondiente a su tipo

---

### Requirement: Carrusel principal conectado a datos reales

La función `loadRooms()` SHALL obtener las habitaciones desde `GET /api/habitaciones` en lugar de usar datos hardcodeados. SHALL agrupar las habitaciones por tipo y mostrar una tarjeta por tipo en el Swiper principal.

#### Scenario: Carga inicial sin fechas

- **WHEN** la página carga sin fechas seleccionadas en el buscador
- **THEN** se muestran 4 tarjetas (NORMAL, DOBLE, SUITE, LUJO) con precio y badge "● Disponible" obtenidos de la API

#### Scenario: Carga con fechas seleccionadas

- **WHEN** el usuario envía el formulario de búsqueda con `fechaEntrada` y `fechaSalida`
- **THEN** el badge de cada tarjeta SHALL mostrar "● Quedan N" donde N es el número de habitaciones de ese tipo sin reservas solapadas, o "● Sin disponibilidad" si N = 0

#### Scenario: Botón deshabilitado sin disponibilidad

- **WHEN** un tipo de habitación tiene N = 0 habitaciones disponibles para las fechas buscadas
- **THEN** el botón "Reservar" de esa tarjeta SHALL estar deshabilitado y con opacidad reducida

---

### Requirement: Navegación a vista de detalle al pulsar Reservar

El botón "Reservar" de cada tarjeta SHALL invocar `selectRoom(tipo, precio, descripcion)` con datos reales y mostrar la vista de detalle de ese tipo mediante `showDynamic()`.

#### Scenario: Click en Reservar sin sesión iniciada

- **WHEN** un usuario no autenticado pulsa "Reservar"
- **THEN** SHALL abrirse el modal de autenticación (`openAuthModal()`)

#### Scenario: Click en Reservar con sesión iniciada

- **WHEN** un usuario autenticado pulsa "Reservar" en una tarjeta disponible
- **THEN** SHALL mostrarse la vista de detalle de ese tipo ocultando hero, habitaciones, servicios, contacto y footer

---

### Requirement: Vista de detalle por tipo de habitación

La vista de detalle SHALL mostrar, para el tipo seleccionado: un carrusel Swiper con las imágenes de `TIPO_IMAGES[tipo]`, el nombre del tipo, el precio por noche obtenido de la API, la descripción obtenida de la API, y un botón "Reservar" deshabilitado con texto "Próximamente".

#### Scenario: Carrusel de imágenes embebido

- **WHEN** se muestra la vista de detalle de un tipo
- **THEN** SHALL renderizarse un Swiper con las imágenes correspondientes a ese tipo, con navegación prev/next y paginación por puntos

#### Scenario: Datos reales visibles

- **WHEN** se muestra la vista de detalle
- **THEN** SHALL mostrarse el precio real de la BD (ej. "300€ / noche") y la descripción real de la BD

#### Scenario: Botón Reservar deshabilitado

- **WHEN** se muestra la vista de detalle
- **THEN** el botón "Reservar" SHALL estar deshabilitado (`disabled`) con texto "Próximamente"

#### Scenario: Volver a habitaciones

- **WHEN** el usuario pulsa "← Volver a habitaciones"
- **THEN** SHALL ejecutarse `showLanding()`, destruirse el Swiper de detalle y volver al carrusel principal

---

### Requirement: Botón Ver fotos mantiene comportamiento actual

El botón "Ver fotos" sobre la imagen de cada tarjeta SHALL seguir abriendo el lightbox fullscreen con las imágenes del tipo correspondiente, sin cambios en su comportamiento.

#### Scenario: Lightbox no afectado

- **WHEN** el usuario pulsa "Ver fotos" en cualquier tarjeta
- **THEN** SHALL abrirse el lightbox existente con las imágenes de `TIPO_IMAGES[tipo]`
