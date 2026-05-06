# Seguridad y Mantenimiento — Golden Resort

Registro de cambios de seguridad aplicados al proyecto Spring Boot + Supabase.  
Cada entrada explica el problema, por qué es peligroso y qué se cambió.

---

## Cambio 1 — Credenciales expuestas en `application.properties`

### Problema
Las credenciales reales de producción estaban escritas en texto plano directamente en el archivo `application.properties`, que forma parte del repositorio Git:

- Contraseña de base de datos Supabase/PostgreSQL
- Clave anon pública de Supabase (JWT firmado)
- Google OAuth Client Secret
- Contraseña de la cuenta de Gmail para envío de correos

Cualquier persona con acceso al repositorio (ahora o en el futuro) podría leer estas credenciales y acceder a la base de datos, suplantar la identidad de la aplicación en Google o enviar correos desde la cuenta del hotel.

### Por qué lo hacemos
Si el repositorio alguna vez se hace público, o si alguien externo obtiene acceso a él, tendría acceso completo a todos los datos del hotel y de los clientes. Además, servicios como GitHub escanean commits en busca de credenciales expuestas y notifican a los proveedores (Supabase, Google), que pueden revocarlas automáticamente cortando el servicio.

### Cambio aplicado

**`src/main/resources/application.properties`** — los valores reales se sustituyeron por placeholders:

```properties
# Antes
supabase.anon-key=eyJhbGci...
spring.datasource.username=postgres.udojqeioeixaxbsxwpfe
spring.datasource.password=DapagojoseAA
spring.security.oauth2.client.registration.google.client-secret=GOCSPX-...
spring.mail.password=jxxvcxcailspotya

# Después
supabase.anon-key=${SUPABASE_ANON_KEY}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.mail.password=${GMAIL_PASSWORD}
```

**`.env`** (en la raíz del proyecto) — contiene los valores reales y **nunca se sube a Git**:

```
DB_USERNAME=postgres.udojqeioeixaxbsxwpfe
DB_PASSWORD=...
SUPABASE_ANON_KEY=...
GOOGLE_CLIENT_SECRET=...
GMAIL_PASSWORD=...
```

**`.gitignore`** — ya incluía `.env` y `.env.*`, por lo que el archivo queda excluido del repositorio automáticamente.

Para que Spring Boot cargue el `.env` al arrancar, se añade la dependencia `dotenv-java` en `pom.xml` y se inicializa en `SupabaseTestApplication.java`:

```java
public static void main(String[] args) {
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
    SpringApplication.run(SupabaseTestApplication.class, args);
}
```

### Cómo cargar el `.env` automáticamente — `dotenv-java`

Spring Boot no carga archivos `.env` por defecto. Para que lo lea en cualquier entorno (IDE, consola, servidor), se añadió la librería `dotenv-java`.

**`pom.xml`** — nueva dependencia añadida:

```xml
<dependency>
    <groupId>io.github.cdimascio</groupId>
    <artifactId>dotenv-java</artifactId>
    <version>3.0.0</version>
</dependency>
```

**`SupabaseTestApplication.java`** — se carga el `.env` antes de arrancar Spring:

```java
// Antes
public static void main(String[] args) {
    SpringApplication.run(SupabaseTestApplication.class, args);
}

// Después
public static void main(String[] args) {
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
    SpringApplication.run(SupabaseTestApplication.class, args);
}
```

`ignoreIfMissing()` hace que si el `.env` no existe (por ejemplo en un servidor donde las variables ya están en el sistema), la aplicación arranque igualmente sin errores.

### Estado
- [x] `application.properties` actualizado con placeholders
- [x] `.env` creado con los valores reales (excluido de Git)
- [x] Dependencia `dotenv-java` añadida al `pom.xml`
- [x] `SupabaseTestApplication.java` actualizado para cargar el `.env`
- [ ] Credenciales rotadas en Supabase, Google y Gmail (recomendado)
- [ ] Historial de Git limpiado con BFG Repo-Cleaner (recomendado si el repo fue público)

---

---

## Cambio 2 — Race condition en procesamiento de pagos

### Problema
Cuando dos usuarios pulsaban "Pagar" al mismo tiempo sobre la misma habitación y fechas, ambos podían pasar la comprobación de disponibilidad antes de que ninguno hubiera guardado el pago. Resultado: dos clientes pagaban por la misma habitación.

### Por qué lo hacemos
Es un fallo económico directo: el hotel cobraría dos veces por una habitación que solo puede ocupar una persona. Además, uno de los dos clientes llegaría al hotel sin reserva válida.

### Cambio aplicado

El fix añade un **bloqueo pesimista** (`PESSIMISTIC_WRITE`) sobre la fila de la habitación en base de datos justo antes del check de disponibilidad. Mientras la transacción del Cliente A tiene ese candado, la del Cliente B espera. Cuando A termina, B comprueba la disponibilidad y ya encuentra la habitación ocupada.

**`HabitacionRepository.java`** — nuevo método con candado:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT h FROM Habitacion h WHERE h.id = :id")
Optional<Habitacion> findByIdWithLock(@Param("id") Long id);
```

**`PagoService.java`** — se llama al candado antes del check:

```java
// Antes
long ocupadas = reservaRepository.contarReservasSolapadasExcluyendo(...);
if (ocupadas > 0) throw new RuntimeException("Habitación ocupada");

// Después
habitacionRepository.findByIdWithLock(r.getHabitacion().getId())  // ← candado aquí
        .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));

long ocupadas = reservaRepository.contarReservasSolapadasExcluyendo(...); // ahora es seguro
if (ocupadas > 0) throw new RuntimeException("Habitación ocupada");
```

### Estado
- [x] `HabitacionRepository` — añadido `findByIdWithLock`
- [x] `PagoService` — inyectado `HabitacionRepository` y aplicado candado en `procesar()`

---

---

## Cambio 3 — Inyección SQL en generación de turnos

### Problema
En `TurnosService.java`, el método `aplicarBulkOverride()` construye una query SQL nativa pegando directamente los días de la semana recibidos por HTTP dentro del texto de la query:

```java
// Los días llegan del cliente HTTP: [1, 2, 3]
String inList = diasRaw.stream()
    .map(n -> String.valueOf(n.intValue()))
    .collect(Collectors.joining(","));
dowFilter = " WHERE EXTRACT(ISODOW FROM g) IN (" + inList + ")";
// Resultado: WHERE EXTRACT(ISODOW FROM g) IN (1,2,3)
```

Si alguien manipulara los valores de la lista, podría inyectar SQL arbitrario dentro de la query.

### Por qué lo hacemos
Aunque el endpoint requiere rol ADMIN, pegar datos externos directamente en SQL es una mala práctica que no debe existir en ningún punto del código. Un error de configuración de permisos en el futuro podría exponer este endpoint a usuarios no autorizados.

### Cambio aplicado

**`TurnosService.java`** — se valida que cada valor esté entre 1 y 7 antes de usarlo. Cualquier valor fuera de rango se descarta silenciosamente. Si después del filtro no queda ningún día válido, se lanza un error antes de llegar a la query.

```java
// Antes
String inList = diasRaw.stream()
    .map(n -> String.valueOf(n.intValue()))
    .collect(Collectors.joining(","));
dowFilter = " WHERE EXTRACT(ISODOW FROM g) IN (" + inList + ")";

// Después
List<Integer> diasValidados = diasRaw.stream()
    .map(Number::intValue)
    .filter(d -> d >= 1 && d <= 7)   // solo lunes(1) a domingo(7)
    .distinct()                        // sin duplicados
    .collect(Collectors.toList());

if (diasValidados.isEmpty())
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
        "dias_semana debe contener valores entre 1 y 7");

String inList = diasValidados.stream()
    .map(String::valueOf)
    .collect(Collectors.joining(","));
dowFilter = " WHERE EXTRACT(ISODOW FROM g) IN (" + inList + ")";
```

### Estado
- [x] `TurnosService.java` — validación de rango aplicada en `aplicarBulkOverride()`

---

---

## Cambio 4 — IDOR en endpoints de servicios de reserva

### Problema
Los endpoints `POST /api/reservas/{id}/servicios` y `DELETE /api/reservas/{id}/servicios/{servicioId}` no verificaban que la reserva perteneciera al usuario autenticado. Cualquier cliente podía añadir o eliminar servicios de la reserva de otro cliente simplemente cambiando el `id` en la URL.

Esto se llama **IDOR** (Insecure Direct Object Reference) y es el tipo de vulnerabilidad más común según OWASP.

### Por qué lo hacemos
Un cliente malintencionado podría:
- Añadir servicios caros (spa, coche, room service) a la reserva de otro cliente
- Eliminar servicios ya contratados por otro cliente antes de su estancia
- Enumerar qué reservas existen probando IDs consecutivos

### Cambio aplicado

**`ReservaService.java`** — se añaden los parámetros `email` e `isAdmin` y se verifica la propiedad antes de operar:

```java
// Antes
public void agregarServicio(Long reservaId, ServicioRequest request) {
    Reserva reserva = reservaRepository.findById(reservaId)...

// Después
public void agregarServicio(Long reservaId, ServicioRequest request, String email, boolean isAdmin) {
    Reserva reserva = reservaRepository.findById(reservaId)...
    if (!isAdmin && !reserva.getUsuario().getEmail().equals(email))
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para modificar esta reserva");
```

Lo mismo para `quitarServicio`.

**`ReservaController.java`** — se añade `Authentication auth` a ambos endpoints y se pasa al servicio:

```java
// Antes
public ResponseEntity<?> agregarServicio(@PathVariable Long id, @RequestBody ServicioRequest request) {
    reservaService.agregarServicio(id, request);

// Después
public ResponseEntity<?> agregarServicio(@PathVariable Long id, @RequestBody ServicioRequest request,
                                         Authentication auth) {
    reservaService.agregarServicio(id, request, getEmail(auth), isAdmin(auth));
```

Los admins pueden operar sobre cualquier reserva. Los clientes solo sobre las suyas.

### Estado
- [x] `ReservaService` — check de propietario en `agregarServicio` y `quitarServicio`
- [x] `ReservaController` — `Authentication` añadido a ambos endpoints

---

---

## Cambio 5 — Walk-in sin validación de fechas pasadas

### Problema
El método `crearWalkIn` en `RecepcionService.java` aceptaba una `fechaEntrada` en el pasado. Un recepcionista (o alguien con acceso al endpoint) podía crear reservas con fechas antiguas sin ningún error.

### Por qué lo hacemos
Las reservas históricas falsas distorsionan los reportes financieros y de ocupación. Si el sistema cuenta reservas pasadas que nunca ocurrieron, los ingresos calculados, las estadísticas de ocupación y los informes de gestión son incorrectos. También dificulta auditorías.

### Cambio aplicado

**`RecepcionService.java`** — una línea añadida entre la validación de nulos y la validación de orden de fechas:

```java
// Antes
if (fechaEntrada == null || fechaSalida == null)
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fechas requeridas.");
if (!fechaSalida.isAfter(fechaEntrada))
    throw ...

// Después
if (fechaEntrada == null || fechaSalida == null)
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fechas requeridas.");
if (fechaEntrada.isBefore(LocalDate.now()))
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
        "No se puede crear walk-in para fechas pasadas.");
if (!fechaSalida.isAfter(fechaEntrada))
    throw ...
```

Los walk-in para hoy mismo (`fechaEntrada.equals(LocalDate.now())`) sí están permitidos, que es el caso de uso normal de recepción.

### Estado
- [x] `RecepcionService` — validación de fecha pasada añadida en `crearWalkIn`

---

---

## Cambio 6 — CSRF deshabilitado globalmente

### Problema
La protección CSRF estaba completamente deshabilitada en `SecurityConfig.java`:
```java
.csrf(csrf -> csrf.disable())
```
Esto permitía que una página web maliciosa hiciera que el navegador del cliente enviara peticiones al hotel (crear reservas, pagar, cancelar) usando su sesión activa, sin que el cliente lo supiera ni lo autorizara.

### Por qué lo hacemos
CSRF (Cross-Site Request Forgery) es un ataque en el que un sitio externo aprovecha que el navegador envía automáticamente las cookies de sesión. Sin protección, cualquier página puede hacer una llamada silenciosa a `POST /api/pagos/confirmar` con la sesión del cliente y completar un pago.

### Cambio aplicado

**`SecurityConfig.java`** — se activa CSRF con cookie token (legible por JS, no HttpOnly):

```java
// Antes
.csrf(csrf -> csrf.disable())

// Después
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .ignoringRequestMatchers(
        "/api/auth/register",
        "/api/auth/confirmar-verificacion",
        "/api/auth/reset-password/**"))
```

Los tres endpoints ignorados son flujos públicos que ocurren antes de que exista sesión, por lo que no necesitan (ni pueden) verificar el token.

**`01-globals.js`** — interceptor global de `fetch` que lee el token de la cookie y lo añade automáticamente a todas las peticiones POST/PUT/PATCH/DELETE, sin tocar ningún otro archivo JS:

```javascript
(function () {
    function getCsrfToken() {
        var match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }

    var _origFetch = window.fetch;
    window.fetch = function (url, options) {
        options = options || {};
        var method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(method) !== -1) {
            var token = getCsrfToken();
            if (token) {
                options.headers = Object.assign({ 'X-XSRF-TOKEN': token }, options.headers || {});
            }
        }
        return _origFetch.call(window, url, options);
    };
})();
```

Spring pone la cookie `XSRF-TOKEN` en la primera respuesta GET. El interceptor la lee y la adjunta como cabecera `X-XSRF-TOKEN` en cada petición que modifica datos. Un sitio externo no puede leer esa cookie (política de mismo origen del navegador), por lo que no puede falsificar la petición.

### Estado
- [x] `SecurityConfig.java` — CSRF habilitado con `CookieCsrfTokenRepository`
- [x] `01-globals.js` — interceptor global de fetch añadido

---

---

## Cambio 7 — Rate limiting en endpoints críticos

### Problema
Los endpoints de registro, pago y creación de reservas no tenían ningún límite de peticiones por IP. Un atacante podía:
- Enviar miles de registros falsos para llenar la base de datos
- Bombardear `/api/pagos/confirmar` para agotar recursos del servidor
- Crear reservas masivas bloqueando habitaciones sin intención real de pagar

### Por qué lo hacemos
Sin rate limiting, cualquier script automatizado puede abusar de la aplicación sin coste alguno. Es la base de la protección contra ataques de fuerza bruta, denegación de servicio y abuso de recursos.

### Cambio aplicado

**`pom.xml`** — nueva dependencia Bucket4j (librería de rate limiting para Java):
```xml
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>7.6.0</version>
</dependency>
```

**`RateLimitService.java`** — servicio central con un bucket por IP y por tipo de endpoint. Cada bucket se rellena automáticamente con el tiempo:

```java
// 5 registros por hora por IP
public Bucket bucketRegistro(String ip) { ... }

// 10 pagos por hora por IP
public Bucket bucketPago(String ip) { ... }

// 20 reservas por hora por IP
public Bucket bucketReserva(String ip) { ... }
```

**Controllers** — una línea al inicio de cada endpoint protegido:

```java
// MainController — registro
if (!rateLimitService.bucketRegistro(request.getRemoteAddr()).tryConsume(1))
    return ResponseEntity.status(429).body("Demasiados intentos de registro. Espera un momento.");

// PagoController — confirmar pago
if (!rateLimitService.bucketPago(request.getRemoteAddr()).tryConsume(1))
    return ResponseEntity.status(429).body("Demasiados intentos de pago. Espera un momento.");

// ReservaController — crear reserva (ambos endpoints POST)
if (!rateLimitService.bucketReserva(request.getRemoteAddr()).tryConsume(1))
    return ResponseEntity.status(429).body("Demasiadas reservas en poco tiempo. Espera un momento.");
```

Cuando se supera el límite, el servidor devuelve `HTTP 429 Too Many Requests`. El bucket se rellena solo pasada la hora, sin necesidad de intervención manual.

### Estado
- [x] `RateLimitService.java` creado con tres tipos de bucket
- [x] `MainController` — rate limit en `/api/auth/register`
- [x] `PagoController` — rate limit en `/api/pagos/confirmar`
- [x] `ReservaController` — rate limit en `POST /api/reservas` y `POST /api/reservas/por-tipo`

---

---

## Cambio 8 — Validación de códigos de descuento

### Problema
El endpoint `POST /api/admin/codigos-descuento` tenía validaciones incompletas:
- Sin límite de longitud ni formato en el código → se podían crear códigos de 500 caracteres con símbolos extraños
- Sin validación de que el porcentaje fuera ≤ 100% → un descuento del 999% haría que el precio fuera negativo
- Sin validación de que `usoMaximo` fuera positivo → se podía crear un código con uso máximo de -1
- Sin validación de `montoMinimo` negativo
- El `PUT` (edición) no tenía ninguna de estas validaciones

### Por qué lo hacemos
Un admin malintencionado o con un error podría crear un código de descuento del 999% que, al aplicarse, generaría un total negativo — el hotel debería dinero al cliente. También afecta a la integridad de los datos de la base de datos.

### Cambio aplicado

**`AdminController.java`** — validaciones añadidas en `POST` y `PUT`:

```java
// Formato del código: solo mayúsculas, números y guiones, entre 3 y 30 caracteres
if (!codigo.matches("^[A-Z0-9-]{3,30}$"))
    return badRequest("El código solo puede tener letras mayúsculas, números y guiones (3-30 caracteres).");

// Valor positivo
if (valor.compareTo(BigDecimal.ZERO) <= 0)
    return badRequest("El valor debe ser mayor que cero.");

// Si es porcentaje, no puede superar el 100%
if (tipo == TipoDescuento.PORCENTAJE && valor.compareTo(new BigDecimal("100")) > 0)
    return badRequest("El porcentaje no puede superar el 100%.");

// Monto mínimo no negativo
if (montoMinimo.compareTo(BigDecimal.ZERO) < 0)
    return badRequest("El monto mínimo no puede ser negativo.");

// Uso máximo positivo
if (usoMaximo <= 0)
    return badRequest("El uso máximo debe ser mayor que cero.");
```

Las mismas validaciones se aplican también al `PUT` (edición), donde antes no existía ninguna.

### Estado
- [x] `AdminController` — validaciones en `POST /codigos-descuento`
- [x] `AdminController` — validaciones en `PUT /codigos-descuento/{id}`

---

*Próximas entradas: validación de archivos subidos...*
