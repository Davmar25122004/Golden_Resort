## Why

Actualmente el botón "Reservar" de cada tarjeta de habitación no hace nada útil (muestra un mensaje de error hardcodeado), y los datos de las habitaciones son ficticios en el frontend. Los usuarios no pueden ver información real ni explorar cada tipo de habitación en detalle antes de reservar.

## What Changes

- Poblar el campo `descripcion` en la base de datos Supabase para los 4 tipos de habitación (NORMAL, DOBLE, SUITE, LUJO)
- Conectar `loadRooms()` a la API real `/api/habitaciones` eliminando los datos hardcodeados
- El botón "Reservar" en cada tarjeta navega a una vista de detalle por tipo de habitación
- La vista de detalle muestra un carrusel de imágenes embebido (Swiper), la descripción real de la BD y el precio
- El botón "Reservar" dentro de la vista de detalle aparece deshabilitado con texto "Próximamente"
- La badge de disponibilidad muestra "Disponible" por defecto; cuando hay fechas buscadas, muestra las habitaciones que quedan
- El botón "Ver fotos" mantiene su comportamiento actual (abre el lightbox)

## Capabilities

### New Capabilities

- `habitacion-detail-view`: Vista de detalle por tipo de habitación con carrusel embebido, descripción real de la BD y precio

### Modified Capabilities

- (ninguna — no hay specs existentes)

## Impact

- **Base de datos**: UPDATE en tabla `habitacion` para poblar `descripcion` por tipo
- **`app.js`**: `loadRooms()` reemplaza datos hardcodeados por llamada a `/api/habitaciones`; `selectRoom()` recibe tipo/precio/descripción reales y construye la vista de detalle con Swiper
- **`style.css`**: Nuevos estilos para la vista de detalle (carrusel embebido, layout de descripción)
- **`index.html`**: Sin cambios — reutiliza el mecanismo `showDynamic()` / `#dynamic-view` existente
- **Controladores Java**: Sin cambios — `/api/habitaciones` ya existe y devuelve `descripcion`
