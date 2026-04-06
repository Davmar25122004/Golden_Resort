## Why

Los servicios del hotel se muestran actualmente como tarjetas simples con emoji, nombre y precio, sin ninguna interactividad ni contenido visual. Los usuarios no tienen suficiente información para valorar y decidir qué servicios añadir a su reserva — falta contexto, imágenes y descripción de lo que incluye cada servicio.

## What Changes

- Los servicios en la sección "Servicios" de la landing pasan a ser **clickables**
- Al hacer click en un servicio se abre una **página de detalle** completa (vista dinámica SPA)
- Cada página de detalle incluye:
  - Carrusel de imágenes de alta calidad (Swiper, 3-4 imágenes por servicio)
  - Descripción narrativa del servicio
  - Lista de características/incluye (bullets con icono ✦)
  - Tarjetas de info rápida (horario, capacidad, condiciones)
  - Precio prominente
  - Botón "Añadir a mi reserva" (si el usuario tiene una reserva activa)
- Se define un objeto `SERVICIO_DATA` en `app.js` con imágenes, descripción y características para cada servicio
- Se añade botón/enlace "← Volver" para regresar a la landing

## Capabilities

### New Capabilities

- `service-detail-page`: Página de detalle por servicio con carrusel de imágenes, descripción, características, precio y acceso rápido a reserva

### Modified Capabilities

- (ninguna — los requisitos de la sección de servicios de la landing no cambian funcionalmente, solo se añade navegabilidad)

## Impact

- **Frontend (app.js)**: nueva función `openServicioDetail(id)`, nuevo objeto constante `SERVICIO_DATA`, modificación de `loadServicios()` para añadir `onclick`
- **Frontend (style.css)**: estilos para página de detalle de servicio (hero del carrusel, grid de info, lista de características, botón CTA)
- **Backend**: sin cambios — se reutiliza el endpoint existente `GET /api/servicios`
- **BD (Supabase)**: sin cambios — la info enriquecida vive en el frontend
- **HTML (index.html)**: sin cambios — se reutiliza el contenedor `#main-content` / `#dynamic-view`
