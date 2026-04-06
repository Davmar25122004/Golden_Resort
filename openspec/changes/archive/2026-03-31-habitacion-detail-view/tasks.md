## 1. Base de datos — Poblar descripciones

- [x] 1.1 Ejecutar UPDATE en Supabase para `tipo = 'NORMAL'`: "Habitación acogedora y funcional, perfecta para el viajero que busca confort sin renunciar a la esencia del Hotel DAW. Cama doble, baño privado con amenities de bienvenida y vistas a los jardines interiores."
- [x] 1.2 Ejecutar UPDATE en Supabase para `tipo = 'DOBLE'`: "Espaciosa habitación con cama king-size, ideal para parejas o viajeros que desean mayor amplitud. Decoración elegante en tonos cálidos, escritorio de trabajo, minibar y acceso prioritario a las instalaciones del hotel."
- [x] 1.3 Ejecutar UPDATE en Supabase para `tipo = 'SUITE'`: "Una experiencia superior de alojamiento. La Suite combina una zona de estar independiente con dormitorio de lujo, bañera de hidromasaje, servicio de mayordomo y vistas panorámicas a la ciudad."
- [x] 1.4 Ejecutar UPDATE en Supabase para `tipo = 'LUJO'`: "La cima de la exclusividad. Nuestra Suite de Lujo ocupa toda una planta con terraza privada, jacuzzi exterior, servicio de chófer 24h, acceso ilimitado al spa y decoración diseñada por artistas de renombre internacional."
- [x] 1.5 Verificar que `GET /api/habitaciones` devuelve `descripcion` no nula en el JSON

## 2. app.js — Conectar loadRooms() a la API real

- [x] 2.1 Reemplazar el array hardcodeado de `habitaciones` en `loadRooms()` por `fetch('/api/habitaciones')`
- [x] 2.2 Agrupar las habitaciones recibidas por tipo usando `reduce` o `Map` (4 grupos: NORMAL, DOBLE, SUITE, LUJO)
- [x] 2.3 Para cada grupo, extraer: `tipo`, `precio_noche` (del primer elemento), `descripcion` (del primer elemento), `count` (longitud del grupo)
- [x] 2.4 Mostrar badge "● Disponible" cuando `state.searchDates` es null
- [x] 2.5 Cuando `state.searchDates` tiene valor, mostrar "● Quedan N" con el `count` del tipo (v1: total sin filtrar por fechas) o "● Sin disponibilidad" si count = 0
- [x] 2.6 Pasar `tipo`, `precio`, `descripcion` reales al `onclick` del botón "Reservar" en la tarjeta

## 3. app.js — Implementar vista de detalle selectRoom()

- [x] 3.1 Actualizar la firma de `selectRoom` para recibir `(tipo, precio, descripcion)`
- [x] 3.2 Si `!state.token`, llamar `openAuthModal()` y retornar
- [x] 3.3 Construir el HTML de la vista de detalle con: sección header (label + título + línea dorada), contenedor Swiper `.detailSwiper`, bloque de precio, bloque de descripción, botón "Reservar" deshabilitado con texto "Próximamente", botón "← Volver"
- [x] 3.4 Inyectar el HTML con `showDynamic(html)`
- [x] 3.5 Inicializar un Swiper nuevo sobre `.detailSwiper` con las imágenes de `TIPO_IMAGES[tipo]`, con slidesPerView 1, paginación dots y navegación prev/next
- [x] 3.6 Guardar referencia al detailSwiper en una variable `let detailSwiper = null`
- [x] 3.7 En el botón "← Volver", destruir `detailSwiper` antes de llamar `showLanding()` y luego `loadRooms()`

## 4. style.css — Estilos de la vista de detalle

- [x] 4.1 Añadir estilos para `.detail-view-container`: padding, max-width centrado, color de fondo coherente con el tema oscuro
- [x] 4.2 Añadir estilos para `.detailSwiper`: height fija (ej. 480px), border-radius, overflow hidden
- [x] 4.3 Añadir estilos para `.detail-swiper-slide img`: object-fit cover, width/height 100%
- [x] 4.4 Añadir estilos para `.detail-price`: color gold, font-size grande, margin top
- [x] 4.5 Añadir estilos para `.detail-description`: color cream/muted, line-height generoso, font-size 1rem
- [x] 4.6 Añadir estilos para `.btn-room--disabled`: opacidad 0.4, cursor not-allowed, misma forma que `.btn-room`
- [x] 4.7 Verificar que los dots y flechas de navegación del Swiper de detalle respetan el tema dorado del hotel

## 5. Verificación final

- [ ] 5.1 Cargar la página y comprobar que el carrusel principal muestra datos reales (precios y tipos de la BD, no hardcodeados)
- [ ] 5.2 Pulsar "Reservar" sin sesión → debe abrir el modal de autenticación
- [ ] 5.3 Iniciar sesión y pulsar "Reservar" → debe mostrar la vista de detalle con carrusel, precio y descripción reales
- [ ] 5.4 Navegar imágenes en el carrusel de detalle con prev/next y dots
- [ ] 5.5 Comprobar que el botón "Reservar" en la vista de detalle está deshabilitado
- [ ] 5.6 Pulsar "← Volver" → debe volver al landing con el carrusel principal funcional
- [ ] 5.7 Pulsar "Ver fotos" → debe seguir abriendo el lightbox como antes

<!-- Tareas 5.x: verificación manual en el navegador -->
