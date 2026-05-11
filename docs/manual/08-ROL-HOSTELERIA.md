# Manual de Usuario - Rol: HOSTELERIA

## Cuenta de prueba
- **Email:** test.hosteleria@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El personal de hosteleria gestiona los servicios de comidas del hotel: Desayuno Premium y Cena Gourmet. Visualiza las reservas que incluyen estos servicios con horarios y numero de comensales.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu HOSTELERIA
| Opcion | Ruta | Descripcion |
|--------|------|-------------|
| Calendario | /hosteleria/calendario | Calendario de servicios de comidas |
| Objetos perdidos | /hosteleria/objetos-perdidos | Objetos encontrados en areas de comedor |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales |
| Mi horario | Cuadrante de turnos asignado |
| Mensajes con admin | Chat interno con administracion |
| Seguridad | Cambio de contrasena |

---

## Calendario de Hosteleria (/hosteleria/calendario)

### Vistas
- **Anual:** 12 meses con badges de reservas con servicios de comida
- **Mensual:** Mes ampliado
- **Semanal:** Detalle completo por dia

### Codigo de colores
- Color identificativo: **Naranja** (#ffb45a)
- Dos tipos de servicio diferenciados:
  - **Desayuno (BRK):** Pill naranja con icono de croissant + hora
  - **Cena (CENA):** Pill coral (#ff8c5a) con icono de cubiertos + hora

### Vista semanal - detalle por reserva
Por cada reserva que incluya Desayuno Premium o Cena Gourmet:
- Numero de habitacion y tipo
- Nombre y email del huesped
- Fechas de estancia
- Pills de servicio:
  - "BRK 08:30" (desayuno con hora)
  - "CENA 21:00" (cena con hora)
  - Puede tener ambos servicios
- Estado de la reserva

### Interaccion
- Clic en dia abre modal con todas las reservas de comida del dia
- Navegacion por meses/anos

---

## Objetos Perdidos (/hosteleria/objetos-perdidos)
- Registrar objetos encontrados en el restaurante o areas de comedor
- Gestionar reclamaciones

---

## Flujo tipico del personal de hosteleria

1. Abre el calendario al inicio del turno
2. Revisa la vista semanal para ver los servicios del dia
3. **Para desayuno (07:00-11:00):**
   - Cuenta el numero de huespedes con desayuno contratado
   - Prepara el buffet segun la demanda
   - Identifica horarios de llegada preferidos
4. **Para cena (19:30-23:00):**
   - Cuenta el numero de comensales
   - Prepara las mesas necesarias
   - Identifica horarios de reserva
   - Coordina con cocina el menu degustacion
5. Si encuentra un objeto perdido, lo registra
6. Revisa el dia siguiente para planificar compras y mise en place
