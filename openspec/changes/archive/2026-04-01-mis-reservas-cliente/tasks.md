## 1. Backend — DTO y endpoint de mis reservas

- [x] 1.1 Añadir clase interna `ReservaDTO` en `ReservaController.java` con campos: `Long id`, `LocalDate fechaEntrada`, `LocalDate fechaSalida`, `String habitacionTipo`, `String habitacionNumero`, `BigDecimal precioNoche`
- [x] 1.2 Añadir método `misReservas(Authentication authentication)` mapeado a `GET /api/reservas/mis-reservas`; obtiene el usuario por email desde Authentication, devuelve `List<ReservaDTO>` construido desde `reservaRepository.findByUsuario(usuario)`

## 2. Frontend — Estilos CSS para la vista de reservas

- [x] 2.1 Añadir en `style.css` la clase `.reserva-card`: `display:flex`, borde dorado sutil, fondo `var(--dark-3)`, border-radius, hover con borde dorado más intenso
- [x] 2.2 Añadir `.reserva-card-img`: ancho fijo 200px, altura 160px, `object-fit:cover`, sin shrink; responsive collapse a columna en < 600px
- [x] 2.3 Añadir `.reserva-card-body`: flex-grow, padding, separado por línea dorada vertical del bloque imagen
- [x] 2.4 Añadir `.reserva-estado-badge`: pill pequeño con padding, font-size 0.6rem, letter-spacing; variantes de color por estado via style inline
- [x] 2.5 Añadir `.reserva-empty`: centrado, texto serif grande en `var(--cream)` con párrafo muted y botón gold outline
- [x] 2.6 Añadir `.reserva-dates`: tipografía serif (`font-family: 'Cormorant Garamond'`) para las fechas, tamaño 1.3rem, color `var(--cream)`
- [x] 2.7 Añadir media query `@media (max-width: 600px)` para `.reserva-card`: flex-direction column, `.reserva-card-img` width 100% height 180px

## 3. Frontend — showMisReservas() funcional

- [x] 3.1 Reemplazar el cuerpo de `showMisReservas()` en `app.js`: llamar a `GET /api/reservas/mis-reservas` con fetch; si 401 abrir modal de login
- [x] 3.2 Función auxiliar `calcularEstado(fechaEntrada, fechaSalida)` que retorna `'PROXIMA'`, `'EN_CURSO'` o `'PASADA'` comparando con `new Date()` (ignorando hora)
- [x] 3.3 Función auxiliar `formatFecha(dateStr)` que formatea `"2026-04-01"` como `"01 Abr 2026"` en español
- [x] 3.4 Ordenar reservas: EN_CURSO primero, luego PROXIMA (más cercana first), luego PASADA (más reciente first)
- [x] 3.5 Renderizar la lista de tarjetas usando las clases CSS nuevas; imagen desde `TIPO_IMAGES[tipo][0]` con fallback a string vacío; opacidad 0.5 para PASADAS
- [x] 3.6 Si la lista está vacía, renderizar el estado vacío `.reserva-empty` con botón que llama a `goHome()`

## 4. Frontend — Cancelar reserva

- [x] 4.1 Añadir función `window.cancelarReserva = async (id)` que pide confirmación con `confirm()`, llama a `DELETE /api/reservas/${id}`, y tras éxito llama a `showMisReservas()` para refrescar
- [x] 4.2 En el HTML de cada tarjeta PRÓXIMA, incluir `<button onclick="cancelarReserva(${r.id})">Cancelar</button>` con estilo de borde rojo sutil y hover rojo
