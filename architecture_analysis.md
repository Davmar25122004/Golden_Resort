# Análisis de la Arquitectura del Proyecto Spring Boot

Como Arquitecto de Software Senior, he analizado detalladamente la estructura de tu proyecto. El sistema sigue un patrón arquitectónico clásico de capas basado en **Spring Boot**, separando claramente las responsabilidades en Dominio, Repositorios, DTOs, Servicios y Controladores. 

A continuación, se detalla cada componente y su rol dentro de la arquitectura.

---

## 1. Capa de Dominio (Entities)

**Propósito general:**  
Esta capa representa el núcleo del negocio. Contiene las clases (Entidades) que mapean directamente a las tablas de la base de datos relacional mediante JPA/Hibernate. Define las relaciones (OneToMany, ManyToOne, ManyToMany) y encapsula el estado persistente.

### `CategoriaRoomService.java` - Capa de Dominio
* **Responsabilidad:** Define las categorías posibles para los ítems del Room Service.
* **Desglose de Métodos:** Al ser un `enum`, no tiene métodos complejos, expone los valores constantes: `DESAYUNO`, `ALMUERZO`, `CENA`, `SNACKS`, `BEBIDAS`.
* **Anotaciones:** Ninguna (Enum nativo de Java).
* **Puntos a destacar:** Facilita la tipificación fuerte y evita errores tipográficos en la base de datos a nivel de categoría de servicio.

### `Habitacion.java` - Capa de Dominio
* **Responsabilidad:** Representa la entidad base de una habitación en el hotel.
* **Desglose de Métodos:** Getters y setters autogenerados por Lombok. También define un enum interno `TipoHabitacion` (`NORMAL`, `DOBLE`, `SUITE`, `LUJO`).
* **Anotaciones de Spring/JPA:**
  * `@Entity` y `@Table(name = "habitacion")`: Mapean la clase a la tabla "habitacion".
  * `@Id`, `@GeneratedValue(strategy = GenerationType.SEQUENCE)`: Define la clave primaria autoincremental usando la secuencia `habitacion_seq`.
  * `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`: Lombok para boilerplate.
  * `@Column`: Configura columnas específicas (`unique=true`, `nullable=false`).
  * `@Enumerated(EnumType.STRING)`: Persiste el enum `TipoHabitacion` como cadena de texto.
* **Puntos a destacar:** Valida a nivel de esquema la unicidad del número de la habitación.

### `PedidoRoomService.java` - Capa de Dominio
* **Responsabilidad:** Modela la relación transaccional de un pedido de Room Service, enlazando una reserva con un ítem particular de la carta, indicando qué cantidad se pide.
* **Desglose de Métodos:** Getters y setters generados por Lombok. Inicializa `fechaPedido` al momento actual.
* **Anotaciones de Spring/JPA:**
  * `@Entity`, `@Table(name = "pedido_room_service")`
  * `@ManyToOne`, `@JoinColumn`: Mapea las relaciones Foreign Key con `Reserva` (reserva_id) y con `RoomServiceItem` (item_id). 
* **Puntos a destacar:** El diseño relacional normaliza los pedidos sin duplicar la información del producto.

### `Reserva.java` - Capa de Dominio
* **Responsabilidad:** Entidad principal transaccional del sistema. Vincula a un `Usuario` con una `Habitacion` durante un lapso de tiempo y agrupa los servicios adicionales de la reserva.
* **Desglose de Métodos:** Generados por Lombok.
* **Anotaciones de Spring/JPA:**
  * `@Entity`, `@Table(name = "reserva")`: Mapeo a tabla.
  * `@ManyToOne`: Relación con Usuario y Habitacion.
  * `@OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL)`: Relación bidireccional con `ReservaServicio`. La cascada propaga operaciones (guardar, actualizar, borrar) a los sub-servicios automáticamente.
* **Puntos a destacar:** El uso de `CascadeType.ALL` en `servicios` simplifica enormemente la gestión en el Controller al crear o modificar una reserva en un solo paso.

### `ReservaServicio.java` - Capa de Dominio
* **Responsabilidad:** Entidad asociativa (o tabla puente con atributos) que enlaza `Reserva` y `Servicio`, permitiendo almacenar la "cantidad" de servicios requeridos.
* **Desglose de Métodos:** Generados por Lombok.
* **Anotaciones de Spring/JPA:**
  * `@Entity`, `@Table`, `@ManyToOne`.
  * `@JsonIgnore`: Presente en la relación hacia `Reserva`. 
* **Puntos a destacar:** El `@JsonIgnore` es **CRÍTICO** para evitar serialización recursiva infinita (Circular Reference Error) cuando Jackson intenta convertir la Reserva a JSON.

### `Rol.java` - Capa de Dominio
* **Responsabilidad:** Modela los distintos roles del sistema para control de acceso (Spring Security).
* **Desglose de Métodos:** Generales de Lombok.
* **Anotaciones de Spring/JPA:**
  * `@Entity`, `@Table(name = "roles")`.
  * `@Column(unique = true, nullable = false)` sobre `name`.
* **Puntos a destacar:** El modelo soporta "ROLE_ADMIN" o "ROLE_CLIENTE" usados directamente por Spring Security (`GrantedAuthority`).

### `RoomServiceItem.java` - Capa de Dominio
* **Responsabilidad:** Modela los productos/ítems físicos que el cliente puede ordenar a través de la carta o Room Service.
* **Desglose de Métodos:** Generales de Lombok.
* **Anotaciones de Spring/JPA:**
  * `@Entity`, `@Table(name = "room_service_item")`.
  * `@Enumerated(EnumType.STRING)` para `CategoriaRoomService`.
* **Puntos a destacar:** Campo `disponible` flagueado a `true` por defecto permite retirar ítems de la carta lógicamente sin perder el historial.

### `Servicio.java` - Capa de Dominio
* **Responsabilidad:** Define servicios adicionales (p.ej.: Spa, Parking) que se asocian a la reserva general del hotel. Diferente al Room Service.
* **Anotaciones de Spring/JPA:**
  * Estructura estándar (`@Entity`, `@Table`).
* **Puntos a destacar:** Diferenciación arquitectónica semántica interesante: Separa el Catálogo General (Servicio) del catálogo in-room (RoomServiceItem).

### `Usuario.java` - Capa de Dominio
* **Responsabilidad:** Entidad de seguridad y de negocio que representa a los clientes o administradores del hotel.
* **Anotaciones de Spring/JPA:**
  * `@ManyToMany(fetch = FetchType.EAGER)`, `@JoinTable(...)`: Define la tabla intermedia `usuarios_roles`.
* **Puntos a destacar:** `FetchType.EAGER` es importante aquí. Implica que al cargar un Usuario desde DB se cargarán automáticamente sus Roles, algo esencial para evitar `LazyInitializationException` en el contexto de Spring Security.

---

## 2. Capa de Acceso a Datos (Repositories)

**Propósito general:**  
Implementa el patrón Repository, abstrayendo la persistencia y lectura de datos (Data Access Object / DAO). Extienden de `JpaRepository`, lo que permite que Spring Data genere consultas SQL en tiempo de ejecución de manera mágica.

### `HabitacionRepository.java` - Capa de Repositorio
* **Responsabilidad:** Gestionar persistencia de Habitaciones.
* **Métodos:** Customizados mediante convenciones y JPQL activo.
  * `findByTipo(TipoHabitacion)`
  * `existsByNumero(String)`
  * `findAvailableByTipo(...)` y `countAvailableByTipo(...)`
* **Anotaciones:** 
  * `@Query`: Utiliza sentencias JPQL complejas con `NOT IN` y sub-selects cruzando con la tabla Reservas.
  * `@Param`: Pasa parámetros nombrados hacia el JPQL.
* **Puntos a destacar:** Tiene la lógica CORE de cálculo de **disponibilidad**, comparando rangos solapantes de `fechaEntrada` y `fechaSalida`. 

### `PedidoRoomServiceRepository.java` - Capa de Repositorio
* **Responsabilidad:** Operaciones sobre `PedidoRoomService`.
* **Métodos:**
  * `findByReservaId(Long)`
  * `deleteByReservaId(Long)`
* **Puntos a destacar:** Se utilizan masivamente para realizar el Borrado en Cascada manual de los datos antes de borrar una Reserva.

### `ReservaRepository.java` - Capa de Repositorio
* **Responsabilidad:** Operaciones críticas sobre la tabla `Reserva`.
* **Métodos principales:**
  * `contarReservasSolapadas(...)` / `contarReservasSolapadasExcluyendo(...)`: Control de overbooking.
  * `contarHabitacionesOcupadasHoy(LocalDate)`: Utilidad de métricas.
  * `findByMes(int, int)`: Extracción por func. nativa `YEAR()` y `MONTH()` de SQL vía JPQL.
* **Puntos a destacar:** Usa un alto nivel de queries customizadas `@Query`. Contiene métodos clave para el *Dashboard* del administrador (Cálculos de ingresos y ocupación).

### `ReservaServicioRepository.java` - Capa de Repositorio
* **Responsabilidad:** Mantenimiento de la tabla asociativa Reserva-Servicio.
* **Métodos:** `deleteByReservaIdAndServicioId`, `existsBy...`, `deleteByReservaId`.
* **Puntos a destacar:** Facilita remover servicios individuales de la reserva sin tener que extraer toda la colección y mutar la entidad superior.

### `RoleRepository.java` - Capa de Repositorio
* **Responsabilidad:** Acceso a Roles.
* **Métodos:** `findByName(String)`.

### `RoomServiceItemRepository.java` - Capa de Repositorio
* **Responsabilidad:** Consultar ítems del menú.
* **Métodos:** `findByDisponibleTrue()` para mostrar solo los solicitables.

### `ServicioRepository.java` - Capa de Repositorio
* **Responsabilidad:** CRUD de servicios del hotel.
* **Métodos:** `existsByNombre(String)` para validación de unique lock.

### `UsuarioRepository.java` - Capa de Repositorio
* **Responsabilidad:** CRUD de cuentas de usuario.
* **Métodos:** `findByEmail(String)` que devuelve el `Optional<Usuario>` usado como pilar en la seguridad.

---

## 3. Capa de Transferencia (DTOs)

**Propósito general:**  
Los DTO (Data Transfer Objects) evitan acoplar la arquitectura de la Base de Datos a la superficie de los endpoints y APIs. Garantizan la seguridad (evitando sobre-exposición) e impiden comportamientos impredecibles a nivel serialización.

### `RegistroRequest.java` - Capa DTO
* **Responsabilidad:** DTO para abstraer el payload en la creación de una cuenta de usuario.
* **Campos:** `nombre`, `email`, `password`.
* **Puntos a destacar:** Diseño simple sin validaciones de Bean Validation (`@NotNull`, `@Email`), es puramente estructural para atrapar JSON bodies en Controladores.

*(Nota: En los archivos de los Controllers, por conveniencia, el arquitecto ha optado por embeber static class DTOs dentro del mismo controlador (p. ej., `ReservaDTO` o `PedidoDTO`). Aunque pragmático en el momento, el enfoque puro sugeriría que estuvieran en esta capa).*

---

## 4. Capa de Lógica de Negocio (Services)

**Propósito general:**  
Capa con las reglas empresariales (`@Service`). Centraliza lógica repetible, transaccionalidad, e implementaciones de componentes externos (Authentication en este caso). 

En el proyecto, toda la **lógica transaccional** está actualmente acoplada a los Controllers, limitando los Services al contexto puro de Spring Security. 

### `CustomUserDetailsService.java` - Capa de Servicio
* **Responsabilidad:** Adaptar la entidad `Usuario` del hotel al contrato `UserDetails` de **Spring Security** para login tradicional vía formulario o token.
* **Métodos:** `loadUserByUsername(String email)`. Busca en BD, mapea roles a Authorities.
* **Anotaciones:** 
  * `@Service`: Registra el bean en Spring.
  * `@Transactional(readOnly = true)`: Garantiza la lectura perezosa de roles/datos asociados si no fuesen EAGER, vital para la arquitectura de Spring Data sobre Hibernate.
* **Puntos a destacar:** Traduce de manera efectiva excepciones al `UsernameNotFoundException`.

### `OAuth2UserServiceCustom.java` - Capa de Servicio
* **Responsabilidad:** Interceptar el flujo de autenticación de clientes externos OAuth 2.0 (por ej. **Google Sign-In**) y registrar al usuario silenciosamente en la BD si es su primera vez (Just-in-Time Provisioning).
* **Métodos:** `loadUser(OAuth2UserRequest)`. Llama al método super, extrae email y nombre.
* **Puntos a destacar:** La lógica de autoprovisionamiento (`if usuarioOpt.isEmpty()`) asigna un id "secreto" *OAUTH2_USER* como contraseña al no requerirse para logeos por redes federadas, y le adjunta el rol `ROLE_CLIENTE` forzosamente consultado con la variable quemada `findById(2L)`.

---

## 5. Capa de Entrada (Controllers)

**Propósito general:**  
Son la presentación de red (Capa Rest o View). Atrapan peticiones HTTP, validan Auth, orquestan a través de repositorios/servicios, y devuelven HTTP codes/JSON correspondientes.

### `MainController.java` - Capa de Controlador
* **Responsabilidad:** Manejar rutas del Front-End genérico (archivos estáticos index) y orquestar registro y login. 
* **Anotaciones Clave:**
  * `@Controller`: Controla la inyección sobre render de MVC (retorna `"index"`).
  * `@PostMapping("/api/auth/register")` mas `@ResponseBody`: Retorna JSON.
* **Puntos a destacar:** Posee una mezcla de vistas SSR e inyecciones API. Inyecta el `PasswordEncoder` para hashear la pass antes de enviar a DB. En caso de registro exitoso, intenta de inmediato un Auto-Login a través de `request.login(email, password)`.

### `AdminController.java` - Capa de Controlador
* **Responsabilidad:** El corazón del Dashboard Administrativo. Extracción de Métricas Financieras y control de cuentas de Usuario.
* **Anotaciones Clave:**
  * `@RestController`, `@RequestMapping("/api/admin")`.
  * `@PreAuthorize("hasRole('ADMIN')")`: Barrera sólida de seguridad evaluada por MethodSecurity. 
* **Puntos a destacar:**
  * **Lógica Compleja de Métricas**: Dentro del GET de stats, se recorren las reservas, las fechas, el RoomService, los extras y se acumulan manualmente para devolver el cálculo en el JSON. 
  * **Borrado en cascada manual**: En `eliminarUsuario`, en lugar de descansar sobre JPA CascadeType, controla cuidadosamente el borrado descendente de `pedidoRoomService > reserva_servicio > reserva > roles` para eludir restricciones FK.

### `HabitacionController.java` - Capa de Controlador
* **Responsabilidad:** Gestionar el catálogo y la disponibilidad de camas/habitaciones del hotel.
* **Anotaciones Clave:**
  * Restricciones `@PreAuthorize` mixtas: lectura pública, modificación solo Admin.
* **Puntos a destacar:** El endpoint `/disponibles` delega el cálculo pesado al Repository (`countAvailableByTipo`), evitando recorrer Arrays in-memory. Además de permitir edición de una sola habitación, añade `.actualizarPorTipo` transaccional que actualiza masivamente los precios o descripción de un bloque entero de habitaciones.

### `ReservaController.java` - Capa de Controlador
* **Responsabilidad:** La clase más pesada (Fat Controller). Contiene las lógicas de checkout, pre-validación de calendarios, creación de facturas (Totalización) y control de vida de las Reservas.
* **Anotaciones Clave:**
  * Anotaciones DTO estáticas en el mismo archivo (`ReservaDTO`, `ReservaRequest`, etc).
  * Mutación HTTP extensa: GET, POST, PUT, DELETE.
* **Puntos a destacar:** 
  * Las Reservas se nutren con un super *DTO* dinámico. Cada vez que se lee una reserva, el bucle `map()` recalcula en caliente la "facturación" (Coste días + Coste Servicios + Coste RoomService).
  * **Validación Crítica**: Usa `contarReservasSolapadasExcluyendo` al actualizar para validar que cambiar una fecha no ponga la habitación en "overbooking".
  * **Seguridad Embebida**: Revisa quién pide la reserva leyendo Principal. Si eres cliente, te restringe solo a ver y cancelar *TUS* propias reservas; el Admin puede hacerlo todo.

### `RoomServiceController.java` - Capa de Controlador
* **Responsabilidad:** Maneja dos conceptos agrupados: La mantención de "CARTA" (CRUD items) por el Admin, y la ejecución de "PEDIDOS" sobre reservas en curso.
* **Puntos a destacar:**
  * Patrón `puedeAccederReserva`: Centralizado de protección lateral (Lateral Access Control). Bloquea mediante el email registrado a que un Hacker (Huesped en sala A) pueda pedir comida enviándola a la factura del Huesped de sala B. 
  * El cálculo del monto subtotal (`subtotal`) se hace al vuelo en la presentación, multiplicando el precio del momento por la cantidad insertada.

### `ServicioController.java` - Capa de Controlador
* **Responsabilidad:** Encargado básico de los CRUDS para servicios de hotel (`Spa`, `Wifi Premium`, `Gym`).
* **Puntos a destacar:** Lógica estándar de ABM clásico. 

---

### Observación Arquitectónica del Arquitecto

El sistema está claramente dividido en capas formales, es **altamente funcional y robusto** en sus restricciones de seguridad. Las dependencias cruzadas (cascade loops y serializaciones infinitas) en el modelo fueron previstas resolviéndolas con `@JsonIgnore` o DTOs hechos a media. 

* **Oportunidad de Evolución:** Como arquitecto senior te sugiero que la pesada lógica iterativa de sumatorias presente en `AdminController.java` y `ReservaController.java` (facturación, validación de overbooking e inicialización DTO) sea migrada a nuevas clases bajo la capa de Servicios Puros (e.g. `FacturacionService` / `ReservaService`). Esto descargará los Controladores, haciendo que sean 100% testeables a nivel unitario, sin levantar Contextos Web.
