# Manual de Usuario - Rol: GIMNASIO

## Cuenta de prueba
- **Email:** test.gimnasio@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El personal de gimnasio visualiza las reservas que incluyen el servicio de Gimnasio 24h para controlar el acceso y organizar las clases.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu GIMNASIO
| Opcion | Ruta | Descripcion |
|--------|------|-------------|
| Calendario | /gimnasio/calendario | Calendario de accesos al gimnasio |
| Objetos perdidos | /gimnasio/objetos-perdidos | Objetos encontrados en el gimnasio |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales |
| Mi horario | Cuadrante de turnos asignado |
| Mensajes con admin | Chat interno con administracion |
| Seguridad | Cambio de contrasena |

---

## Calendario de Gimnasio (/gimnasio/calendario)

### Vistas
- **Anual:** 12 meses. Cada dia muestra badge con numero de reservas con gimnasio
- **Mensual:** Mes ampliado
- **Semanal:** Detalle completo por dia

### Codigo de colores
- Color identificativo: **Cian** (#58c4dc)
- Icono: Mancuerna (dumbbell)
- Los dias con reservas de gimnasio muestran badge cian

### Vista semanal - detalle por reserva
Por cada reserva que incluya Gimnasio 24h:
- Numero de habitacion y tipo
- Nombre y email del huesped
- Fechas de estancia
- Pill con icono de gimnasio "GYM"
- Estado de la reserva

### Interaccion
- Clic en dia abre modal con listado completo
- Navegacion por meses/anos

---

## Objetos Perdidos (/gimnasio/objetos-perdidos)
- Ver y registrar objetos encontrados en la zona de gimnasio
- Gestionar reclamaciones

---

## Flujo tipico del personal de gimnasio

1. Abre el calendario al inicio del turno
2. Revisa cuantos huespedes tienen acceso al gimnasio hoy
3. Comprueba si hay clases programadas
4. Controla el acceso de los huespedes (verificando que tengan el servicio contratado)
5. Si encuentra un objeto perdido, lo registra
6. Revisa el dia siguiente para anticipar la demanda
