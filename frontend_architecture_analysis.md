# Análisis Arquitectónico del Frontend (Cliente)
Proyecto: **Hotel DAW**
Arquitectura: **Single Page Application (SPA) Híbrida / Vanilla JS Modular**

---

## 1. Visión General de la Arquitectura
A diferencia del Backend que está regido estrictamente por el framework Spring Boot, el Frontend se ha desarrollado utilizando un modelo **Vanilla JavaScript (JS Puro) apoyado en tecnologías web estándar (HTML5 y CSS3)**. 

Se ha empleado una arquitectura altamente modular (*Separation of Concerns*). En lugar de tener un único archivo gigante (Monolito), el código se ha fragmentado por dominio lógico y componentes. Esto incrementa enormemente su mantenibilidad, legibilidad y rapidez de ejecución, evitando la dependencia excesiva de librerías front-end pesadas como React o Angular y priorizando el rendimiento bruto o "Vanilla".

---

## 2. Estructura de Módulos JavaScript (Directorio `/js`)
Los archivos JavaScript están enumerados de forma secuencial (`01` a `13`) para garantizar su correcta carga asíncrona y cascada en el HTML.

### Núcleo y Configuración Global (Core)
*   **`01-globals.js`**: El "cerebro de datos estáticos". Define variables globales esenciales, el estado de la aplicación (`state`), y todas las bases de datos locales (textos de servicios, rutas de imágenes).
*   **`02-flatpickr-config.js`**: Aisla por completo la configuración del plugin de calendarios, centralizando reglas, idiomas y comportamiento ante bloqueos temporales.
*   **`03-navegacion.js`**: El *Router* o Enrutador (como un Controller). Gestor del sistema `history.pushState`. Finge que el usuario navega entre diferentes URLs reales (`/habitacion/doble`, `/mis-reservas`) pero intercepta las cargas refrescando la página dinámicamente.
*   **`04-ui-core.js`**: Engloba funciones de renderizado general, mostrar/ocultar secciones ("Vistas") y gestión transiciones y redibujado base de la interfaz y del sistema de búsqueda principal del Hero (Portada).

### Módulos de Modelos (Entidades Front)
*   **`05-habitaciones.js`**: Lógica de presentación y filtrado del panel principal de tarjetas de habitaciones, cálculo de disponibilidad conectándose al backend mediante APIs y control del Scroll horizontal interactivo (`Swiper`).
*   **`06-servicios-detalles.js`**: Peticiones al backend para listar de forma asíncrona la matriz de servicios. Responsable del "Efecto dominó / cascada" al cargar cada componente mediante la integración con *AOS.js*.
*   **`12-servicio-detail.js`**: El encargado del despliegue en detalle de un servicio individual (Ej. Spa). Agrupa el precio, variables y genera el carrusel de fotografías detallado específico.
*   **`11-lightbox.js`**: Componente asilado que intercepta clicks sobre miniaturas de las habitaciones para expandir un visor modal a pantalla completa sin abandonar el contexto de la página principal.

### Flujos de Negocio Complejos (Workflows)
*   **`07-reserva-proceso.js`**: El módulo de negocio más complejo. Responsable del **Checkout**. Controla la selección de fechas, integrando peticiones (POST) combinadas con servicios extra, Room Service y finalmente generando el impacto visual de éxito tras procesarse la facturación calculada.
*   **`10-auth.js`**: Controlador de Identidad. Maneja el estado de la sesión, los formularios del modal de inicio de sesión, el registro de JWT (si aplicase), las llamadas al Endpoint de Google OAuth2 y el "Logout".
*   **`08-mis-reservas.js`**: Actúa en el perfil del cliente logueado. Descarga historial personal iterándolo y dibujando un recibo o ticket para cada reserva con calculadoras que desglosan habitación vs. Room Service vs. Servicios.
*   **`09-admin.js`**: El CPanel (Panel de Control). Una "aplicación dentro de otra aplicación". Descarga métricas en tiempo real, permite la gestión, rastreo o borrado en cascada (DELETE) de otros usuarios a espaldas del cliente final, estando fuertemente hiper-restringido a usuarios con `ROLE_ADMIN` tanto aquí por protección del DOM, como en Back-End.

### Inicialización Principal
*   **`13-init.js`**: Función `main` del Javascript. Archivo de arranque final y más pequeño, que sencillamente se asegura de que toda la orquesta y librerías inicialicen de forma ordenada en el momento exacto en que termina de cargar el cuerpo del HTML.

---

## 3. Arquitectura de Estilos en Cascada Modular (Directorio `/css`)
El Diseño o *Design System* del Hotel DAW está basado en el patrón **BEM (Block Element Modifier)** simplificado mezclado con variables nativas de CSS3 (*Custom Properties*) inyectadas a nivel global, para asegurar un diseño cohesivo y fácilmente reemplazable de "Day/Night" o de "Gold/Red" si el Hotel hiciera un re-branding corporativo comercial. 

### Core y Distribución Maestra
*   **`base.css`**: Define la Fundación. Reinicia estilos del navegador y declara la paleta de variables absolutas maestro (Golden, Cream, Darks) y las tipografías Serif/Sans-serif elegidas.
*   **`layout.css`**: Modifica la disposición general de rejilla (Navbars fijos, footers, z-indexes maestros y estructuración top-down del DOM).

### Estilos de Componentes (Cards y Formatos)
*   **`hero.css`**: Todo lo relativo al encabezado monumental a pantalla completa, la barra de búsqueda y sus animaciones de fondo superpuesto (Fade images).
*   **`habitaciones.css`** y **`habitacion-detail.css`**: Estilizan las rejillas, medallas de disponibilidad, miniaturas y los menús desplegables modales completos de cada suite.
*   **`servicios.css`** y **`servicio-detail.css`**: Controlan la cuadriculación flotante de cada servicio en la página principal, su Hover dorado al ratón, así como su ficha interna técnica y el botón exportado que permite descargar su PDF comercial.
*   **`contacto.css`**: Diseña el mapa incrustado de iframe de Google y la botonera asimétrica de iconos de Redes Sociales vectorial (*SVG*).

### Estilos de Negocio e Interfaz Secundaria
*   **`auth.css`**: El encapsulamiento de los formularios de registro y login, sus sombreados (drop-shadow) oscuros y el botón corporativo social de OAuth de Google.
*   **`mis-reservas.css`**: Da formato a los extractos y facturas pasadas del cliente de forma vertical. Subrayados numéricos de gastos e interfaz de ticket comercial.
*   **`reserva-form.css`**: Responsable de agrupar y espaciar los campos críticos durante el check-out de una habitación antes de efectuar el pago final.
*   **`admin-panel.css`**: Una hoja enteramente diseñada para crear cuadros estadísticos densos (*KPIs* de ingresos) y tablas complejas de lectura para los empleados (listados administrativos).

### Override / Hackeo de Plugins de Terceros
*   **`flatpickr.css`**: Extensión brutalista de la clase visual que sobreescribe las reglas estándar que descarga la librería externa Flatpickr, sustituyéndolas por la paleta oscura oficial del hotel.

---

## 4. Filosofía del Patrón de Diseño Implementado
Al haber extraído el formato y la lógica desde el viejo monolito (un único `style.css` incontrolable sumado a hojas HTML redundantes) hacia un entorno atómico y categorizado, el sistema de front-end se comporta en perfecta y estricta sintonía con principios de ingeniería de software maduros (SOLID):

1. **Responsabilidad Única (SRP):** El código CSS y JS de Admin reside en las carpetas y archivos con nombres equivalentes. Alterar o romper algo del "Room Service" en CSS, garantiza con efectividad estadística la imposibilidad matemática de destrozar los "Estilos de Login de Acceso".
2. **Escalabilidad (Scalability):** Para añadir un nuevo panel por ejemplo "Restauración Web VIP", solo hace falta adjuntar un script `.js` al final de la cola del Index, manteniendo la carga y peso general intactos al primer usuario.
3. **Petición por Asincronía (AJAX/FetchApi):** Reduce la carga del Servidor Java. Se inyectan de forma selectiva parches modulares del DOM usando promesas (`async/await`) en vez de requerir re-calcular cada vista iterativa, aumentando el rendimiento exponencialmente frente a las Webs Tradicionales de Renderizado en Servidor.
