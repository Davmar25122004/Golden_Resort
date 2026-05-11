# Manual de Usuario - Rol: SPA

## Cuenta de prueba
- **Email:** test.spa@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El personal de Spa visualiza las reservas que incluyen el servicio de Spa & Bienestar, con horarios y detalles de los huespedes, para organizar las citas del dia.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu SPA
| Opcion | Ruta | Descripcion |
|--------|------|-------------|
| Calendario | /spa/calendario | Calendario de citas de spa |
| Objetos perdidos | /spa/objetos-perdidos | Objetos encontrados en zona spa |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales |
| Mi horario | Cuadrante de turnos asignado |
| Mensajes con admin | Chat interno con administracion |
| Seguridad | Cambio de contrasena |

---

## Calendario de Spa (/spa/calendario)

### Vistas
- **Anual:** 12 meses como tarjetas. Cada dia muestra badge con numero de reservas que incluyen Spa
- **Mensual:** Mes ampliado con detalle diario
- **Semanal:** Vista de semana con detalle completo de cada reserva

### Codigo de colores
- Color identificativo: **Rosa/Magenta** (#d88ac4)
- Icono: Flor de loto (tematica spa)
- Los dias con reservas de spa muestran badge rosa con el icono

### Vista semanal - detalle por reserva
Por cada reserva del dia que incluya Spa:
- Numero de habitacion y tipo
- Nombre y email del huesped
- Fechas de estancia
- **Hora del servicio de Spa** (mostrada en pill rosa con icono)
- Estado: En estancia / Proxima / Pasada
- Servicios adicionales contratados

### Interaccion
- Clic en un dia abre modal con todas las reservas de ese dia
- Navegacion anterior/siguiente para meses y anos
- Resaltado visual del dia actual

---

## Objetos Perdidos (/spa/objetos-perdidos)

Misma funcionalidad que el modulo de objetos perdidos de Limpieza:
- Ver objetos encontrados
- Registrar nuevos objetos
- Gestionar reclamaciones de clientes

---

## Flujo tipico del personal de spa

1. Al empezar el turno, abre el calendario de Spa
2. Revisa la vista semanal para ver las citas del dia
3. Identifica los huespedes y sus horas de cita
4. Prepara la zona de spa segun el numero de reservas
5. Atiende a los huespedes en el horario programado
6. Si encuentra un objeto perdido, lo registra
7. Al final del dia, revisa el calendario del dia siguiente para preparar
