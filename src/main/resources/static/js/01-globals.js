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

var TIPO_CAPACIDAD = {
    NORMAL:  '1 persona',
    DOBLE:   '2 personas',
    SUITE:   '2–4 personas',
    LUJO:    '2–5 personas'
};

var TIPO_CAMAS = {
    NORMAL:  '1 cama individual',
    DOBLE:   '1 cama doble',
    SUITE:   '2 camas dobles',
    LUJO:    '2 camas dobles'
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

var SERVICIO_DATA = {
    1: {
        descripcion: 'Un refugio de paz y armonía en el corazón del hotel. Nuestro Spa & Bienestar te invita a desconectar del mundo y entregarte al arte del cuidado personal. Con tratamientos diseñados por expertos y ambientes de serenidad absoluta, cada visita es una experiencia transformadora.',
        caracteristicas: [
            'Masajes relajantes y terapéuticos personalizados',
            'Jacuzzi privado climatizado',
            'Sauna finlandesa y baño de vapor',
            'Tratamientos faciales con productos de lujo',
            'Aromaterapia y cromoterapia',
            'Zona de relajación con infusiones de autor',
        ],
        horario: '09:00 – 21:00',
        capacidad: 'Hasta 2 personas · Define hora durante reserva',
        images: [
            '/images/spa-1.jpg',
            '/images/spa-2.jpg',
            '/images/spa-3.jpg',
            '/images/spa-4.jpg',
        ],
    },
    2: {
        descripcion: 'Empieza el día con el mejor desayuno de tu vida. Nuestro Desayuno Premium es un festín de sabores locales e internacionales preparados cada mañana con los ingredientes más frescos. Desde bollería artesanal hasta zumos recién exprimidos, cada detalle está pensado para deleitarte.',
        caracteristicas: [
            'Buffet gourmet con productos locales de temporada',
            'Bollería artesanal horneada cada mañana',
            'Zumos naturales y batidos de frutas frescas',
            'Estación de huevos cocinados al momento',
            'Selección de quesos y embutidos ibéricos',
            'Servido en el restaurante con vistas al jardín',
        ],
        horario: '07:00 – 11:00',
        capacidad: 'Por reserva · Define hora durante reserva',
        images: [
            '/images/desayuno-1.jpg',
            '/images/desayuno-2.jpg',
            '/images/desayuno-3.jpg',
        ],
    },
    3: {
        descripcion: 'Llega y parte con la elegancia que mereces. Nuestro Servicio de Coche privado pone a tu disposición un conductor profesional y un vehículo de alta gama para que cada trayecto sea tan memorable como tu estancia. Traslados al aeropuerto o estaciones de Renfe de Joaquín Sorolla o Cullera.',
        caracteristicas: [
            'Vehículo de lujo (Mercedes Clase E o superior)',
            'Conductor profesional y discreto',
            'Traslados al aeropuerto y estaciones de Renfe (Joaquín Sorolla / Cullera)',
            'Disponible las 24 horas con reserva previa',
            'Amenities de bienvenida a bordo',
        ],
        horario: '24 horas',
        capacidad: 'Hasta 4 pasajeros · Define hora y ubicación en la reserva',
        images: [
            '/images/coche-1.jpg',
            '/images/coche-2.jpg',
            '/images/coche-3.jpg',
        ],
    },
    4: {
        descripcion: 'Una experiencia gastronómica que trasciende la mesa. Nuestra Cena Gourmet es una travesía sensorial diseñada por nuestro chef con inspiración en la alta cocina mediterránea. Cada plato cuenta una historia, cada maridaje es una revelación. Para quienes entienden que cenar es mucho más que comer.',
        caracteristicas: [
            'Menú degustación de 7 platos elaborados al momento',
            'Maridaje de vinos seleccionados por el sumiller',
            'Chef con formación en restaurantes con estrellas Michelin',
            'Ingredientes de proximidad y de temporada',
            'Mesa con vistas panorámicas al jardín o la ciudad',
            'Opción vegetariana y adaptación a alergias',
        ],
        horario: '19:30 – 23:00',
        capacidad: 'Máx. 12 comensales · Define horario en la reserva',
        images: [
            '/images/restaurante-1.jpg',
            '/images/restaurante-2.jpg',
            '/images/restaurante-3.jpg',
            '/images/restaurante-4.jpg',
        ],
    },
    5: {
        descripcion: 'Mantén tu rutina sin sacrificar el lujo. Nuestro Gimnasio 24h cuenta con la maquinaria más avanzada del mercado en un espacio diseñado para inspirar el movimiento. Desde el cardio matutino hasta el entrenamiento de fuerza nocturno, el gimnasio está siempre listo para ti.',
        caracteristicas: [
            'Equipamiento Technogym de última generación',
            'Zona de pesas libres y máquinas de musculación',
            'Cardio: cintas, elípticas, bicicletas y remos',
            'Clases dirigidas de yoga, pilates y HIIT',
            'Entrenador personal disponible bajo reserva',
            'Vestuarios con sauna seca incluida',
        ],
        horario: '24 horas',
        capacidad: 'Acceso libre · Define horario en la reserva',
        images: [
            '/images/gym-1.jpg',
            '/images/gym-2.jpg',
            '/images/gym-3.jpg',
            '/images/gym-4.jpg',
        ],
    },
    6: {
        descripcion: 'El lujo de tenerlo todo sin salir de tu habitación. Nuestro Room Service opera las 24 horas con una carta completa que incluye desde desayunos ligeros hasta cenas elaboradas. Todo presentado con la misma excelencia que esperas de Golden Resort, entregado en tu puerta en menos de 30 minutos.',
        caracteristicas: [
            'Disponible las 24 horas, todos los días del año',
            'Carta completa: desayuno, almuerzo, cena y snacks',
            'Entrega garantizada en menos de 30 minutos',
            'Presentación en vajilla de porcelana con cubiertos de plata',
            'Carta de vinos y cócteles disponible',
            'Opción de mesa en habitación montada por el equipo',
            'Pedir horario en recepción',
            'Si quieres más, pedir en el 030',
        ],
        horario: '24 horas',
        capacidad: 'Define qué quieres en la reserva',
        images: [
            '/images/roomservice-1.jpg',
            '/images/roomservice-2.jpg',
        ],
    },
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

