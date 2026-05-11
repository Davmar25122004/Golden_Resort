# Base de Datos - Documentacion de Tablas

## Resumen
El sistema utiliza PostgreSQL (Supabase) con 32 tablas que cubren: gestion de usuarios, reservas, pagos, servicios, limpieza, comunicacion interna, objetos perdidos y planificacion de personal.

---

## 1. usuarios
**Proposito:** Cuentas de todos los usuarios (clientes y personal).

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID autogenerado |
| email | VARCHAR (unique) | No | Email del usuario |
| password | VARCHAR | Si | Contrasena encriptada (BCrypt) |
| nombre | VARCHAR | Si | Nombre completo |
| supabase_uid | VARCHAR | Si | UID de Supabase (para OAuth) |
| email_verificado | BOOLEAN | No | Si el email ha sido verificado (default: false) |
| turno_plan_id | BIGINT (FK) | Si | Plan de turno asignado -> turno_plan |
| departamento | VARCHAR(40) | Si | RECEPCION, LIMPIEZA, COCINA, MANTENIMIENTO, DIRECCION, OTRO |
| tipo_documento | VARCHAR(20) | Si | Tipo de documento de identidad |
| num_documento | VARCHAR(20) | Si | Numero de documento |
| fecha_nacimiento | DATE | Si | Fecha de nacimiento |
| telefono_prefijo | VARCHAR(10) | Si | Prefijo telefonico (+34, etc.) |
| telefono | VARCHAR(20) | Si | Numero de telefono |

**Relaciones:**
- N:M con roles (via usuarios_roles)
- 1:N con reserva
- 1:1 con empleados
- 1:1 con conversacion_staff

---

## 2. roles
**Proposito:** Definicion de roles del sistema.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID autogenerado |
| name | VARCHAR (unique) | No | Nombre del rol |

**Valores existentes:** ROLE_ADMIN, ROLE_CLIENTE, ROLE_RECEPCION, ROLE_LIMPIEZA, ROLE_GIMNASIO, ROLE_SPA, ROLE_COCHE, ROLE_HOSTELERIA, ROLE_ROOMSERVICE

---

## 3. usuarios_roles
**Proposito:** Tabla intermedia para la relacion N:M entre usuarios y roles.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| usuario_id | BIGINT (PK, FK) | No | -> usuarios |
| role_id | BIGINT (PK, FK) | No | -> roles |

---

## 4. empleados
**Proposito:** Informacion extendida de empleados del hotel.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID autogenerado |
| usuario_id | BIGINT (FK, unique) | No | -> usuarios (1:1) |
| apellidos | VARCHAR(100) | Si | Apellidos |
| genero | VARCHAR(20) | Si | MASCULINO, FEMENINO, NO_ESPECIFICADO |
| tipo_documento | VARCHAR(20) | Si | DNI, NIE, PASAPORTE, CEDULA, OTRO |
| num_documento | VARCHAR(30) | Si | Numero de documento |
| telefono | VARCHAR(20) | Si | Telefono |
| cargo | VARCHAR(100) | Si | Puesto de trabajo |
| fecha_nacimiento | DATE | Si | Fecha de nacimiento |
| fecha_contratacion | DATE | Si | Fecha de alta |
| tipo_contratacion | VARCHAR(30) | Si | INDEFINIDO, TEMPORAL, POR_OBRA, PRACTICAS |
| tipo_empleado | VARCHAR(20) | Si | PERSONAL, BECARIO |
| lugar_nacimiento | VARCHAR(100) | Si | Lugar de nacimiento |
| pais | VARCHAR(60) | Si | Pais |
| telefono_casa | VARCHAR(20) | Si | Telefono personal |
| direccion_casa | VARCHAR(200) | Si | Direccion personal |
| telefono_oficina | VARCHAR(20) | Si | Telefono de oficina |
| direccion_oficina | VARCHAR(200) | Si | Direccion de oficina |
| foto_url | VARCHAR | Si | URL de la foto del empleado |
| departamento | VARCHAR(40) | Si | Departamento |
| turno_plan_id | BIGINT (FK) | Si | -> turno_plan |
| creado_en | TIMESTAMP | No | Fecha de creacion (auto) |
| actualizado_en | TIMESTAMP | No | Ultima actualizacion (auto) |

---

## 5. habitacion
**Proposito:** Inventario de habitaciones del hotel.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| numero | VARCHAR (unique) | No | Numero de habitacion (101, 201, etc.) |
| tipo | VARCHAR | No | NORMAL, DOBLE, SUITE, LUJO |
| precio_noche | DECIMAL(10,2) | No | Precio por noche en EUR |
| descripcion | VARCHAR | Si | Descripcion de la habitacion |
| estado_limpieza | VARCHAR(20) | No | LIMPIA, SUCIA, EN_LIMPIEZA, MANTENIMIENTO (default: LIMPIA) |

**Habitaciones actuales:** 12 habitaciones (3 por tipo)
- Normal: 101, 102, 103 (50 EUR/noche)
- Doble: 201, 202, 203 (100 EUR/noche)
- Suite: 301, 302, 303 (200 EUR/noche)
- Lujo: 401, 402, 403 (400 EUR/noche)

---

## 6. reserva
**Proposito:** Reservas de habitaciones.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| fecha_entrada | DATE | No | Fecha de check-in |
| fecha_salida | DATE | No | Fecha de check-out |
| usuario_id | BIGINT (FK) | No | -> usuarios (huesped) |
| habitacion_id | BIGINT (FK) | No | -> habitacion |
| peticion_especial | TEXT | Si | Peticion especial del huesped |
| checkout_en | TIMESTAMP | Si | Fecha/hora real del checkout (null si no se ha hecho) |

**Logica de negocio:**
- Una habitacion solo esta disponible si NO tiene reservas con pago COMPLETADO que solapen las fechas
- El checkout marca la habitacion como SUCIA y genera tarea de limpieza

---

## 7. servicio
**Proposito:** Servicios adicionales que se pueden contratar con la reserva.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| nombre | VARCHAR (unique) | No | Nombre del servicio |
| precio | DECIMAL | No | Precio base en EUR |

**Servicios actuales:**
| ID | Nombre | Precio |
|----|--------|--------|
| 1 | Spa & Bienestar | 85.00 |
| 2 | Desayuno Premium | 25.00 |
| 3 | Servicio de Coche Privado | 0.00 (variable segun ubicacion) |
| 4 | Cena Gourmet | 95.00 |
| 5 | Gimnasio 24h | 15.00 |
| 6 | Room Service | 0.00 (variable segun items) |

---

## 8. reserva_servicio
**Proposito:** Servicios contratados en cada reserva.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| reserva_id | BIGINT (FK) | No | -> reserva |
| servicio_id | BIGINT (FK) | No | -> servicio |
| cantidad | INTEGER | No | Cantidad contratada |
| hora | TIME | Si | Hora programada del servicio |
| ubicacion | VARCHAR(60) | Si | Ubicacion (para coche: AEROPUERTO_VALENCIA, RENFE_JOAQUIN_SOROLLA, RENFE_CULLERA) |
| precio_servicio | DECIMAL(10,2) | Si | Precio real cobrado (puede diferir del precio base) |

---

## 9. pagos
**Proposito:** Registro de pagos de reservas.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID autogenerado |
| reserva_id | BIGINT (FK) | No | -> reserva |
| usuario_id | BIGINT (FK) | No | -> usuarios |
| metodo_pago_id | BIGINT (FK) | Si | -> metodos_pago |
| subtotal | DECIMAL(10,2) | No | Importe antes de descuento |
| descuento | DECIMAL(10,2) | No | Importe descontado (default: 0.00) |
| total | DECIMAL(10,2) | No | Importe final cobrado |
| codigo_descuento | VARCHAR | Si | Codigo de descuento aplicado |
| estado | VARCHAR | No | PENDIENTE, COMPLETADO, CANCELADO, REEMBOLSADO |
| referencia | VARCHAR(40) | Si | Referencia de transaccion |
| metodo_tipo | VARCHAR | Si | Tipo de pago usado (TARJETA, BIZUM, CUENTA_BANCARIA) |
| metodo_marca | VARCHAR | Si | Marca de tarjeta (Visa, etc.) |
| metodo_ultimos_cuatro | VARCHAR | Si | Ultimos 4 digitos |
| created_at | TIMESTAMP | No | Fecha de creacion |
| completed_at | TIMESTAMP | Si | Fecha de completado |

---

## 10. metodos_pago
**Proposito:** Metodos de pago guardados por los usuarios.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID autogenerado |
| usuario_id | BIGINT (FK) | No | -> usuarios |
| tipo | VARCHAR | No | TARJETA, BIZUM, CUENTA_BANCARIA |
| marca | VARCHAR | Si | Marca de tarjeta |
| ultimos_cuatro | VARCHAR | Si | Ultimos 4 digitos |
| titular | VARCHAR | Si | Nombre del titular |
| caducidad | VARCHAR | Si | Fecha de caducidad (MM/YY) |
| direccion_facturacion | VARCHAR(255) | Si | Direccion de facturacion |
| telefono | VARCHAR | Si | Telefono (para Bizum) |
| iban | VARCHAR | Si | IBAN (para cuenta bancaria) |
| banco | VARCHAR | Si | Nombre del banco |
| tipo_tarjeta | VARCHAR | Si | Debito/Credito |
| es_default | BOOLEAN | No | Es el metodo predeterminado (default: false) |
| created_at | TIMESTAMP | No | Fecha de creacion |

---

## 11. codigos_descuento
**Proposito:** Codigos promocionales de descuento.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID autogenerado |
| codigo | VARCHAR(40, unique) | No | Codigo (ej: VERANO20) |
| tipo | VARCHAR | No | PORCENTAJE, FIJO |
| valor | DECIMAL(10,2) | No | Valor del descuento (% o EUR) |
| monto_minimo | DECIMAL(10,2) | Si | Importe minimo para aplicar |
| valido_hasta | DATE | Si | Fecha de caducidad |
| uso_maximo | INTEGER | Si | Limite de usos |
| usos | INTEGER | No | Usos actuales (default: 0) |
| activo | BOOLEAN | No | Esta activo (default: true) |
| created_at | TIMESTAMP | No | Fecha de creacion |

---

## 12. room_service_item
**Proposito:** Carta/menu de Room Service.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| nombre | VARCHAR | No | Nombre del plato/bebida |
| descripcion | VARCHAR(500) | Si | Descripcion del item |
| precio | DECIMAL | No | Precio en EUR |
| categoria | VARCHAR | No | DESAYUNO, ALMUERZO, CENA, SNACKS, BEBIDAS |
| disponible | BOOLEAN | No | Disponible para pedir (default: true) |
| imagen_url | VARCHAR(500) | Si | URL de la imagen del plato |

---

## 13. pedido_room_service
**Proposito:** Pedidos de Room Service realizados por huespedes.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| reserva_id | BIGINT (FK) | No | -> reserva |
| item_id | BIGINT (FK) | No | -> room_service_item |
| cantidad | INTEGER | No | Cantidad pedida (default: 1) |
| fecha_pedido | TIMESTAMP | Si | Fecha/hora del pedido (default: now) |

---

## 14. nota_reserva
**Proposito:** Notas internas del personal sobre reservas (no visibles para el cliente).

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| reserva_id | BIGINT (FK) | No | -> reserva |
| autor_id | BIGINT (FK) | No | -> usuarios (quien escribio la nota) |
| autor_email | VARCHAR(255) | Si | Email del autor (cache) |
| texto | TEXT | No | Contenido de la nota |
| creado_en | TIMESTAMP | No | Fecha de creacion (auto) |

---

## 15. conversacion
**Proposito:** Conversaciones de chat entre clientes y recepcion.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| cliente_id | BIGINT (FK, unique) | No | -> usuarios (1 conversacion por cliente) |
| creada_en | TIMESTAMP | No | Fecha de creacion |
| ultima_actividad | TIMESTAMP | No | Fecha del ultimo mensaje |
| no_leidos_cliente | INTEGER | No | Mensajes no leidos por el cliente (default: 0) |
| no_leidos_recepcion | INTEGER | No | Mensajes no leidos por recepcion (default: 0) |
| estado | VARCHAR | No | ABIERTA, PENDIENTE, RESUELTA (default: ABIERTA) |

---

## 16. mensaje
**Proposito:** Mensajes individuales dentro de una conversacion cliente-recepcion.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| conversacion_id | BIGINT (FK) | No | -> conversacion |
| autor_id | BIGINT (FK) | No | -> usuarios |
| autor_rol | VARCHAR(20) | No | CLIENTE o RECEPCION |
| texto | VARCHAR(2000) | Si | Texto del mensaje |
| creado_en | TIMESTAMP | No | Fecha del mensaje (auto) |
| leido_en | TIMESTAMP | Si | Fecha de lectura (null si no leido) |
| adjunto_url | VARCHAR(500) | Si | URL del adjunto |
| adjunto_nombre | VARCHAR(255) | Si | Nombre del archivo adjunto |

---

## 17. conversacion_staff
**Proposito:** Conversaciones internas entre empleados y admin.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| staff_usuario_id | BIGINT (FK, unique) | No | -> usuarios (1 conversacion por empleado) |
| creado_en | TIMESTAMP | No | Fecha de creacion |
| ultimo_mensaje_en | TIMESTAMP | Si | Fecha del ultimo mensaje |

---

## 18. mensaje_staff
**Proposito:** Mensajes dentro de conversaciones internas.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| conversacion_id | BIGINT (FK) | No | -> conversacion_staff |
| autor_usuario_id | BIGINT (FK) | No | -> usuarios |
| autor_es_admin | BOOLEAN | No | Si el autor es admin (default: false) |
| texto | TEXT | No | Texto del mensaje |
| leido | BOOLEAN | No | Si ha sido leido (default: false) |
| creado_en | TIMESTAMP | No | Fecha del mensaje (auto) |

---

## 19. tarea_limpieza
**Proposito:** Tareas de limpieza asignadas al personal.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| habitacion_id | BIGINT (FK) | No | -> habitacion |
| reserva_id | BIGINT (FK) | Si | -> reserva (si se genero por checkout) |
| asignado_a | BIGINT (FK) | Si | -> usuarios (limpiador asignado) |
| tipo | VARCHAR | No | SALIDA, DIARIA, MANTENIMIENTO, OTRA (default: SALIDA) |
| estado | VARCHAR | No | PENDIENTE, EN_PROGRESO, COMPLETADA, CANCELADA (default: PENDIENTE) |
| prioridad | VARCHAR | No | BAJA, NORMAL, ALTA, URGENTE (default: NORMAL) |
| notas | TEXT | Si | Instrucciones para el limpiador |
| notas_finales | TEXT | Si | Observaciones al completar |
| creada_en | TIMESTAMP | No | Fecha de creacion (auto) |
| iniciada_en | TIMESTAMP | Si | Cuando se inicio la limpieza |
| completada_en | TIMESTAMP | Si | Cuando se termino |

---

## 20. incidencia_limpieza
**Proposito:** Incidencias de mantenimiento reportadas por el personal.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| habitacion_id | BIGINT (FK) | Si | -> habitacion (null si es general) |
| reportado_por | BIGINT (FK) | Si | -> usuarios |
| tipo | VARCHAR | No | MANTENIMIENTO, INVENTARIO, OTRO (default: MANTENIMIENTO) |
| prioridad | VARCHAR | No | BAJA, NORMAL, ALTA, URGENTE (default: NORMAL) |
| estado | VARCHAR | No | ABIERTA, EN_PROCESO, RESUELTA (default: ABIERTA) |
| descripcion | TEXT | No | Descripcion del problema |
| resolucion | TEXT | Si | Como se resolvio |
| creada_en | TIMESTAMP | No | Fecha de reporte (auto) |
| resuelta_en | TIMESTAMP | Si | Fecha de resolucion |

---

## 21. objeto_perdido
**Proposito:** Inventario de objetos encontrados en el hotel.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| habitacion_id | BIGINT (FK) | Si | -> habitacion |
| reportado_por | BIGINT (FK) | Si | -> usuarios |
| descripcion | TEXT | No | Descripcion del objeto |
| imagen_url | VARCHAR(500) | Si | Foto del objeto |
| encontrado_en | TIMESTAMP | No | Cuando se encontro (default: now) |
| estado | VARCHAR | No | DISPONIBLE, ENTREGADO, DESCARTADO (default: DISPONIBLE) |
| notas_entrega | TEXT | Si | Notas de entrega |
| creada_en | TIMESTAMP | No | Fecha de registro (auto) |
| entregado_en | TIMESTAMP | Si | Fecha de entrega al dueno |

---

## 22. objeto_reclamacion
**Proposito:** Reclamaciones de clientes sobre objetos perdidos.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| objeto_id | BIGINT (FK) | No | -> objeto_perdido |
| usuario_id | BIGINT (FK) | No | -> usuarios (quien reclama) |
| mensaje | TEXT | No | Descripcion de por que es suyo |
| telefono | VARCHAR(40) | Si | Telefono de contacto |
| estado | VARCHAR | No | PENDIENTE, ACEPTADA, RECHAZADA (default: PENDIENTE) |
| creado_en | TIMESTAMP | No | Fecha de reclamacion (auto) |
| resuelto_en | TIMESTAMP | Si | Fecha de resolucion |
| notas_staff | TEXT | Si | Notas del personal |

---

## 23. pending_registrations
**Proposito:** Registros de usuario pendientes de verificacion de email.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| email | VARCHAR (PK) | No | Email del usuario |
| nombre | VARCHAR | Si | Nombre |
| password_hash | VARCHAR | Si | Contrasena encriptada |
| supabase_uid | VARCHAR | Si | UID de Supabase |
| created_at | TIMESTAMP | Si | Fecha de registro |
| tipo_documento | VARCHAR | Si | Tipo de documento |
| num_documento | VARCHAR | Si | Numero de documento |
| fecha_nacimiento | DATE | Si | Fecha de nacimiento |
| telefono_prefijo | VARCHAR | Si | Prefijo telefonico |
| telefono | VARCHAR | Si | Telefono |

---

## 24. password_reset_tokens
**Proposito:** Tokens temporales para reseteo de contrasena.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID autogenerado |
| token | VARCHAR (unique) | No | Token de reseteo |
| usuario_id | BIGINT (FK) | No | -> usuarios |
| expiry | TIMESTAMP | No | Fecha de expiracion |

---

## 25. horario
**Proposito:** Plantillas de horario de trabajo reutilizables.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| nombre | VARCHAR(120) | No | Nombre del horario (ej: "Turno Manana") |
| descripcion | TEXT | Si | Descripcion |
| creado_en | TIMESTAMP | No | Fecha de creacion (auto) |
| actualizado_en | TIMESTAMP | No | Ultima actualizacion (auto) |

---

## 26. horario_tramo
**Proposito:** Tramos horarios dentro de un horario (horas de trabajo por dia).

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| horario_id | BIGINT (FK) | No | -> horario |
| dia_semana | SMALLINT | No | Dia de la semana (1=Lunes ... 7=Domingo) |
| hora_inicio | TIME | No | Hora de entrada |
| hora_fin | TIME | No | Hora de salida |

---

## 27. turno_perfil
**Proposito:** Perfiles de turno (tipos de jornada).

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| nombre | VARCHAR(120) | No | Nombre (ej: "Jornada Completa") |
| descripcion | TEXT | Si | Descripcion |
| color | VARCHAR(7) | Si | Color hex (default: #c9a96e) |
| creado_en | TIMESTAMP | No | Fecha de creacion (auto) |
| actualizado_en | TIMESTAMP | No | Ultima actualizacion (auto) |

---

## 28. turno_perfil_horario
**Proposito:** Asociacion de horarios con perfiles de turno.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| perfil_id | BIGINT (FK) | No | -> turno_perfil |
| horario_id | BIGINT (FK) | No | -> horario |

**Restriccion:** Unique (perfil_id, horario_id)

---

## 29. turno_plan
**Proposito:** Planes/cuadrantes de turnos asignables a empleados.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| nombre | VARCHAR(120) | No | Nombre del plan |
| descripcion | TEXT | Si | Descripcion |
| perfil_default_id | BIGINT (FK) | Si | -> turno_perfil (perfil por defecto) |
| creado_en | TIMESTAMP | No | Fecha de creacion (auto) |
| actualizado_en | TIMESTAMP | No | Ultima actualizacion (auto) |

---

## 30. turno_plan_semana
**Proposito:** Patron semanal de un plan (que perfil aplica cada dia).

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| plan_id | BIGINT (PK, FK) | No | -> turno_plan |
| dia_semana | SMALLINT (PK) | No | Dia (1=Lunes ... 7=Domingo) |
| perfil_id | BIGINT (FK) | No | -> turno_perfil |

**Clave primaria compuesta:** (plan_id, dia_semana)

---

## 31. turno_plan_dia
**Proposito:** Excepciones diarias al patron semanal.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| plan_id | BIGINT (FK) | No | -> turno_plan |
| fecha | DATE | No | Fecha especifica |
| perfil_id | BIGINT (FK) | Si | -> turno_perfil (null = dia libre) |

**Restriccion:** Unique (plan_id, fecha)

---

## 32. turno_plan_dia_tramo
**Proposito:** Tramos horarios personalizados para dias especificos.

| Columna | Tipo | Nullable | Descripcion |
|---------|------|----------|-------------|
| id | BIGINT (PK) | No | ID (secuencia) |
| plan_id | BIGINT | No | ID del plan |
| fecha | DATE | No | Fecha |
| hora_inicio | TIME | No | Hora de entrada |
| hora_fin | TIME | No | Hora de salida |

---

## Diagrama de relaciones principales

```
usuarios ──1:N──> reserva ──N:1──> habitacion
    │                 │
    │                 ├──1:N──> reserva_servicio ──N:1──> servicio
    │                 ├──1:N──> pedido_room_service ──N:1──> room_service_item
    │                 ├──1:N──> nota_reserva
    │                 └──1:N──> tarea_limpieza
    │
    ├──1:1──> empleados
    ├──1:1──> conversacion ──1:N──> mensaje
    ├──1:1──> conversacion_staff ──1:N──> mensaje_staff
    ├──N:M──> roles
    ├──1:N──> metodos_pago
    ├──1:N──> pagos
    └──N:1──> turno_plan ──1:N──> turno_plan_semana ──N:1──> turno_perfil
                    │                                           │
                    └──1:N──> turno_plan_dia              turno_perfil_horario ──N:1──> horario
                                                                                        │
                                                                                  horario_tramo

habitacion ──1:N──> incidencia_limpieza
           ──1:N──> objeto_perdido ──1:N──> objeto_reclamacion
```
