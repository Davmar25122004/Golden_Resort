# Manual de Usuario - Rol: ADMIN

## Cuenta de prueba
- **Email:** test.admin@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El administrador tiene control total sobre el sistema. Puede gestionar habitaciones, servicios, usuarios, reservas, personal, horarios, descuentos y acceder a todos los paneles de staff (recepcion, limpieza, etc.).

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Inicio | Pagina publica del hotel |
| Habitaciones | Vista publica de habitaciones |
| Servicios | Vista publica de servicios |
| Contacto | Informacion de contacto |

### Menu ADMIN
| Opcion | Destino | Descripcion |
|--------|---------|-------------|
| Inicio | Tab: home | Panel de bienvenida con accesos rapidos |
| Dashboard | Tab: dashboard | Estadisticas y graficos del hotel |
| Reservas | Tab: reservas | Gestion de todas las reservas |
| Habitaciones | Tab: habitaciones | Gestion de habitaciones y tipos |
| Servicios | Tab: servicios | Gestion de servicios del hotel |
| Room Service | Tab: roomservice | Gestion del menu de Room Service |

### Menu PERSONAL
| Opcion | Destino | Descripcion |
|--------|---------|-------------|
| Horarios | Tab: personal > horarios | Crear y editar horarios de trabajo |
| Tipos de jornada | Tab: personal > perfiles | Perfiles de turno (manana, tarde, etc.) |
| Cuadrantes | Tab: personal > planes | Planificacion semanal de turnos |
| Asignacion | Tab: personal > asignacion | Asignar cuadrantes a empleados |
| Mensajes staff | Tab: mensajes-staff | Mensajeria interna con el equipo |
| Usuarios | Tab: usuarios | Gestion de todos los usuarios del sistema |

### Menu CLIENTES
| Opcion | Destino | Descripcion |
|--------|---------|-------------|
| Gestion de clientes | Tab: clientes | Ver y gestionar cuentas de clientes |
| Reservas manuales | Tab: reservas-manuales | Crear reservas en nombre de clientes |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales del admin |
| Mi horario | Ver horario asignado (si tiene cuadrante) |
| Seguridad | Cambio de contrasena |

---

## Panel de Administracion - Tabs detallados

### Tab: HOME (Inicio)
- Panel de bienvenida con tarjetas de acceso rapido a todas las funciones
- Cada tarjeta muestra icono, titulo y descripcion breve
- Accesos directos a: Dashboard, Reservas, Habitaciones, Servicios, Room Service, Horarios, Tipos de jornada, Cuadrantes, Asignacion, Usuarios, Clientes, Reservas manuales, Mensajes staff
- Enlaces rapidos al perfil: Informacion personal, Mi horario

### Tab: DASHBOARD
**Metricas en tiempo real:**
- Porcentaje de ocupacion actual
- Reservas de hoy / este mes
- Ingresos del mes
- Llegadas proximas

**Graficos:**
- Selector: vista mensual o anual
- Grafico de reservas por mes/ano
- Grafico de ingresos por mes/ano
- Navegacion por ano (anterior/siguiente)

### Tab: RESERVAS
- Tabla con todas las reservas del sistema
- Columnas: ID, Huesped, Email, Habitacion, Tipo, Entrada, Salida, Estado pago, Total
- Filtros y busqueda
- Acciones por reserva:
  - Ver detalles
  - Cancelar reserva
  - Ver pagos asociados

### Tab: HABITACIONES
- Lista de todas las habitaciones agrupadas por tipo
- Por cada habitacion:
  - Numero, tipo, precio por noche
  - Estado de limpieza (Limpia, Sucia, En limpieza, Mantenimiento)
  - Descripcion
- Acciones:
  - Editar precio
  - Editar descripcion
  - Cambiar estado de limpieza
  - Subir imagenes por tipo de habitacion

### Tab: SERVICIOS
- Lista de los 6 servicios del hotel
- Por cada servicio:
  - Nombre, precio
- Acciones:
  - Editar precio
  - Subir imagenes del servicio

### Tab: ROOM SERVICE
- Gestion del menu de Room Service
- Categorias: Desayuno, Almuerzo, Cena, Snacks, Bebidas
- Por cada item:
  - Nombre, descripcion, precio, categoria
  - Disponibilidad (activar/desactivar)
  - Imagen
- Acciones:
  - Crear nuevo item
  - Editar item existente
  - Activar/desactivar disponibilidad
  - Eliminar item

### Tab: USUARIOS
- Lista de todos los usuarios del sistema (staff y clientes)
- Columnas: ID, Nombre, Email, Roles, Verificado
- Acciones:
  - Crear nuevo usuario con rol asignado
  - Editar usuario
  - Eliminar usuario
  - Cambiar roles

### Tab: PERSONAL > Horarios
- Crear y gestionar plantillas de horario
- Cada horario tiene:
  - Nombre y descripcion
  - Tramos por dia de la semana (Lunes a Domingo)
  - Hora de inicio y fin por tramo
- Acciones: Crear, Editar tramos, Eliminar

### Tab: PERSONAL > Tipos de jornada (Perfiles)
- Perfiles de turno reutilizables
- Cada perfil tiene:
  - Nombre (ej: "Turno Manana", "Turno Tarde")
  - Descripcion
  - Color identificativo
  - Horarios asociados (uno o varios)
- Acciones: Crear, Editar, Asignar horarios, Eliminar

### Tab: PERSONAL > Cuadrantes (Planes)
- Planes semanales de turnos
- Cada plan tiene:
  - Nombre y descripcion
  - Perfil por defecto
  - Patron semanal: perfil asignado por dia (Lun-Dom)
  - Excepciones: dias especificos con perfil distinto
- Vista de calendario mensual/anual
- Acciones: Crear plan, Editar patron, Anadir excepciones

### Tab: PERSONAL > Asignacion
- Asignar cuadrantes (planes) a empleados
- Lista de empleados con su plan actual
- Selector de plan por empleado
- Vista previa del horario resultante

### Tab: MENSAJES STAFF
- Sistema de mensajeria interna
- Lista de conversaciones con empleados
- Chat bidireccional admin <-> empleado
- Indicadores de mensajes no leidos

### Tab: CLIENTES
- Lista de clientes registrados
- Informacion: nombre, email, fecha registro
- Estadisticas por cliente: reservas realizadas, gasto total

### Tab: RESERVAS MANUALES
- Crear reservas en nombre de un cliente
- Seleccionar:
  - Cliente existente (por email)
  - Tipo de habitacion
  - Fechas
  - Servicios adicionales
- La reserva se crea directamente como confirmada

---

## Codigos de descuento
Accesible desde el panel de admin:
- Crear codigos con:
  - Codigo unico (ej: VERANO20)
  - Tipo: Porcentaje o Importe fijo
  - Valor del descuento
  - Monto minimo de reserva (opcional)
  - Fecha de caducidad (opcional)
  - Uso maximo (opcional)
  - Activar/desactivar
- Ver usos actuales de cada codigo

---

## Acceso a paneles de otros roles
El admin tiene acceso completo a todos los paneles de staff:
- Recepcion (/recepcion)
- Calendario de recepcion (/recepcion/calendario)
- Mensajeria con clientes (/mensajeria)
- Peticiones especiales (/peticiones)
- Limpieza (/limpieza)
- Todos los calendarios departamentales
- Objetos perdidos

---

## Flujo tipico del admin

1. Revisa el Dashboard para ver ocupacion e ingresos
2. Gestiona habitaciones (precios, descripciones)
3. Configura servicios y menu de Room Service
4. Crea horarios y perfiles de turno para el personal
5. Asigna cuadrantes a los empleados
6. Crea codigos de descuento para promociones
7. Revisa reservas y gestiona incidencias
8. Se comunica con el equipo via mensajes internos
9. Crea reservas manuales para clientes que llaman por telefono
