## 1. Datos enriquecidos (SERVICIO_DATA)

- [x] 1.1 Definir el objeto `SERVICIO_DATA` en `app.js` junto a `TIPO_IMAGES`, indexado por id (1-6), con campos: `icon`, `descripcion`, `caracteristicas` (array min 4), `horario`, `capacidad`, `images` (array 3-4 URLs Unsplash `?w=1200&q=85`)
- [x] 1.2 Completar las imágenes para los 6 servicios: Spa & Bienestar, Desayuno Premium, Servicio de Coche, Cena Gourmet, Gimnasio 24h, Room Service
- [x] 1.3 Verificar que las 6 URLs de Unsplash cargan correctamente en el navegador

## 2. Interactividad en la grid de servicios

- [x] 2.1 Modificar `loadServicios()` en `app.js`: añadir `onclick="openServicioDetail(${s.id})"` a cada `.servicio-card`
- [x] 2.2 Añadir `cursor: pointer` y hover effect (elevación/brillo dorado) a `.servicio-card` en `style.css`

## 3. Función openServicioDetail

- [x] 3.1 Crear función `window.openServicioDetail = async function(id)` en `app.js`
- [x] 3.2 Obtener el servicio: buscar en `_serviciosCache` por id (o llamar `fetchServicios()` si no está cargado)
- [x] 3.3 Obtener los datos enriquecidos desde `SERVICIO_DATA[id]`, con fallback para ids no encontrados
- [x] 3.4 Construir el HTML de la página de detalle con: botón volver, bloque de título+precio, carrusel Swiper, descripción, características, info cards
- [x] 3.5 Llamar `showDynamic(html)` con el HTML construido
- [x] 3.6 Inicializar el Swiper del carrusel: destruir `detailSwiper` si existe, crear nuevo con las imágenes del servicio
- [x] 3.7 Añadir función `backToServicios()` que llame `showLanding()` y luego `scrollToSection('servicios')`

## 4. Estilos CSS para la página de detalle

- [x] 4.1 Añadir estilos para `.servicio-detail-page` (contenedor, max-width, padding)
- [x] 4.2 Añadir estilos para `.servicio-detail-carousel` (height: 420px en desktop, 250px en móvil, `object-fit: cover`)
- [x] 4.3 Añadir estilos para `.servicio-detail-header` (nombre grande en Cormorant Garamond, precio en gold)
- [x] 4.4 Añadir estilos para `.servicio-detail-description` (texto en cream, line-height amplio)
- [x] 4.5 Añadir estilos para `.servicio-caracteristicas` (lista con `✦` en gold, sin bullets de lista)
- [x] 4.6 Añadir estilos para `.servicio-info-cards` (grid de 2 columnas, cards con borde dorado sutil)
- [x] 4.7 Añadir estilos para `.btn-volver` (enlace discretto con flecha ←, color muted, hover gold)
- [x] 4.8 Verificar responsive en móvil (≤768px): carousel height reducido, info cards en columna única

## 5. Verificación final

- [x] 5.1 Comprobar que los 6 servicios abren su página de detalle al hacer click
- [x] 5.2 Comprobar que el carrusel funciona (navegación con flechas y paginación)
- [x] 5.3 Comprobar que el botón "← Volver" regresa a la sección de servicios
- [x] 5.4 Comprobar que no hay fuga de instancias Swiper (abrir varios servicios en secuencia)
- [x] 5.5 Verificar en móvil (Chrome DevTools 375px) que el layout es correcto
