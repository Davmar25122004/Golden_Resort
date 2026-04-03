## Context

El proyecto es un TFG de gestión hotelera con Spring Boot + Thymeleaf. La UI es una SPA simulada: una única plantilla `index.html` que alterna entre secciones visibles y un área de contenido dinámico (`#dynamic-view`) mediante `showDynamic(html)` / `showLanding()`. El frontend usa Swiper.js (ya cargado), Bootstrap 5.3 y AOS. La BD es PostgreSQL en Supabase.

Estado actual relevante:
- `loadRooms()` usa datos hardcodeados; nunca llama a `/api/habitaciones`
- `selectRoom()` ignora parámetros y muestra un mensaje de error
- La tabla `habitacion` tiene 40 filas (10 por tipo) con `descripcion` NULL
- El endpoint `/api/habitaciones` existe y devuelve todos los campos incluyendo `descripcion`

## Goals / Non-Goals

**Goals:**
- Conectar el carrusel de habitaciones a datos reales de la API
- Mostrar una vista de detalle por tipo con carrusel Swiper embebido + descripción de la BD
- Poblar las descripciones en la BD vía SQL directo en Supabase
- Badge de disponibilidad: "Disponible" por defecto, "Quedan N" cuando hay fechas buscadas
- Botón "Reservar" en detalle: visible pero deshabilitado ("Próximamente")

**Non-Goals:**
- Implementar el flujo de reserva real
- Filtrado de disponibilidad por fechas en el backend (queda para cambio futuro)
- Modificar controladores Java ni SecurityConfig
- Registro de usuarios

## Decisions

### D1: Agrupación por tipo en el frontend, no en el backend

El endpoint `/api/habitaciones` devuelve las 40 habitaciones individuales. Se agrupa por tipo en el frontend (`loadRooms()`) en lugar de añadir un nuevo endpoint de resumen.

**Alternativa descartada**: Añadir `GET /api/habitaciones/resumen` que devuelva un objeto por tipo. Requeriría cambios en Java innecesarios dado que el agrupado en JS es trivial con los 40 registros.

**Rationale**: Mínimo cambio en el backend; los 40 registros son pocos y el agrupado es O(n) simple.

### D2: Swiper nuevo para el carrusel de detalle, no reutilizar el lightbox

La vista de detalle inicializa un Swiper nuevo dentro del HTML inyectado por `showDynamic()`. No se reutiliza el lightbox (overlay fullscreen).

**Alternativa descartada**: Incrustar el markup del lightbox como contenido embebido. El lightbox tiene animaciones y posicionamiento diseñados para fullscreen; reutilizarlo requeriría sobrescribir muchos estilos.

**Rationale**: Swiper ya está cargado globalmente. Un `new Swiper('.detailSwiper', {...})` dentro del HTML inyectado es suficiente y mantiene consistencia visual con el carrusel principal.

### D3: Descripciones fijas por tipo vía UPDATE en BD

Se actualiza `descripcion` con un `UPDATE ... WHERE tipo = '...'` en Supabase. Todas las habitaciones del mismo tipo comparten la misma descripción (igual que comparten precio).

**Alternativa descartada**: Definir las descripciones solo en `app.js` (como `TIPO_IMAGES`). Dejaría la BD sin datos reales, lo que reduce el valor del TFG como proyecto con backend integrado.

**Rationale**: El campo ya existe en el modelo; poblar la BD demuestra integración real frontend-backend-BD.

### D4: Disponibilidad sin fechas = "Disponible" (badge genérico)

Cuando `state.searchDates` es null, la badge muestra "● Disponible" para todos los tipos. Cuando hay fechas, se filtra contando habitaciones del tipo cuyo `id` no tenga reservas solapadas — esto se calcula en el frontend con los datos ya descargados de la API.

**Rationale**: Evita un endpoint adicional de disponibilidad por fechas. Los IDs de habitación ya están en el response de `/api/habitaciones`, y las reservas solapadas se pueden consultar con un endpoint existente o calcularse localmente si el volumen es bajo. Para v1, la lógica de fechas puede mostrar el total del tipo como disponibles (ya que `reserva` está vacía).

## Risks / Trade-offs

- **Swiper destruido al volver**: Al hacer `showLanding()` y volver, `roomSwiper` se destruye y recrea correctamente (ya existe esta lógica). El `detailSwiper` que se crea en la vista de detalle quedará en memoria si no se destruye explícitamente → Mitigación: destruir el detailSwiper antes de llamar `showLanding()` en el botón "Volver".

- **TIPO_IMAGES con imágenes locales rotas**: NORMAL, SUITE y LUJO usan rutas `/images/*.png` locales que pueden no existir en el servidor → Mitigación: fuera del alcance de este cambio; las imágenes de DOBLE (Unsplash) sí funcionan. El carrusel de detalle usará los mismos arrays.

- **Agrupación en frontend con 0 habitaciones de un tipo**: Si la BD no tiene habitaciones de un tipo, ese tipo no aparecerá en el carrusel → comportamiento correcto, no es un riesgo.

## Migration Plan

1. Ejecutar los 4 UPDATEs de `descripcion` en Supabase (no rompe nada, campo nullable existente)
2. Desplegar cambios de `app.js` y `style.css` (cambios solo de frontend estático)
3. No hay rollback especial; revertir `app.js` a versión anterior restaura datos hardcodeados

## Open Questions

- ¿Se implementará en el futuro el filtrado real de disponibilidad por fechas llamando al backend? (queda fuera de este cambio)
- ¿Se añadirá imagen de placeholder cuando `/images/*.png` no exista en producción?
