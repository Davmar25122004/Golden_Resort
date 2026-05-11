# Manual de Usuario - Rol: CLIENTE

## Cuenta de prueba
- **Email:** test.cliente@golden.com
- **Contrasena:** Test1234!

---

## Descripcion general
El cliente es el huesped del hotel. Puede navegar por la web publica, reservar habitaciones, contratar servicios adicionales, pagar, gestionar sus reservas y comunicarse con recepcion.

---

## Navegacion (Barra superior)

### Menu HOTEL
| Opcion | Descripcion |
|--------|-------------|
| Habitaciones | Ver los 4 tipos de habitacion (Normal, Doble, Suite, Lujo) con precios, fotos y disponibilidad |
| Servicios | Ver los 6 servicios del hotel (Spa, Desayuno, Coche, Cena, Gimnasio, Room Service) |
| Contacto | Informacion de contacto, mapa, redes sociales |

### Menu RESERVAS
| Opcion | Descripcion |
|--------|-------------|
| Reservar | Abre el flujo de reserva. Redirige a la pagina de seleccion de habitacion |
| Mis Reservas | Pagina completa con todas las reservas del cliente |

### Menu MI PERFIL
| Opcion | Descripcion |
|--------|-------------|
| Informacion | Datos personales del cliente |
| Mis Reservas | Vista resumida de reservas dentro del perfil |
| Pagos | Metodos de pago guardados |
| Seguridad | Cambio de contrasena |

---

## Funcionalidades detalladas

### 1. Registro de cuenta
- Desde el boton "Iniciar Sesion" en la barra superior
- Campos obligatorios:
  - Nombre completo
  - Email
  - Contrasena (minimo 6 caracteres, 1 mayuscula, 1 digito)
  - Tipo de documento (DNI, NIE, Pasaporte, TIE) con validacion
  - Fecha de nacimiento (mayor de 18 anos)
  - Telefono con prefijo de pais
  - Aceptar politica de privacidad
- Tras registrarse, se envia un email de verificacion
- El usuario debe verificar el email antes de poder iniciar sesion

### 2. Inicio de sesion
- Email + contrasena
- Tambien disponible inicio con Google (OAuth2)
- Opcion "He olvidado mi contrasena" para reseteo por email

### 3. Buscar habitaciones
- En la pagina principal o en "Habitaciones"
- Selector de fechas (llegada y salida)
- Ve las 4 categorias con:
  - Foto principal
  - Precio por noche
  - Capacidad de personas
  - Numero de camas
  - Badge de disponibilidad (Disponible / Sin disponibilidad)
- Al hacer clic en la foto: lightbox con galeria de imagenes
- Boton "Reservar" para iniciar el proceso

### 4. Proceso de reserva
Al pulsar "Reservar" en una habitacion:

**Paso 1 - Seleccion de fechas:**
- Selector de fecha de llegada y salida
- Se muestra el precio total de la habitacion (precio x noches)

**Paso 2 - Servicios opcionales:**
Cada servicio se anade con un checkbox:
| Servicio | Precio | Detalles adicionales |
|----------|--------|---------------------|
| Spa & Bienestar | 85.00 EUR | Selector de hora (09:00 - 21:00, cada 30 min) |
| Desayuno Premium | 25.00 EUR | Selector de hora (07:00 - 11:00, cada 30 min) |
| Servicio de Coche | Variable | Selector de ubicacion (Aeropuerto 120 EUR, Renfe J. Sorolla 80 EUR, Renfe Cullera 40 EUR) + hora libre |
| Cena Gourmet | 95.00 EUR | Selector de hora (19:30 - 23:00, cada 30 min) |
| Gimnasio 24h | 15.00 EUR | Selector de hora libre |
| Room Service | Variable | Carta completa con items individuales por categoria |

**Paso 3 - Peticion especial (opcional):**
- Campo de texto libre para peticiones al hotel

**Paso 4 - Confirmacion:**
- Se crea la reserva y se muestra el total
- La reserva queda en estado "Guardada" (pendiente de pago)

### 5. Mis Reservas (pagina completa: /mis-reservas)
Muestra todas las reservas ordenadas por estado:

**Estados:**
| Estado | Color | Significado |
|--------|-------|-------------|
| En curso | Verde | El huesped esta actualmente alojado |
| Proxima | Dorado | La fecha de entrada es futura |
| Pasada | Gris | La fecha de salida ya paso |

**Acciones por reserva:**
- **Reservas proximas:**
  - Cancelar reserva (con mensaje de devolucion)
  - Gestionar Room Service (anadir/quitar items)
  - Editar peticion especial
  - Pagar (si aun no se ha pagado)
- **Reservas en curso:**
  - Gestionar Room Service
  - Editar peticion especial
- **Reservas pasadas:**
  - Solo visualizacion
  - Boton "Limpiar reservas pasadas" para ocultarlas

**Informacion mostrada por reserva:**
- Imagen de la habitacion
- Tipo y numero de habitacion
- Fechas de entrada y salida
- Numero de noches
- Desglose de servicios contratados
- Pedidos de Room Service
- Precio total
- Referencia (GR-XXX)

### 6. Perfil - Tab Informacion
- Ver y editar datos personales:
  - Nombre
  - Email (no editable)
  - Tipo y numero de documento
  - Fecha de nacimiento
  - Telefono con prefijo

### 7. Perfil - Tab Mis Reservas
- Vista resumida de reservas confirmadas dentro del perfil
- Muestra estado (En curso / Proxima / Pasada) con colores
- Boton "Cancelar" en reservas proximas
- Boton "Limpiar reservas pasadas"

### 8. Perfil - Tab Habitaciones Guardadas
- Reservas pendientes de pago
- Muestra:
  - Tipo y numero de habitacion
  - Fechas y noches
  - Precio total
  - Badge de disponibilidad actualizado
- Acciones: Pagar, Editar fechas, Eliminar

### 9. Perfil - Tab Pagos
- Metodos de pago guardados
- Anadir nuevo metodo:
  - **Tarjeta**: numero, titular, caducidad, marca (Visa/Mastercard/Amex)
  - **Bizum**: telefono
  - **Cuenta bancaria**: IBAN, titular, banco
- Marcar como predeterminado
- Eliminar metodo

### 10. Perfil - Tab Mensajes con recepcion
- Chat directo con el equipo de recepcion
- Enviar mensajes de texto (max 2000 caracteres)
- Ver historial de conversacion
- Indicadores de lectura

### 11. Perfil - Tab Seguridad
- Cambiar contrasena (requiere contrasena actual)

### 12. Pago de reserva
- Seleccionar metodo de pago guardado o anadir uno nuevo
- Aplicar codigo de descuento (porcentaje o importe fijo)
- Ver resumen: subtotal habitacion + servicios - descuento = total
- Confirmar pago
- Tras el pago, la reserva pasa a "Confirmada"
- Se genera factura PDF descargable

### 13. Objetos perdidos
- Ver lista de objetos encontrados por el hotel
- Reclamar un objeto:
  - Descripcion de por que es suyo
  - Telefono de contacto
  - Seguimiento del estado de la reclamacion

---

## Flujo tipico de un cliente

1. Se registra y verifica el email
2. Navega por las habitaciones y elige una
3. Selecciona fechas y servicios adicionales
4. Crea la reserva (queda guardada)
5. Va a "Habitaciones Guardadas" en su perfil
6. Paga con tarjeta/Bizum/cuenta bancaria
7. La reserva pasa a "Confirmada" en "Mis Reservas"
8. Puede enviar mensajes a recepcion si tiene dudas
9. Al llegar al hotel, hace check-in con recepcion
10. Durante la estancia puede pedir Room Service
11. Al salir, recepcion hace checkout
12. La reserva pasa a "Pasada"
