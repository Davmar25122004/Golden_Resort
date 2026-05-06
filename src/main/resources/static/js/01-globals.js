// Golden Resort | app.js

// ── CSRF — interceptor global de fetch ───────────────────────────────────────
// Spring pone el token en la cookie XSRF-TOKEN (no HttpOnly).
// Lo leemos aquí y lo añadimos como cabecera en todas las peticiones
// que cambian estado (POST, PUT, PATCH, DELETE), sin tocar ningún otro archivo.
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

// ── Horario fijo del hotel (cargado al inicio desde /api/hotel/info) ─────────
window.HOTEL_INFO = { checkinTime: '15:00', checkoutTime: '11:00' };
(function loadHotelInfo() {
    fetch('/api/hotel/info')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j) window.HOTEL_INFO = j; })
        .catch(function () { /* fallback a defaults */ });
})();

// Helpers para mostrar fecha + hora de check-in / check-out
window.fmtFechaCheckin = function (ymd) {
    if (!ymd) return '—';
    return ymd + ' · ' + (window.HOTEL_INFO.checkinTime || '15:00') + ' h';
};
window.fmtFechaCheckout = function (ymd) {
    if (!ymd) return '—';
    return ymd + ' · ' + (window.HOTEL_INFO.checkoutTime || '11:00') + ' h';
};

var TIPO_IMAGES = {
    NORMAL: [
        '/images/normal-1.jpg',
        '/images/normal-2.jpg',
        '/images/normal-3.jpg',
    ],
    DOBLE: [
        '/images/doble-1.jpg',
        '/images/doble-2.jpg',
        '/images/doble-3.jpg',
    ],
    SUITE: [
        '/images/suite-1.jpg',
        '/images/suite-2.jpg',
        '/images/suite-3.jpg',
    ],
    LUJO: [
        '/images/Lujo_1.jpg',
        '/images/Lujo-2.jpg',
        '/images/Lujo-3.jpg',
    ],
};

// Nombres de items de Room Service en inglés (por ID)
var RS_ITEMS_EN = {
    1:  'Tomato Toast with Olive Oil',
    2:  'Fresh Orange Juice',
    3:  'Porridge with Fruits',
    4:  'Caesar Salad',
    5:  'Club Sandwich',
    6:  'Soup of the Day',
    7:  'Gourmet Burger',
    8:  'Grilled Salmon',
    9:  'Pesto Pasta',
    10: 'Cheese Board',
    11: 'Nachos with Guacamole',
    12: 'Seasonal Fruit',
    13: 'Mineral Water (1L)',
    14: 'Red Wine (glass)',
    15: 'Soft Drink',
    16: 'Craft Beer',
};

// Nombres de servicios en inglés (por ID, ya que el nombre viene de la BD)
var SERVICIO_NOMBRES_EN = {
    1: 'Spa & Wellness',
    2: 'Premium Breakfast',
    3: 'Private Car Service',
    4: 'Gourmet Dinner',
    5: '24h Gym',
    6: 'Room Service',
};

var SERVICIO_DATA = {
    1: {
        descripcion: 'Un refugio de paz y armonía en el corazón del hotel. Nuestro Spa & Bienestar te invita a desconectar del mundo y entregarte al arte del cuidado personal. Con tratamientos diseñados por expertos y ambientes de serenidad absoluta, cada visita es una experiencia transformadora.',
        descripcion_en: 'A refuge of peace and harmony in the heart of the hotel. Our Spa & Wellness invites you to disconnect from the world and surrender to the art of self-care. With treatments designed by experts in an atmosphere of absolute serenity, every visit is a transformative experience.',
        caracteristicas: [
            'Masajes relajantes y terapéuticos personalizados',
            'Jacuzzi privado climatizado',
            'Sauna finlandesa y baño de vapor',
            'Tratamientos faciales con productos de lujo',
            'Aromaterapia y cromoterapia',
            'Zona de relajación con infusiones de autor',
        ],
        caracteristicas_en: [
            'Personalised relaxing and therapeutic massages',
            'Private heated jacuzzi',
            'Finnish sauna and steam bath',
            'Facial treatments with luxury products',
            'Aromatherapy and chromotherapy',
            'Relaxation area with signature herbal teas',
        ],
        horario: '09:00 – 21:00',
        capacidad: 'Hasta 2 personas · Reserva previa',
        capacidad_en: 'Up to 2 people · Prior reservation',
        images: [
            '/images/spa-1.jpg',
            '/images/spa-2.jpg',
            '/images/spa-3.jpg',
            '/images/spa-4.jpg',
        ],
    },
    2: {
        descripcion: 'Empieza el día con el mejor desayuno de tu vida. Nuestro Desayuno Premium es un festín de sabores locales e internacionales preparados cada mañana con los ingredientes más frescos. Desde bollería artesanal hasta zumos recién exprimidos, cada detalle está pensado para deleitarte.',
        descripcion_en: 'Start your day with the best breakfast of your life. Our Premium Breakfast is a feast of local and international flavours prepared every morning with the freshest ingredients. From artisan pastries to freshly squeezed juices, every detail is crafted to delight you.',
        caracteristicas: [
            'Buffet gourmet con productos locales de temporada',
            'Bollería artesanal horneada cada mañana',
            'Zumos naturales y batidos de frutas frescas',
            'Estación de huevos cocinados al momento',
            'Selección de quesos y embutidos ibéricos',
            'Servido en el restaurante con vistas al jardín',
        ],
        caracteristicas_en: [
            'Gourmet buffet with local seasonal produce',
            'Artisan pastries baked every morning',
            'Natural juices and fresh fruit smoothies',
            'Made-to-order egg station',
            'Selection of cheeses and Iberian cold cuts',
            'Served in the restaurant with garden views',
        ],
        horario: '07:00 – 11:00',
        capacidad: 'Por persona · Incluye bebidas calientes',
        capacidad_en: 'Per person · Includes hot drinks',
        images: [
            '/images/desayuno-1.jpg',
            '/images/desayuno-2.jpg',
            '/images/desayuno-3.jpg',
        ],
    },
    3: {
        descripcion: 'Llega y parte con la elegancia que mereces. Nuestro Servicio de Coche privado pone a tu disposición un conductor profesional y un vehículo de alta gama para que cada trayecto sea tan memorable como tu estancia. Traslados al aeropuerto, excursiones o simplemente moverse por la ciudad con estilo.',
        descripcion_en: 'Arrive and depart with the elegance you deserve. Our Private Car Service places a professional driver and a high-end vehicle at your disposal so that every journey is as memorable as your stay. Airport transfers, excursions or simply moving around the city in style.',
        caracteristicas: [
            'Vehículo de lujo (Mercedes Clase E o superior)',
            'Conductor profesional y discreto',
            'Traslados al aeropuerto y estación de tren',
            'Excursiones y visitas turísticas privadas',
            'Disponible las 24 horas con reserva previa',
            'Amenities de bienvenida a bordo',
        ],
        caracteristicas_en: [
            'Luxury vehicle (Mercedes E-Class or higher)',
            'Professional and discreet driver',
            'Airport and train station transfers',
            'Private excursions and sightseeing tours',
            'Available 24 hours with prior reservation',
            'Welcome amenities on board',
        ],
        horario: '24 horas',
        horario_en: '24 hours',
        capacidad: 'Hasta 4 pasajeros · Reserva 2h antes',
        capacidad_en: 'Up to 4 passengers · Book 2h in advance',
        images: [
            '/images/coche-1.jpg',
            '/images/coche-2.jpg',
            '/images/coche-3.jpg',
            '/images/coche-4.jpg',
        ],
    },
    4: {
        descripcion: 'Una experiencia gastronómica que trasciende la mesa. Nuestra Cena Gourmet es una travesía sensorial diseñada por nuestro chef con inspiración en la alta cocina mediterránea. Cada plato cuenta una historia, cada maridaje es una revelación. Para quienes entienden que cenar es mucho más que comer.',
        descripcion_en: 'A gastronomic experience that transcends the table. Our Gourmet Dinner is a sensory journey designed by our chef with inspiration from haute Mediterranean cuisine. Each dish tells a story, each pairing is a revelation. For those who understand that dining is so much more than eating.',
        caracteristicas: [
            'Menú degustación de 7 platos elaborados al momento',
            'Maridaje de vinos seleccionados por el sumiller',
            'Chef con formación en restaurantes con estrellas Michelin',
            'Ingredientes de proximidad y de temporada',
            'Mesa con vistas panorámicas al jardín o la ciudad',
            'Opción vegetariana y adaptación a alergias',
        ],
        caracteristicas_en: [
            '7-course tasting menu prepared to order',
            'Wine pairing selected by the sommelier',
            'Chef trained at Michelin-starred restaurants',
            'Locally sourced and seasonal ingredients',
            'Table with panoramic views of the garden or city',
            'Vegetarian option and allergy adaptation',
        ],
        horario: '19:30 – 23:00',
        capacidad: 'Máx. 12 comensales · Reserva obligatoria',
        capacidad_en: 'Max. 12 diners · Reservation required',
        images: [
            '/images/restaurante-1.jpg',
            '/images/restaurante-2.jpg',
            '/images/restaurante-3.jpg',
            '/images/restaurante-4.jpg',
        ],
    },
    5: {
        descripcion: 'Mantén tu rutina sin sacrificar el lujo. Nuestro Gimnasio 24h cuenta con la maquinaria más avanzada del mercado en un espacio diseñado para inspirar el movimiento. Desde el cardio matutino hasta el entrenamiento de fuerza nocturno, el gimnasio está siempre listo para ti.',
        descripcion_en: 'Maintain your routine without sacrificing luxury. Our 24h Gym features the most advanced equipment on the market in a space designed to inspire movement. From morning cardio to late-night strength training, the gym is always ready for you.',
        caracteristicas: [
            'Equipamiento Technogym de última generación',
            'Zona de pesas libres y máquinas de musculación',
            'Cardio: cintas, elípticas, bicicletas y remos',
            'Clases dirigidas de yoga, pilates y HIIT',
            'Entrenador personal disponible bajo reserva',
            'Vestuarios con sauna seca incluida',
        ],
        caracteristicas_en: [
            'State-of-the-art Technogym equipment',
            'Free weights area and resistance machines',
            'Cardio: treadmills, ellipticals, bikes and rowers',
            'Guided yoga, pilates and HIIT classes',
            'Personal trainer available on request',
            'Locker rooms with dry sauna included',
        ],
        horario: '24 horas',
        horario_en: '24 hours',
        capacidad: 'Acceso libre · Clases con reserva previa',
        capacidad_en: 'Free access · Classes with prior reservation',
        images: [
            '/images/gym-1.jpg',
            '/images/gym-2.jpg',
            '/images/gym-3.jpg',
            '/images/gym-4.jpg',
        ],
    },
    6: {
        descripcion: 'El lujo de tenerlo todo sin salir de tu habitación. Nuestro Room Service opera las 24 horas con una carta completa que incluye desde desayunos ligeros hasta cenas elaboradas. Todo presentado con la misma excelencia que esperas de Golden Resort, entregado en tu puerta en menos de 30 minutos.',
        descripcion_en: 'The luxury of having everything without leaving your room. Our Room Service operates 24 hours a day with a full menu ranging from light breakfasts to elaborate dinners. Presented with the same excellence you expect from Golden Resort, delivered to your door in under 30 minutes.',
        caracteristicas: [
            'Disponible las 24 horas, todos los días del año',
            'Carta completa: desayuno, almuerzo, cena y snacks',
            'Entrega garantizada en menos de 30 minutos',
            'Presentación en vajilla de porcelana con cubiertos de plata',
            'Carta de vinos y cócteles disponible',
            'Opción de mesa en habitación montada por el equipo',
        ],
        caracteristicas_en: [
            'Available 24 hours, every day of the year',
            'Full menu: breakfast, lunch, dinner and snacks',
            'Guaranteed delivery in under 30 minutes',
            'Presented on porcelain tableware with silver cutlery',
            'Wine and cocktail list available',
            'In-room table set-up option by our team',
        ],
        horario: '24 horas',
        horario_en: '24 hours',
        capacidad: 'Para huéspedes del hotel',
        capacidad_en: 'For hotel guests',
        images: [
            '/images/roomservice-1.jpg',
            '/images/roomservice-2.jpg',
        ],
    },
};

// ── DESCRIPCIONES DE HABITACIONES (hardcoded para i18n) ───────────────────────
var TIPO_DESCRIPTIONS_EN = {
    NORMAL: 'Elegantly appointed standard room combining refined comfort with modern style. Features a plush king-size bed, marble en-suite bathroom, flat-screen TV and sweeping garden or pool views. The perfect retreat for the discerning traveller who appreciates refined simplicity.',
    DOBLE:  'Spacious double room designed for couples and companions seeking extra room to unwind. Two luxurious double beds, a separate seating area, generous wardrobe and a private terrace invite you to settle in and stay a while.',
    SUITE:  'An elevated sanctuary of elegance and space. Our Suite offers a separate living room, premium king-size bed, walk-in dressing room and a spa-inspired bathroom with a freestanding bathtub. Experience hotel living at its finest.',
    LUJO:   'The pinnacle of luxury hospitality. Our Luxury Suite is a private residence within the hotel, featuring panoramic sea views, a private plunge pool, bespoke hand-crafted furnishings and dedicated around-the-clock butler service. An experience beyond compare.',
};

function slugify(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

var _suppressHistoryPush = false;

var state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    pendingRoom: null,
    pendingDates: null,
    searchDates: null,
};

let roomSwiper   = null;
let detailSwiper = null;
let authModal    = null;

