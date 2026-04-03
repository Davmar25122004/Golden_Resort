# Spec: service-detail-page

## Purpose

Vista de detalle de servicios enriquecida con imágenes, descripciones detalladas y características. Permite a los usuarios interactuar con el catálogo de servicios de forma más visual e informativa antes de realizar una reserva o uso del servicio.

## Requirements

### Requirement: Service card is clickable and navigates to detail page
Each service card in the "Servicios" section of the landing SHALL be clickable. Clicking a service card SHALL navigate the user to a full-screen detail view for that specific service, replacing the landing page content.

#### Scenario: User clicks a service card
- **WHEN** the user clicks on any service card in the servicios grid
- **THEN** the landing page sections (hero, habitaciones, servicios, contacto, footer) are hidden
- **THEN** the service detail page is rendered inside `#dynamic-view`
- **THEN** the page scrolls to the top

#### Scenario: Service card visual affordance
- **WHEN** the service cards are rendered
- **THEN** each card SHALL display a cursor pointer and a hover effect indicating it is interactive

### Requirement: Service detail page shows an image carousel
The service detail page SHALL display a Swiper carousel at the top with high-quality images specific to the service type.

#### Scenario: Carousel renders with multiple images
- **WHEN** the service detail page opens for a service with defined images in SERVICIO_DATA
- **THEN** a Swiper carousel is initialized with at least 3 images
- **THEN** navigation arrows and pagination dots are displayed
- **THEN** images fill the full width of the content area at a minimum height of 420px

#### Scenario: Carousel fallback for unknown service
- **WHEN** the service detail page opens for a service whose id is not in SERVICIO_DATA
- **THEN** a placeholder image or a single generic hotel image is displayed

### Requirement: Service detail page shows description and characteristics
The service detail page SHALL display enriched content below the carousel including a narrative description, a list of key characteristics, and quick-info cards.

#### Scenario: Description section is rendered
- **WHEN** the service detail page is open
- **THEN** a narrative description paragraph is shown below the carousel
- **THEN** the service name and price (formatted as "€XX.XX / unidad") are prominently displayed

#### Scenario: Characteristics list is rendered
- **WHEN** the service detail page is open and SERVICIO_DATA contains a `caracteristicas` array for the service
- **THEN** each characteristic is displayed as a bullet with a ✦ icon
- **THEN** at least 4 characteristics are shown per service

#### Scenario: Quick-info cards are rendered
- **WHEN** the service detail page is open and SERVICIO_DATA contains `horario` and `capacidad` fields
- **THEN** two info cards are shown: one for schedule (horario) and one for capacity/conditions
- **THEN** the cards use the existing gold/dark visual theme

### Requirement: Service detail page has a back navigation
The service detail page SHALL provide a way to return to the landing page.

#### Scenario: User clicks the back button
- **WHEN** the user clicks the "← Volver" button on the service detail page
- **THEN** `showLanding()` is called
- **THEN** the page scrolls to the `#servicios` section

### Requirement: SERVICIO_DATA constant defines enriched content for all 6 services
A static JS object `SERVICIO_DATA` SHALL be defined in `app.js`, indexed by service `id` (integers 1-6 corresponding to DB values), containing images, description, characteristics, horario, and capacidad for each service.

#### Scenario: All 6 services have enriched data defined
- **WHEN** the application initializes
- **THEN** `SERVICIO_DATA` contains entries for ids 1 (Spa & Bienestar), 2 (Desayuno Premium), 3 (Servicio de Coche), 4 (Cena Gourmet), 5 (Gimnasio 24h), 6 (Room Service)
- **THEN** each entry has: `icon`, `descripcion` (string), `caracteristicas` (array, min 4 items), `horario` (string), `capacidad` (string), `images` (array, min 3 URLs)
