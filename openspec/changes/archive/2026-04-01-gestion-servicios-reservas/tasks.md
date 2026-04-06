## 1. Repositorios

- [x] 1.1 Crear `ServicioRepository` extendiendo `JpaRepository<Servicio, Long>`
- [x] 1.2 Crear `ReservaServicioRepository` extendiendo `JpaRepository<ReservaServicio, Long>`, con método `deleteByReservaIdAndServicioId(Long reservaId, Long servicioId)`

## 2. CRUD de Servicios (backend)

- [x] 2.1 Crear `ServicioController` con `@RestController @RequestMapping("/api/servicios")`
- [x] 2.2 Implementar `GET /api/servicios` — lista todos los servicios (autenticado)
- [x] 2.3 Implementar `POST /api/servicios` con `@PreAuthorize("hasRole('ADMIN')")` — crea servicio, retorna 400 si nombre duplicado
- [x] 2.4 Implementar `PUT /api/servicios/{id}` con `@PreAuthorize("hasRole('ADMIN')")` — actualiza, retorna 404 si no existe
- [x] 2.5 Implementar `DELETE /api/servicios/{id}` con `@PreAuthorize("hasRole('ADMIN')")` — elimina, retorna 404 si no existe

## 3. Servicios al crear reserva

- [x] 3.1 Agregar clase interna `ServicioRequest` en `ReservaController` con campos `servicioId` y `cantidad`
- [x] 3.2 Agregar campo `List<ServicioRequest> servicios` (nullable) a `ReservaPorTipoRequest`
- [x] 3.3 En `crearPorTipo`: si la lista no es null/vacía, construir los `ReservaServicio`, asignarlos a `reserva.setServicios(...)` antes de guardar
- [x] 3.4 Validar que cada `servicioId` exista; retornar 400 si alguno no se encuentra

## 4. Gestión de servicios post-reserva

- [x] 4.1 Inyectar `ReservaServicioRepository` y `ServicioRepository` en `ReservaController`
- [x] 4.2 Implementar `POST /api/reservas/{id}/servicios` — agrega un servicio a la reserva; retorna 404 si reserva o servicio no existen
- [x] 4.3 Implementar `DELETE /api/reservas/{id}/servicios/{servicioId}` — quita el servicio; retorna 404 si la asociación no existe

## 5. Enriquecer ReservaDTO

- [x] 5.1 Agregar clase interna `ServicioDTO` con campos `nombre`, `precio`, `cantidad`
- [x] 5.2 Agregar campos `List<ServicioDTO> servicios` y `BigDecimal total` a `ReservaDTO`
- [x] 5.3 En el mapeo de `misReservas`, calcular `total = dias × precioNoche + Σ(precio × cantidad)` y mapear la lista de servicios
- [x] 5.4 Manejar el caso de reserva sin servicios (lista vacía, total = solo habitación)

## 6. Frontend

- [x] 6.1 Reemplazar el contenido de `loadServicios()` en `app.js` (actualmente usa placeholders hardcodeados) para hacer `GET /api/servicios` y renderizar las cards reales con nombre y precio desde la base de datos
- [x] 6.2 En el modal/formulario de reserva, añadir una sección de servicios opcionales: checkboxes con nombre y precio cargados desde `GET /api/servicios`
- [x] 6.3 Calcular y mostrar el total estimado en tiempo real al seleccionar/deseleccionar servicios o cambiar fechas
- [x] 6.4 Extender el body del `POST /api/reservas/por-tipo` ya existente para incluir los servicios seleccionados (`servicioId`, `cantidad`)
- [x] 6.5 En la vista "mis reservas" (ya conectada a `GET /api/reservas/mis-reservas`), mostrar la lista de servicios contratados y el total por reserva
