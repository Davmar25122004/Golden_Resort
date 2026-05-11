# Manual de Usuario - Rol: RECEPCION

## Cuenta de prueba
- **Email:** test.recepcion@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El recepcionista gestiona la operativa diaria del hotel: llegadas, estancias, salidas, checkout, comunicacion con huespedes, asignacion de limpieza y peticiones especiales.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu RECEPCION
| Opcion | Ruta | Descripcion |
|--------|------|-------------|
| Inicio | /recepcion | Panel principal con llegadas, estancias y salidas |
| Calendario | /recepcion/calendario | Vista de calendario con todas las reservas |
| Mensajeria | /mensajeria | Chat con clientes |
| Peticiones | /peticiones | Peticiones especiales de los huespedes |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales |
| Mi horario | Cuadrante de turnos asignado |
| Mensajes con admin | Chat interno con administracion |
| Seguridad | Cambio de contrasena |

---

## Panel de Recepcion (/recepcion)

### Vista principal - 3 columnas

**Columna 1: Llegadas hoy**
- Lista de reservas cuya fecha de entrada es hoy
- Por cada reserva:
  - Inicial del nombre (avatar)
  - Nombre y email del huesped
  - Numero y tipo de habitacion
  - Badge de pago (PAGADA / SIN PAGAR)
  - Badge de peticion especial (si tiene)

**Columna 2: En estancia**
- Huespedes actualmente alojados (entre fecha entrada y salida)
- Misma informacion que llegadas
- Indica si ya se ha hecho checkout parcial

**Columna 3: Salidas hoy**
- Reservas cuya fecha de salida es hoy
- Badge adicional de checkout realizado/pendiente

### Barra de busqueda
- Busqueda en tiempo real por:
  - Referencia de reserva (GR-XXX)
  - Numero de habitacion
  - Email del huesped
  - Nombre del huesped

### Detalle de reserva (al hacer clic)
Modal con informacion completa:

**Seccion 1 - Datos del huesped:**
- Nombre, email, avatar

**Seccion 2 - Datos de la reserva:**
- Numero y tipo de habitacion
- Fechas de entrada y salida
- Numero de noches
- Peticion especial (si tiene)

**Seccion 3 - Checkout:**
- Boton "Realizar Checkout" (solo si la reserva ha empezado)
  - Marca la habitacion como SUCIA
  - Genera automaticamente tarea de limpieza tipo SALIDA
  - Registra fecha/hora del checkout
- Boton "Deshacer Checkout" (si ya se hizo)
  - Cancela la tarea de limpieza generada
  - Revierte el estado

**Seccion 4 - Historial de pagos:**
- Todos los pagos asociados a la reserva
- Por cada pago: metodo, importe, estado (Completado/Cancelado/Reembolsado), fecha

**Seccion 5 - Notas internas:**
- Notas escritas por el personal (no visibles para el cliente)
- Anadir nueva nota (max 2000 caracteres)
- Eliminar notas propias
- Muestra autor y fecha de cada nota

### Asignar limpieza extra
Boton en la barra superior que abre un modal:
1. Seleccionar habitacion ocupada (desplegable)
2. Seleccionar limpiador de turno (muestra horario del dia)
3. Tipo de tarea: DIARIA, MANTENIMIENTO, OTRA
4. Prioridad: BAJA, NORMAL, ALTA, URGENTE
5. Notas (max 2000 caracteres)
6. Muestra numero de tareas pendientes por habitacion

---

## Calendario de Recepcion (/recepcion/calendario)

### Vistas disponibles
- **Anual:** 12 meses como tarjetas, cada dia muestra numero de reservas
- **Mensual:** Un mes ampliado con detalle por dia
- **Semanal:** Vista de semana con reservas completas por dia

### Interaccion
- Clic en cualquier dia abre modal con lista completa de reservas
- Por cada reserva del dia:
  - Numero de habitacion e imagen
  - Nombre y email del huesped
  - Fechas de estancia
  - Servicios contratados (con iconos y horas)
  - Peticiones especiales
  - Estado: Pasada / Proxima / En estancia
- Navegacion: botones anterior/siguiente para meses/anos

---

## Mensajeria (/mensajeria)

### Layout de 3 columnas

**Columna izquierda - Bandeja de entrada:**
- Busqueda por nombre o email
- Filtros de estado: Todas, Abierta, Pendiente, Resuelta
- Lista de conversaciones:
  - Nombre y email del cliente
  - Preview del ultimo mensaje (80 caracteres)
  - Tiempo relativo (hace X minutos/horas)
  - Badge de no leidos
  - Chip de estado con color

**Columna central - Chat:**
- Cabecera con nombre del cliente y selector de estado
- Burbujas de mensaje (estilos distintos para cliente vs recepcion)
- Adjuntos (preview de imagen o nombre de archivo)
- Indicadores de lectura (tick simple = enviado, doble tick = leido)
- Area de escritura:
  - Textarea (max 2000 caracteres)
  - Enter para enviar, Shift+Enter para salto de linea
  - Boton adjuntar imagen (JPEG/PNG)
  - Desplegable de plantillas de respuesta rapida (5 plantillas predefinidas)
- Boton eliminar conversacion (solo admin)

**Columna derecha - Ficha del cliente:**
- Avatar con inicial
- Nombre y email
- Estadisticas: reservas pasadas, gasto total
- Estancias activas (desplegable)
- Proximas reservas (desplegable)
- Ultimas 5 reservas pasadas

**Actualizacion automatica:** polling cada 5 segundos (se pausa si la pestana no esta visible)

---

## Peticiones especiales (/peticiones)

- Tarjetas con todas las peticiones especiales de clientes
- Filtros: Todas, En estancia, Proximas, Pasadas
- Cada tarjeta muestra:
  - Estado de la reserva (badge de color)
  - Numero de habitacion y tipo
  - Referencia de reserva
  - Nombre y email del huesped
  - Fechas de estancia
  - Texto completo de la peticion (entrecomillado)
  - Boton "Ver detalle" que abre el modal de reserva

---

## Flujo tipico del recepcionista

1. Al empezar el turno, revisa el panel de recepcion
2. Comprueba las llegadas de hoy y prepara las habitaciones
3. Revisa peticiones especiales y coordina con otros departamentos
4. Cuando llega un huesped, verifica su reserva y estado de pago
5. Anade notas internas si es necesario
6. Responde mensajes de clientes via mensajeria
7. Al final del dia, realiza checkout de las salidas
8. Si un huesped necesita limpieza extra, la asigna desde el panel
9. Revisa el calendario para preparar el dia siguiente
