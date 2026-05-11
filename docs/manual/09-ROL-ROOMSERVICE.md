# Manual de Usuario - Rol: ROOM SERVICE

## Cuenta de prueba
- **Email:** test.roomservice@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El personal de Room Service visualiza las reservas que incluyen el servicio de Room Service y gestiona los pedidos de comida a habitacion.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu ROOM SERVICE
| Opcion | Ruta | Descripcion |
|--------|------|-------------|
| Calendario | /roomservice/calendario | Calendario de pedidos de Room Service |
| Objetos perdidos | /roomservice/objetos-perdidos | Objetos encontrados al entregar pedidos |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales |
| Mi horario | Cuadrante de turnos asignado |
| Mensajes con admin | Chat interno con administracion |
| Seguridad | Cambio de contrasena |

---

## Calendario de Room Service (/roomservice/calendario)

### Vistas
- **Anual:** 12 meses con badges de reservas con Room Service
- **Mensual:** Mes ampliado
- **Semanal:** Detalle completo por dia

### Codigo de colores
- Color identificativo: **Verde** (#8cdca0)
- Icono: Campana de servicio (concierge bell)

### Vista semanal - detalle por reserva
Por cada reserva que incluya Room Service:
- Numero de habitacion y tipo
- Nombre y email del huesped
- Fechas de estancia
- Pill verde con "RS" + hora (si se especifico)
- Estado de la reserva

### Interaccion
- Clic en dia abre modal con todas las reservas con Room Service del dia
- Navegacion por meses/anos

---

## Carta de Room Service
Los huespedes pueden pedir de la siguiente carta (gestionada por el admin):

### Categorias
| Categoria | Descripcion |
|-----------|-------------|
| DESAYUNO | Items de desayuno (cafe, tostadas, zumos, etc.) |
| ALMUERZO | Platos de almuerzo |
| CENA | Platos de cena |
| SNACKS | Aperitivos y picoteo |
| BEBIDAS | Bebidas (agua, refrescos, vinos, etc.) |

### Flujo de pedidos
1. El huesped selecciona items de la carta desde "Mis Reservas"
2. Elige cantidades por item
3. Confirma el pedido
4. El pedido aparece en el sistema vinculado a su reserva
5. El personal de Room Service ve las reservas activas con pedidos
6. Prepara y entrega el pedido en la habitacion

---

## Objetos Perdidos (/roomservice/objetos-perdidos)
- Registrar objetos encontrados al entregar pedidos en habitaciones
- Gestionar reclamaciones

---

## Flujo tipico del personal de Room Service

1. Abre el calendario al inicio del turno
2. Revisa las reservas activas que tienen Room Service contratado
3. Monitoriza los pedidos nuevos que llegan
4. Coordina con cocina la preparacion
5. Entrega en la habitacion correspondiente
6. Si encuentra un objeto fuera de lugar en la habitacion, lo reporta
7. Para pedidos adicionales, el huesped puede llamar al 030 o pedir por la app
