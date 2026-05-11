# Manual de Usuario - Rol: COCHE

## Cuenta de prueba
- **Email:** test.coche@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El personal de servicio de coche gestiona los traslados de huespedes. Visualiza las reservas con servicio de coche privado, incluyendo horarios de recogida y ubicaciones de destino.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu COCHE
| Opcion | Ruta | Descripcion |
|--------|------|-------------|
| Calendario | /coche/calendario | Calendario de traslados programados |
| Objetos perdidos | /coche/objetos-perdidos | Objetos encontrados en vehiculos |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales |
| Mi horario | Cuadrante de turnos asignado |
| Mensajes con admin | Chat interno con administracion |
| Seguridad | Cambio de contrasena |

---

## Calendario de Coche (/coche/calendario)

### Vistas
- **Anual:** 12 meses con badges de reservas con servicio de coche
- **Mensual:** Mes ampliado
- **Semanal:** Detalle completo por dia

### Codigo de colores
- Color identificativo: **Azul claro** (#78b4ff)
- Icono: Coche (SVG)

### Vista semanal - detalle por reserva
Por cada reserva que incluya Servicio de Coche Privado:
- Numero de habitacion y tipo
- Nombre y email del huesped
- Fechas de estancia
- **Hora de recogida** (mostrada en pill azul)
- **Ubicacion de recogida/destino:**
  - AEROPUERTO_VALENCIA → "Aeropuerto VLC"
  - RENFE_JOAQUIN_SOROLLA → "Renfe J. Sorolla"
  - RENFE_CULLERA → "Renfe Cullera"
- Estado de la reserva

### Interaccion
- Clic en dia abre modal con todos los traslados del dia
- Navegacion por meses/anos

---

## Objetos Perdidos (/coche/objetos-perdidos)
- Registrar objetos encontrados en los vehiculos
- Gestionar reclamaciones de clientes

---

## Flujo tipico del conductor

1. Abre el calendario al inicio del turno
2. Revisa los traslados programados para hoy (vista semanal)
3. Identifica horarios y ubicaciones de recogida
4. Planifica la ruta optima entre traslados
5. Recoge al huesped en el hotel o en la ubicacion indicada
6. Realiza el traslado al destino
7. Si el huesped deja algo en el vehiculo, lo registra como objeto perdido
8. Revisa los traslados del dia siguiente
