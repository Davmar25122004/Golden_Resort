## Context

La aplicación es una SPA (Single Page Application) basada en Thymeleaf + vanilla JS con un patrón de navegación ya establecido:
- `showLanding()` → muestra las secciones principales (hero, habitaciones, servicios, contacto)
- `showDynamic(html)` → oculta la landing e inyecta HTML en `#dynamic-view`

Este patrón ya se usa para el formulario de reserva, "Mis Reservas" y el panel Admin. Las habitaciones tienen un lightbox con carrusel Swiper. El objetivo es replicar y extender este patrón para los servicios.

La BD tiene 6 servicios con solo `id`, `nombre`, `precio`. Toda la información enriquecida (imágenes, descripción, características) no existe en la BD y no conviene añadirla ahí — es contenido editorial estático que no necesita persistencia.

## Goals / Non-Goals

**Goals:**
- Navegar a una página de detalle al hacer click en cualquier servicio de la grid
- Mostrar carrusel de imágenes de alta calidad (Swiper, misma librería ya usada)
- Mostrar descripción narrativa, lista de características, info rápida (horario, etc.) y precio
- Permitir volver a la landing con un botón "← Volver"
- Mantener coherencia visual con el tema gold/dark del hotel

**Non-Goals:**
- No se cambia el backend ni la BD
- No se añaden imágenes locales (se usan URLs de Unsplash ya usadas en el proyecto para DOBLE)
- No se implementa reserva directa desde la página de detalle del servicio (se puede añadir en futuro)
- No se crea una ruta de servidor propia para cada servicio (sigue siendo SPA)

## Decisions

### D1: Datos enriquecidos en frontend como constante `SERVICIO_DATA`

**Decisión**: Definir `SERVICIO_DATA` como objeto JS estático en `app.js`, indexado por el `id` del servicio de la BD.

**Alternativas consideradas**:
- *Añadir columnas a la tabla `servicio` en Supabase*: Requiere migración de BD, cambios en la entidad JPA, el DTO y el controller. Sobredimensionado para contenido editorial que no cambia.
- *Fichero JSON separado con fetch*: Añade una request de red extra sin beneficio — el contenido es estático y no cambia en runtime.

**Rationale**: El patrón ya existe en el proyecto (`TIPO_IMAGES` para habitaciones). Mínimo cambio, cero riesgo de regresión en backend.

### D2: Usar `showDynamic(html)` en lugar de una ruta nueva

**Decisión**: La página de detalle se renderiza inyectando HTML en `#dynamic-view` igual que el formulario de reserva y "Mis Reservas".

**Alternativas consideradas**:
- *Rutas Thymeleaf separadas (e.g. `/servicios/1`)*: Requeriría cambios en Spring MVC, SecurityConfig, y romper el modelo SPA actual. No aporta valor para este caso.

**Rationale**: Consistencia con el patrón existente. Cero cambios en backend.

### D3: Swiper para el carrusel de imágenes

**Decisión**: Reutilizar Swiper (ya incluido en `/lib/swiper-12.1.3/`) con la misma configuración que el detalle de habitaciones (`detailSwiper`).

**Rationale**: Librería ya cargada, ya estilizada, ya conocida en el proyecto. El CSS de `.detail-swiper-slide` ya existe en `style.css`.

### D4: Imágenes vía Unsplash URLs

**Decisión**: URLs de Unsplash con parámetros `?w=1200&q=85` para calidad alta.

**Rationale**: Ya se usa para DOBLE rooms. No requiere assets locales. Calidad controlada con parámetros de URL.

## Risks / Trade-offs

- **[Dependencia de IDs de BD]** Si se reinsertan los servicios en Supabase con IDs distintos, `SERVICIO_DATA` quedaría desincronizado. → Mitigación: índice también por `nombre` como fallback, o documentar que los IDs son estables.
- **[Unsplash rate limits]** Las URLs de Unsplash en producción sin API key pueden tener limitaciones. → Mitigación: aceptable para un TFG/demo; para producción real habría que hospedar imágenes propias.
- **[Swiper instance leak]** Si `detailSwiper` ya está inicializado y se abre otro detalle sin destruirlo, puede haber duplicación. → Mitigación: llamar `detailSwiper.destroy()` antes de inicializar uno nuevo (patrón ya usado en `selectRoom`).

## Migration Plan

1. Añadir `SERVICIO_DATA` al inicio de `app.js` (junto a `TIPO_IMAGES`)
2. Modificar `loadServicios()` para añadir `onclick` a cada tarjeta
3. Añadir función `openServicioDetail(id)` que llama `showDynamic(html)`
4. Añadir estilos CSS para la página de detalle en `style.css`
5. Sin cambios en backend, BD ni HTML base — rollback trivial (revertir los dos ficheros JS/CSS)

## Open Questions

- ¿Se quiere el botón "Añadir a mi reserva" funcional en esta iteración, o solo decorativo/pendiente?
- ¿Las imágenes de los servicios deben ser locales (añadir assets a `/images/`) o Unsplash es suficiente?
