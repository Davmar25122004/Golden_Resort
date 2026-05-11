# Manual de Usuario - Rol: LIMPIEZA

## Cuenta de prueba
- **Email:** test.limpieza@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El personal de limpieza gestiona las tareas de limpieza de habitaciones, reporta incidencias de mantenimiento y registra objetos perdidos encontrados en las habitaciones.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu LIMPIEZA
| Opcion | Ruta | Descripcion |
|--------|------|-------------|
| Inicio | /limpieza | Panel principal con estado de habitaciones y tareas |
| Tareas pendientes | /limpieza#mias | Vista filtrada solo con mis tareas asignadas |
| Calendario | /limpieza/calendario | Calendario de salidas y limpiezas |
| Incidencias | /limpieza/incidencias | Reportar y gestionar incidencias |
| Objetos perdidos | /limpieza/objetos-perdidos | Registrar y gestionar objetos encontrados |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales |
| Mi horario | Cuadrante de turnos asignado |
| Mensajes con admin | Chat interno con administracion |
| Seguridad | Cambio de contrasena |

---

## Panel de Limpieza (/limpieza)

### Filtros disponibles
- **Por estado:** Todas, SUCIA, EN_LIMPIEZA, LIMPIA, MANTENIMIENTO
- **Por fecha (cascada):** Ano > Mes > Semana > Dia (semanas naturales Lunes-Domingo)
- **Botones rapidos:** Hoy, Resetear filtros

### Tabs del panel
1. **Panel (Habitaciones)** - Vista general del estado de todas las habitaciones
2. **Mis tareas** - Solo las tareas asignadas al usuario logueado
3. **Todas las tareas** - Lista completa de tareas

### Tarjeta de habitacion
Cada habitacion se muestra como una tarjeta con:
- Numero de habitacion y tipo (Normal, Doble, Suite, Lujo)
- Badge de estado de limpieza con color:
  - LIMPIA (verde)
  - SUCIA (rojo)
  - EN_LIMPIEZA (amarillo)
  - MANTENIMIENTO (naranja)
- Fecha del proximo checkout
- Tarea asociada (si tiene):
  - Tipo de tarea y prioridad (badges de color)
  - Email del limpiador asignado
  - Notas
  - Botones de accion

### Acciones sobre tareas

**Tarea no iniciada (PENDIENTE):**
- Boton "Iniciar" - Cambia el estado a EN_PROGRESO y registra la hora de inicio

**Tarea en progreso (EN_PROGRESO):**
- Boton "Completar" - Abre modal para:
  - Escribir notas finales (observaciones, incidencias menores)
  - Confirmar finalizacion
  - Cambia estado a COMPLETADA y registra hora

### Acciones generales
- **Generar tareas de checkout:** Boton que crea tareas de limpieza para todas las salidas del dia
- **Crear tarea manual:** Asignar tarea a habitacion especifica con tipo, prioridad y notas
- **Reportar incidencia:** Abre formulario de incidencia de mantenimiento

---

## Calendario de Limpieza (/limpieza/calendario)

### Vistas
- **Anual:** 12 meses, cada dia muestra numero de checkouts previstos
- **Mensual:** Detalle por dia del mes

### Informacion mostrada
- Numero de salidas/checkouts por dia (badge)
- Resaltado del dia actual
- Navegacion anterior/siguiente

---

## Incidencias (/limpieza/incidencias)

### Tabla de incidencias
Columnas:
- ID
- Tipo: MANTENIMIENTO, INVENTARIO, OTRO
- Prioridad: BAJA, NORMAL, ALTA, URGENTE (con badges de color)
- Habitacion (o "General" si no aplica)
- Descripcion del problema
- Fecha de reporte
- Estado: ABIERTA, EN_PROCESO, RESUELTA

### Crear nueva incidencia
Formulario con:
- Habitacion (selector, opcional para incidencias generales)
- Tipo de incidencia
- Prioridad
- Descripcion detallada del problema

### Gestionar incidencias
- Cambiar estado (Abierta > En proceso > Resuelta)
- Anadir resolucion (texto con lo que se hizo para resolver)
- Acciones en lote: seleccionar varias y cambiar estado

---

## Objetos Perdidos (/limpieza/objetos-perdidos)

### Vista de objetos
- Cuadricula de tarjetas con preview de imagen (o icono placeholder)
- Por cada objeto:
  - Descripcion
  - Fecha y hora en que se encontro
  - Habitacion donde se encontro
  - Quien lo reporto
  - Estado: DISPONIBLE, ENTREGADO, DESCARTADO

### Registrar nuevo objeto
- Descripcion del objeto
- Habitacion donde se encontro
- Foto (opcional)

### Acciones sobre objetos disponibles
- **Entregar:** Abre modal para anotar a quien se entrego y notas
- **Descartar:** Marca el objeto como descartado

### Reclamaciones
- Ver reclamaciones de clientes sobre objetos
- Por cada reclamacion:
  - Mensaje del cliente
  - Telefono de contacto
  - Estado: PENDIENTE, ACEPTADA, RECHAZADA
- Acciones: Aceptar o Rechazar con notas del staff

---

## Flujo tipico del personal de limpieza

1. Al empezar el turno, abre el panel de limpieza
2. Va a "Mis tareas" para ver las tareas asignadas
3. Pulsa "Iniciar" en la primera tarea
4. Limpia la habitacion
5. Si encuentra un objeto perdido, lo registra en "Objetos perdidos"
6. Si detecta un problema (grifo roto, bombilla fundida), reporta una incidencia
7. Al terminar, pulsa "Completar" y anade notas si es necesario
8. Pasa a la siguiente tarea
9. Revisa el calendario para saber las salidas de manana
