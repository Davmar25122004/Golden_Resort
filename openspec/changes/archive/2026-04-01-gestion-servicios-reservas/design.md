## Context

El proyecto es un sistema de reservas de hotel en Spring Boot + Supabase (PostgreSQL). El dominio ya define `Servicio` (id, nombre, precio) y `ReservaServicio` (id, cantidad, reserva_id, servicio_id) como entidades JPA, pero ninguna tiene Repository ni Controller. `Reserva` ya declara `@OneToMany List<ReservaServicio> servicios` con `CascadeType.ALL`, lo que permite persistir los servicios en cascada al guardar la reserva.

La seguridad usa Spring Security con `@EnableMethodSecurity` activo. Los roles se almacenan como `ROLE_ADMIN` / `ROLE_USER`.

## Goals / Non-Goals

**Goals:**
- Exponer CRUD de servicios con control de acceso por rol
- Permitir asociar servicios a una reserva al momento de crearla
- Permitir agregar/quitar servicios en reservas existentes
- Enriquecer el DTO de reserva con servicios y total calculado
- Reflejar todo en el frontend (flujo de reserva + mis reservas)

**Non-Goals:**
- Pagos o facturación real
- Historial de cambios en servicios de una reserva
- Disponibilidad limitada por stock de servicios

## Decisions

### 1. Autorización por método con `@PreAuthorize`
`@PreAuthorize("hasRole('ADMIN')")` en los métodos POST/PUT/DELETE del `ServicioController`. Alternativa descartada: reglas en `SecurityConfig` → más verboso y menos localizado. El `@EnableMethodSecurity` ya está activo, no requiere cambios en configuración.

### 2. Servicios en la creación de reserva via lista en el request body
`ReservaPorTipoRequest` se extiende con `List<ServicioRequest> servicios` (opcional, puede ser null/vacío). Al guardar la `Reserva`, se construyen los `ReservaServicio` y se asignan a `reserva.setServicios(...)` — el `CascadeType.ALL` persiste todo en una sola transacción.

```
POST /api/reservas/por-tipo
{
  "tipo": "DOBLE",
  "fechaEntrada": "2026-05-01",
  "fechaSalida": "2026-05-05",
  "servicios": [
    { "servicioId": 1, "cantidad": 2 },
    { "servicioId": 3, "cantidad": 1 }
  ]
}
```

### 3. Gestión post-reserva con endpoints dedicados
En lugar de reenviar toda la reserva (PUT completo), se usan endpoints granulares:
- `POST /api/reservas/{id}/servicios` → agrega un servicio
- `DELETE /api/reservas/{id}/servicios/{servicioId}` → quita un servicio

Esto evita sobrescribir accidentalmente otros campos de la reserva.

### 4. Total calculado en el DTO (no persistido)
El total se calcula en tiempo de lectura: `dias × precioNoche + Σ(precio × cantidad)`. No se persiste en la base de datos para evitar inconsistencias si cambian los precios. Es un campo derivado en `ReservaDTO`.

### 5. `ReservaServicioRepository` separado
Aunque `CascadeType.ALL` maneja la persistencia en cascada, se necesita un `ReservaServicioRepository` para las operaciones post-reserva (agregar/quitar servicios individuales).

## Risks / Trade-offs

- **Precio histórico no preservado** → Si el precio de un servicio cambia, los totales de reservas antiguas se recalculan con el nuevo precio. Mitigación: aceptable para el alcance actual; en el futuro se puede guardar `precioUnitario` en `ReservaServicio`.
- **Lista de servicios nullable** → El campo `servicios` en el request es opcional para no romper clientes existentes. Mitigación: manejar null/vacío explícitamente en el controller.
- **Carga N+1 en ReservaDTO** → Al mapear reservas con servicios, puede generar consultas adicionales. Mitigación: usar `@EntityGraph` o fetch join en el repository si el volumen lo requiere (fuera de scope por ahora).

## Migration Plan

1. ~~Verificar tablas~~ — **Confirmado**: `servicio` y `reserva_servicio` ya existen en Supabase con schema correcto, secuencias e FK constraints en orden. No se requiere migración de base de datos.
2. Desplegar el backend con los nuevos endpoints
3. Desplegar el frontend actualizado
4. Sin rollback destructivo necesario — los nuevos endpoints son aditivos

## Open Questions

- ¿Los servicios de una reserva pueden ser modificados por el propio usuario o solo por admin? (asumido: cualquier usuario autenticado puede gestionar los servicios de sus propias reservas)
