// Hotel DAW | app.js



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
        icon: '🛁',
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
        capacidad: 'Hasta 2 personas · Reserva previa',
        images: [
            '/images/spa-1.jpg',
            '/images/spa-2.jpg',
            '/images/spa-3.jpg',
            '/images/spa-4.jpg',
        ],
    },
    2: {
        icon: '🍳',
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
        capacidad: 'Por persona · Incluye bebidas calientes',
        images: [
            '/images/desayuno-1.jpg',
            '/images/desayuno-2.jpg',
            '/images/desayuno-3.jpg',
        ],
    },
    3: {
        icon: '🚗',
        descripcion: 'Llega y parte con la elegancia que mereces. Nuestro Servicio de Coche privado pone a tu disposición un conductor profesional y un vehículo de alta gama para que cada trayecto sea tan memorable como tu estancia. Traslados al aeropuerto, excursiones o simplemente moverse por la ciudad con estilo.',
        caracteristicas: [
            'Vehículo de lujo (Mercedes Clase E o superior)',
            'Conductor profesional y discreto',
            'Traslados al aeropuerto y estación de tren',
            'Excursiones y visitas turísticas privadas',
            'Disponible las 24 horas con reserva previa',
            'Amenities de bienvenida a bordo',
        ],
        horario: '24 horas',
        capacidad: 'Hasta 4 pasajeros · Reserva 2h antes',
        images: [
            '/images/coche-1.jpg',
            '/images/coche-2.jpg',
            '/images/coche-3.jpg',
            '/images/coche-4.jpg',
        ],
    },
    4: {
        icon: '🍷',
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
        capacidad: 'Máx. 12 comensales · Reserva obligatoria',
        images: [
            '/images/restaurante-1.jpg',
            '/images/restaurante-2.jpg',
            '/images/restaurante-3.jpg',
            '/images/restaurante-4.jpg',
        ],
    },
    5: {
        icon: '🏋️',
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
        capacidad: 'Acceso libre · Clases con reserva previa',
        images: [
            '/images/gym-1.jpg',
            '/images/gym-2.jpg',
            '/images/gym-3.jpg',
            '/images/gym-4.jpg',
        ],
    },
    6: {
        icon: '🌿',
        descripcion: 'El lujo de tenerlo todo sin salir de tu habitación. Nuestro Room Service opera las 24 horas con una carta completa que incluye desde desayunos ligeros hasta cenas elaboradas. Todo presentado con la misma excelencia que esperas de Hotel DAW, entregado en tu puerta en menos de 30 minutos.',
        caracteristicas: [
            'Disponible las 24 horas, todos los días del año',
            'Carta completa: desayuno, almuerzo, cena y snacks',
            'Entrega garantizada en menos de 30 minutos',
            'Presentación en vajilla de porcelana con cubiertos de plata',
            'Carta de vinos y cócteles disponible',
            'Opción de mesa en habitación montada por el equipo',
        ],
        horario: '24 horas',
        capacidad: 'Para huéspedes del hotel',
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

// ── FLATPICKR ─────────────────────────────────────────────────────────────────

function initFancyMonthDropdown(instance) {
    var select = instance.calendarContainer.querySelector('.flatpickr-monthDropdown-months');
    if (!select || select.dataset.replaced) return;
    select.dataset.replaced = '1';
    select.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';

    var monthsData = Array.from(select.options).map(o => ({
        text: o.text,
        value: parseInt(o.value)
    }));

    var btn = document.createElement('span');
    btn.className = 'fp-month-btn';
    // Use the longhand month name from l10n to ensure correctness
    btn.textContent = instance.l10n.months.longhand[instance.currentMonth] + ' ▾';

    var list = document.createElement('div');
    list.className = 'fp-month-list';
    list.style.cssText = 'display:none;position:fixed;z-index:999999;';
    list.innerHTML = monthsData.map(m =>
        `<div class="fp-month-item${m.value === instance.currentMonth ? ' active' : ''}" data-month="${m.value}">${m.text}</div>`
    ).join('');
    document.body.appendChild(list);

    var wrap = document.createElement('div');
    wrap.className = 'fp-month-wrap';
    wrap.appendChild(btn);

    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        var isOpen = list.style.display === 'block';
        if (isOpen) { list.style.display = 'none'; return; }
        var rect = btn.getBoundingClientRect();
        list.style.top  = (rect.bottom + 4) + 'px';
        list.style.left = rect.left + 'px';
        list.style.display = 'block';
    });

    list.addEventListener('mousedown', (e) => e.stopPropagation());
    list.addEventListener('click', (e) => {
        e.stopPropagation();
        var item = e.target.closest('.fp-month-item');
        if (!item) return;
        var targetMonth = parseInt(item.dataset.month);
        instance.changeMonth(targetMonth - instance.currentMonth);
        list.style.display = 'none';
    });

    document.addEventListener('click', () => { list.style.display = 'none'; });
    select.parentNode.insertBefore(wrap, select);
}

function syncFancyMonth(instance) {
    var wrap = instance.calendarContainer.querySelector('.fp-month-wrap');
    if (!wrap) return;
    
    // Always use the fixed localization array to get the month name by absolute index
    var monthName = instance.l10n.months.longhand[instance.currentMonth];
    wrap.querySelector('.fp-month-btn').textContent = monthName + ' ▾';
    
    wrap.querySelectorAll('.fp-month-item').forEach(el =>
        el.classList.toggle('active', parseInt(el.dataset.month) === instance.currentMonth)
    );
}

var FP_CONFIG = {
    disableMobile: true,
    locale: 'es',
    onReady:       (_d, _s, instance) => initFancyMonthDropdown(instance),
    onMonthChange: (_d, _s, instance) => syncFancyMonth(instance),
};

// ── INIT ──────────────────────────────────────────────────────────────────────

async function init() {
    AOS.init({ duration: 800, once: false });
    flatpickr('#in-date', FP_CONFIG);
    flatpickr('#out-date', FP_CONFIG);
    setupNavbarScroll();
    setupSearch();

    // Comprobar sesión activa en el servidor
    try {
        const res = await fetch('/api/usuario-info');
        if (res.ok) {
            const data = await res.json();
            if (data.nombre && data.nombre !== 'Invitado') {
                state.user  = { email: data.nombre, roles: data.roles };
                state.token = 'session';
                const rol = data.roles.includes('ROLE_ADMIN') ? 'ADMIN' : 'CLIENTE';
                state.user.rol = rol;
            }
        }
    } catch (_) {}

    updateNav();

    // ── URL ROUTING ──────────────────────────────────────────────────────────────
    var path = window.location.pathname;

    if (path.startsWith('/habitacion/')) {
        var tipo = path.split('/habitacion/')[1].toUpperCase();
        history.replaceState({ view: 'habitacion', tipo }, '', path);
        var rooms = await fetch('/api/habitaciones').then(r => r.json()).catch(() => []);
        var room  = rooms.find(r => r.tipo === tipo);
        if (room) {
            await loadRooms();
            _suppressHistoryPush = true;
            await selectRoom(tipo, room.precioNoche, room.descripcion || '');
            _suppressHistoryPush = false;
        } else {
            loadRooms();
            loadServicios();
        }
    } else if (path.startsWith('/servicio/')) {
        var slug     = path.split('/servicio/')[1];
        history.replaceState({ view: 'servicio', slug }, '', path);
        var servicios = await fetchServicios();
        var servicio  = servicios.find(s => slugify(s.nombre) === slug);
        if (servicio) {
            loadRooms();
            loadServicios();
            _suppressHistoryPush = true;
            await openServicioDetail(servicio.id);
            _suppressHistoryPush = false;
        } else {
            loadRooms();
            loadServicios();
        }
    } else {
        history.replaceState({ view: 'home' }, '', path);
        loadRooms();
        loadServicios();
    }

    // ── POPSTATE (botón atrás/adelante del navegador) ─────────────────────────
    window.addEventListener('popstate', async (e) => {
        var ps = e.state;
        if (!ps || ps.view === 'home') {
            if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
            showLanding();
            loadRooms();
            loadServicios();
        } else if (ps.view === 'habitacion') {
            var rooms = await fetch('/api/habitaciones').then(r => r.json()).catch(() => []);
            var room  = rooms.find(r => r.tipo === ps.tipo);
            if (room) {
                _suppressHistoryPush = true;
                await selectRoom(ps.tipo, room.precioNoche, room.descripcion || '');
                _suppressHistoryPush = false;
            }
        } else if (ps.view === 'servicio') {
            var servicios = await fetchServicios();
            var servicio  = servicios.find(s => slugify(s.nombre) === ps.slug);
            if (servicio) {
                _suppressHistoryPush = true;
                await openServicioDetail(servicio.id);
                _suppressHistoryPush = false;
            }
        }
    });
}

// ── NAVBAR ────────────────────────────────────────────────────────────────────

function setupNavbarScroll() {
    window.addEventListener('scroll', () => {
        var navbar = document.getElementById('navbar');
        if (window.scrollY > 80) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

window.scrollToSection = (id) => {
    history.pushState({ view: 'home' }, '', '/');
    showLanding();
    setTimeout(() => {
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
};

window.goHome = () => {
    history.pushState({ view: 'home' }, '', '/');
    showLanding();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function updateNav() {
    var btnAuth        = document.getElementById('btn-auth');
    var navUser        = document.getElementById('nav-user');
    var navMisReservas = document.getElementById('nav-mis-reservas');
    var navAdmin       = document.getElementById('nav-admin');
    var btnReservarNav = document.getElementById('btn-reservar-nav');

    if (state.token && state.user) {
        btnAuth.textContent = 'Cerrar Sesión';
        btnAuth.onclick     = logout;
        navUser.style.display        = 'inline';
        navUser.textContent          = state.user.email.split('@')[0];
        navMisReservas.style.display = state.user.rol === 'ADMIN' ? 'none' : 'inline';
        navAdmin.style.display       = state.user.rol === 'ADMIN' ? 'inline' : 'none';
        if (btnReservarNav) btnReservarNav.style.display = state.user.rol === 'ADMIN' ? 'none' : 'inline';
    } else {
        btnAuth.textContent = 'Iniciar Sesión';
        btnAuth.onclick     = openAuthModal;
        navUser.style.display        = 'none';
        navMisReservas.style.display = 'none';
        navAdmin.style.display       = 'none';
        if (btnReservarNav) btnReservarNav.style.display = 'none';
    }
}

// ── VISTAS ────────────────────────────────────────────────────────────────────

function showLanding() {
    document.getElementById('hero').style.display         = '';
    document.getElementById('habitaciones').style.display = '';
    document.getElementById('servicios').style.display    = '';
    document.getElementById('contacto').style.display     = '';
    document.querySelector('footer').style.display        = '';
    document.getElementById('main-content').style.display = 'none';
}

function showDynamic(html) {
    document.getElementById('hero').style.display         = 'none';
    document.getElementById('habitaciones').style.display = 'none';
    document.getElementById('servicios').style.display    = 'none';
    document.getElementById('contacto').style.display     = 'none';
    document.querySelector('footer').style.display        = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('dynamic-view').innerHTML     = html;
    window.scrollTo({ top: 0 });
}

// ── SEARCH ────────────────────────────────────────────────────────────────────

function setupSearch() {
    var form = document.getElementById('form-search');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            var inDate  = document.getElementById('in-date').value;
            var outDate = document.getElementById('out-date').value;
            state.searchDates = { inDate, outDate };
            showLanding();
            setTimeout(() => {
                document.getElementById('habitaciones').scrollIntoView({ behavior: 'smooth' });
            }, 50);
            await loadRooms();
        };
    }
}

// ── HABITACIONES ─────────────────────────────────────────────────────────────

async function loadRooms() {
    var wrapper = document.getElementById('rooms-wrapper');
    if (!wrapper) return;

    var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };

    // Fetch datos reales de la API
    var habitacionesRaw = [];
    try {
        var res = await fetch('/api/habitaciones');
        if (res.ok) habitacionesRaw = await res.json();
    } catch (_) {}

    // Agrupar por tipo
    var grupos = habitacionesRaw.reduce((acc, h) => {
        if (!acc[h.tipo]) acc[h.tipo] = [];
        acc[h.tipo].push(h);
        return acc;
    }, {});

    // Disponibilidad real por tipo (solo cuando hay fechas de búsqueda)
    var disponibilidadReal = null;
    if (state.searchDates && state.searchDates.inDate && state.searchDates.outDate) {
        try {
            var dRes = await fetch(
                '/api/habitaciones/disponibles?fechaEntrada=' + state.searchDates.inDate +
                '&fechaSalida=' + state.searchDates.outDate
            );
            if (dRes.ok) disponibilidadReal = await dRes.json();
        } catch (_) {}
    }

    // Orden fijo de tipos
    var tipoOrder = ['NORMAL', 'DOBLE', 'SUITE', 'LUJO'];
    var habitaciones = tipoOrder
        .filter(t => grupos[t] && grupos[t].length > 0)
        .map(t => ({
            tipo:        t,
            precio:      grupos[t][0].precioNoche,
            descripcion: grupos[t][0].descripcion || '',
            count:       grupos[t].length,
        }));

    wrapper.innerHTML = '';

    habitaciones.forEach(h => {
        var imgs  = TIPO_IMAGES[h.tipo] || [];
        var thumb = imgs[0] || '';
        var label = tipoLabels[h.tipo] || h.tipo;

        // Badge de disponibilidad
        var badgeStyle = 'background:rgba(185,149,77,0.15); color:var(--gold);';
        var badgeText  = '● Disponible';
        var disponible = true;

        if (disponibilidadReal !== null) {
            var libres = disponibilidadReal[h.tipo] !== undefined ? disponibilidadReal[h.tipo] : 0;
            if (libres > 0) {
                badgeText = '● Quedan ' + libres;
            } else {
                badgeStyle = 'background:rgba(139,26,26,0.2); color:#c0392b;';
                badgeText  = '● Sin disponibilidad';
                disponible = false;
            }
        }

        var descEscaped = h.descripcion.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        var slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="room-card">
                <div class="room-card-img" onclick="openRoomLightbox('${label}', '${h.tipo}', ${h.precio})">
                    <img src="${thumb}" alt="${label}" loading="lazy">
                    <div class="room-img-overlay"><span class="room-img-overlay-text">Ver fotos</span></div>
                </div>
                <div class="room-card-body">
                    <p class="room-type-badge">${h.tipo}</p>
                    <h3 class="room-name serif">${label}</h3>
                    <p class="room-price">${h.precio}€ <small>/ noche</small></p>
                    <div style="margin-bottom:12px;">
                        <span style="font-size:0.7rem; letter-spacing:1px; padding:4px 12px; border-radius:20px; ${badgeStyle}">
                            ${badgeText}
                        </span>
                    </div>
                    ${disponible
                        ? `<button class="btn-room" onclick="selectRoom('${h.tipo}', ${h.precio}, '${descEscaped}')">Reservar</button>`
                        : `<button class="btn-room" disabled style="opacity:0.4; cursor:not-allowed;">Sin disponibilidad</button>`
                    }
                </div>
            </div>
        `;
        wrapper.appendChild(slide);
    });

    if (roomSwiper) { roomSwiper.destroy(true, true); roomSwiper = null; }
    roomSwiper = new Swiper('.roomSwiper', {
        slidesPerView: 'auto',
        spaceBetween: 24,
        centeredSlides: false,
        loop: false,
        pagination:  { el: '.swiper-pagination', clickable: true },
        navigation:  { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    });
}

// ── SERVICIOS — cargados desde backend ───────────────────────────────────────

var _serviciosCache = null;

async function fetchServicios() {
    if (_serviciosCache) return _serviciosCache;
    try {
        var res = await fetch('/api/servicios');
        if (res.ok) _serviciosCache = await res.json();
    } catch (_) {}
    return _serviciosCache || [];
}

// ── ROOM SERVICE ITEMS — cargados desde backend ───────────────────────────────

var _rsItemsCache = null;

async function fetchRoomServiceItems() {
    if (_rsItemsCache) return _rsItemsCache;
    try {
        var res = await fetch('/api/room-service/items');
        if (res.ok) _rsItemsCache = await res.json();
    } catch (_) {}
    return _rsItemsCache || [];
}

// Genera HTML de la carta del Room Service para el modal de reserva
function buildCartaHtml(items) {
    var categorias = ['DESAYUNO', 'ALMUERZO', 'CENA', 'SNACKS', 'BEBIDAS'];
    var catLabels  = { DESAYUNO: 'Desayuno', ALMUERZO: 'Almuerzo', CENA: 'Cena', SNACKS: 'Snacks', BEBIDAS: 'Bebidas' };
    var disponibles = items.filter(i => i.disponible);
    if (disponibles.length === 0) return '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">No hay ítems disponibles en la carta.</p>';

    return categorias.map(cat => {
        var catItems = disponibles.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.65rem; letter-spacing:2px; color:var(--text-muted-custom); margin:14px 0 8px; text-transform:uppercase;">${catLabels[cat]}</p>
            ${catItems.map(item => `
                <div class="rs-item-row" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <span style="flex:1; font-size:0.83rem; color:var(--cream);">${item.nombre}</span>
                    <span style="color:var(--gold); font-size:0.83rem; flex-shrink:0;">${parseFloat(item.precio).toFixed(2)} €</span>
                    <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                        <button type="button" onclick="rsAjustarCantidad(${item.id}, -1)"
                            style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream); width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:1rem; line-height:1; padding:0;">−</button>
                        <span id="rs-qty-${item.id}" style="min-width:18px; text-align:center; font-size:0.85rem; color:var(--cream);">0</span>
                        <button type="button" onclick="rsAjustarCantidad(${item.id}, 1)"
                            style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream); width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:1rem; line-height:1; padding:0;">+</button>
                    </div>
                </div>`).join('')}`;
    }).join('');
}

window.toggleCartaRoomService = (checked) => {
    var carta = document.getElementById('carta-room-service');
    if (!carta) return;
    if (checked) {
        carta.style.display = 'block';
    } else {
        carta.style.display = 'none';
        rsResetearCantidades();
        if (window.recalcularTotalReserva) window.recalcularTotalReserva();
    }
};

window.rsAjustarCantidad = (itemId, delta) => {
    var el = document.getElementById('rs-qty-' + itemId);
    if (!el) return;
    var actual = parseInt(el.textContent) || 0;
    var nuevo  = Math.max(0, actual + delta);
    el.textContent = nuevo;
    recalcularTotalReserva();
};

function rsObtenerSeleccionados() {
    var seleccionados = [];
    document.querySelectorAll('[id^="rs-qty-"]').forEach(el => {
        var qty = parseInt(el.textContent) || 0;
        if (qty > 0) {
            var itemId = parseInt(el.id.replace('rs-qty-', ''));
            seleccionados.push({ itemId, cantidad: qty });
        }
    });
    return seleccionados;
}

function rsResetearCantidades() {
    document.querySelectorAll('[id^="rs-qty-"]').forEach(el => { el.textContent = '0'; });
}

// Función global para recalcular (usada tanto por servicios como por room service)
window.recalcularTotalReserva = null; // se asigna dentro de selectRoom

async function loadServicios() {
    var grid = document.getElementById('servicios-grid');
    if (!grid) return;

    var servicios = await fetchServicios();

    if (servicios.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted-custom); text-align:center; letter-spacing:1px; grid-column:1/-1;">No hay servicios disponibles actualmente.</p>';
        AOS.refresh();
        return;
    }

    grid.innerHTML = servicios.map((s, i) => {
        var data  = SERVICIO_DATA[s.id];
        var bgImg = data && data.images && data.images[0] ? data.images[0] : '';
        var bgStyle = bgImg ? `style="background-image:url('${bgImg}')"` : '';
        return `
        <div class="col-md-4 col-sm-6" data-aos="fade-up" data-aos-delay="${i * 80}">
            <div class="servicio-card servicio-card--clickable servicio-card--img" onclick="openServicioDetail(${s.id})" ${bgStyle}>
                <div class="servicio-card-overlay"></div>
                <div class="servicio-card-content">
                    <h4 class="servicio-name serif">${s.nombre}</h4>
                    <p class="servicio-price">${parseFloat(s.precio).toFixed(2)} €</p>
                    <p class="servicio-card-hint">Ver detalle →</p>
                </div>
            </div>
        </div>`;
    }).join('');
    AOS.refresh();
}

// ── VISTA DE DETALLE POR TIPO ─────────────────────────────────────────────────

window.selectRoom = async (tipo, precio, descripcion) => {
    if (!state.token) { openAuthModal(); return; }
    if (state.user && state.user.rol === 'ADMIN') return; // Los admins no reservan

    if (!_suppressHistoryPush) {
        history.pushState({ view: 'habitacion', tipo }, '', '/habitacion/' + tipo.toLowerCase());
    }

    var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };
    var label = tipoLabels[tipo] || tipo;
    var imgs  = TIPO_IMAGES[tipo] || [];

    var servicios       = await fetchServicios();
    var rsItems         = await fetchRoomServiceItems();

    var slidesHtml = imgs.map(src =>
        `<div class="swiper-slide detail-swiper-slide"><img src="${src}" alt="${label}"></div>`
    ).join('');

    // Si ya hay fechas de búsqueda, mostrarlas directamente; si no, mostrar selector
    var fechaEntrada = state.searchDates ? state.searchDates.inDate : '';
    var fechaSalida  = state.searchDates ? state.searchDates.outDate : '';

    var fechasHtml = state.searchDates
        ? `<div style="margin-bottom:16px; color:var(--text-muted-custom); font-size:0.85rem; letter-spacing:1px;">
               Fechas seleccionadas: <strong style="color:var(--cream);">${fechaEntrada}</strong> → <strong style="color:var(--cream);">${fechaSalida}</strong>
           </div>`
        : `<div style="margin-bottom:16px;">
               <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                   <div>
                       <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">LLEGADA</label>
                       <input id="detail-in-date" type="text" placeholder="dd/mm/aaaa"
                           style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream);
                                  padding:8px 14px; border-radius:6px; font-size:0.85rem; cursor:pointer; width:150px;">
                   </div>
                   <div>
                       <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">SALIDA</label>
                       <input id="detail-out-date" type="text" placeholder="dd/mm/aaaa"
                           style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream);
                                  padding:8px 14px; border-radius:6px; font-size:0.85rem; cursor:pointer; width:150px;">
                   </div>
               </div>
           </div>`;

    // Identificar Room Service por nombre, no por ID hardcodeado
    var rsServicio = servicios.find(s => s.nombre.toLowerCase().includes('room service'));
    var RS_SERVICIO_ID = rsServicio ? rsServicio.id : null;
    var cartaHtml = buildCartaHtml(rsItems);

    var serviciosHtml = servicios.length === 0
        ? '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">No hay servicios adicionales disponibles.</p>'
        : servicios.map(s => {
            if (RS_SERVICIO_ID !== null && s.id === RS_SERVICIO_ID) {
                // Room Service: checkbox + carta desplegable
                return `
                <div style="margin-bottom:10px;">
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.85rem; color:var(--cream);">
                        <input type="checkbox" class="servicio-check rs-toggle"
                            data-id="${s.id}" data-precio="0"
                            onchange="toggleCartaRoomService(this.checked)"
                            style="accent-color:var(--gold); width:16px; height:16px; cursor:pointer;">
                        <span>${s.nombre}</span>
                        <span style="color:var(--gold); margin-left:auto; flex-shrink:0;" id="rs-subtotal-label"></span>
                    </label>
                    <div id="carta-room-service" style="display:none; margin-top:10px; padding:12px 14px; background:rgba(255,255,255,0.04); border-left:2px solid rgba(185,149,77,0.4); border-radius:0 8px 8px 0;">
                        ${cartaHtml}
                        <p id="rs-subtotal-linea" style="color:var(--gold); font-size:0.82rem; font-weight:600; margin-top:10px; letter-spacing:1px;"></p>
                    </div>
                </div>`;
            }
            return `
            <label style="display:flex; align-items:center; gap:10px; margin-bottom:10px; cursor:pointer; font-size:0.85rem; color:var(--cream);">
                <input type="checkbox" class="servicio-check"
                    data-id="${s.id}" data-precio="${s.precio}"
                    style="accent-color:var(--gold); width:16px; height:16px; cursor:pointer;">
                <span>${s.nombre}</span>
                <span style="color:var(--gold); margin-left:auto; flex-shrink:0;">${parseFloat(s.precio).toFixed(2)} €</span>
            </label>`;
        }).join('');

    showDynamic(`
        <div class="detail-view-container" data-aos="fade-up">
            <p class="section-label mb-1">Hotel DAW · Nuestras Suites</p>
            <h2 class="serif mb-2" style="color:var(--cream); font-size:2.2rem;">${label}</h2>
            <div class="gold-line mb-5"></div>

            <div class="swiper detailSwiper mb-5">
                <div class="swiper-wrapper">${slidesHtml}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>

            <p class="detail-price">${precio}€ <small style="font-size:1rem; color:var(--text-muted-custom);">/ noche</small></p>
            <p class="detail-description">${descripcion}</p>

            ${fechasHtml}

            <div style="margin-bottom:20px;">
                <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:12px;">SERVICIOS ADICIONALES</p>
                ${serviciosHtml}
                <p id="reserva-total-estimado" style="color:var(--gold); font-size:0.9rem; font-weight:600; margin-top:14px; letter-spacing:1px;"></p>
            </div>

            <div id="reserva-msg" style="display:none; margin-bottom:14px; font-size:0.85rem; letter-spacing:1px;"></div>

            <button class="btn-room" id="btn-confirmar-reserva"
                onclick="confirmarReserva('${tipo}')">
                Confirmar Reserva
            </button>
        </div>
    `);

    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    detailSwiper = new Swiper('.detailSwiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: imgs.length > 1,
        autoplay: { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination:  { el: '.detailSwiper .swiper-pagination', clickable: true },
        navigation:  { nextEl: '.detailSwiper .swiper-button-next', prevEl: '.detailSwiper .swiper-button-prev' },
    });

    // Recalcula el total estimado en tiempo real (servicios + room service items)
    function recalcularTotal() {
        var inDate  = state.searchDates ? state.searchDates.inDate  : (document.getElementById('detail-in-date')?.value  || '');
        var outDate = state.searchDates ? state.searchDates.outDate : (document.getElementById('detail-out-date')?.value || '');
        var totalEl = document.getElementById('reserva-total-estimado');
        if (!totalEl || !inDate || !outDate) return;
        var noches = Math.round((new Date(outDate + 'T00:00:00') - new Date(inDate + 'T00:00:00')) / 86400000);
        if (noches <= 0) { totalEl.textContent = ''; return; }

        var totalServicios = 0;
        document.querySelectorAll('.servicio-check:checked').forEach(cb => {
            totalServicios += parseFloat(cb.dataset.precio);
        });

        // Subtotal room service
        var subtotalRS = 0;
        document.querySelectorAll('[id^="rs-qty-"]').forEach(el => {
            var qty = parseInt(el.textContent) || 0;
            if (qty > 0) {
                var itemId = parseInt(el.id.replace('rs-qty-', ''));
                var item = rsItems.find(i => i.id === itemId);
                if (item) subtotalRS += parseFloat(item.precio) * qty;
            }
        });

        var subtotalLabel = document.getElementById('rs-subtotal-label');
        var subtotalLinea = document.getElementById('rs-subtotal-linea');
        if (subtotalRS > 0) {
            if (subtotalLabel) subtotalLabel.textContent = subtotalRS.toFixed(2) + ' €';
            if (subtotalLinea) subtotalLinea.textContent = 'Subtotal room service: ' + subtotalRS.toFixed(2) + ' €';
        } else {
            if (subtotalLabel) subtotalLabel.textContent = '';
            if (subtotalLinea) subtotalLinea.textContent = '';
        }

        totalEl.textContent = `Total estimado: ${(parseFloat(precio) * noches + totalServicios + subtotalRS).toFixed(2)} €`;
    }

    // Asignar como función global para que rsAjustarCantidad la pueda llamar
    window.recalcularTotalReserva = recalcularTotal;

    document.querySelectorAll('.servicio-check').forEach(cb => cb.addEventListener('change', recalcularTotal));

    if (!state.searchDates) {
        flatpickr('#detail-in-date',  { ...FP_CONFIG, minDate: 'today', onChange: recalcularTotal });
        flatpickr('#detail-out-date', { ...FP_CONFIG, minDate: 'today', onChange: recalcularTotal });
    } else {
        recalcularTotal();
    }
};

window.confirmarReserva = async (tipo) => {
    var btn = document.getElementById('btn-confirmar-reserva');
    var msg = document.getElementById('reserva-msg');

    var fechaEntrada, fechaSalida;
    if (state.searchDates) {
        fechaEntrada = state.searchDates.inDate;
        fechaSalida  = state.searchDates.outDate;
    } else {
        fechaEntrada = document.getElementById('detail-in-date').value;
        fechaSalida  = document.getElementById('detail-out-date').value;
    }

    if (!fechaEntrada || !fechaSalida) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = 'Por favor selecciona las fechas de entrada y salida.';
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'Reservando...';
    msg.style.display = 'none';

    try {
        // Excluir Room Service por clase, no por ID hardcodeado
        var serviciosSeleccionados = [];
        document.querySelectorAll('.servicio-check:checked').forEach(cb => {
            if (!cb.classList.contains('rs-toggle')) { // rs-toggle marca el checkbox de Room Service
                serviciosSeleccionados.push({ servicioId: parseInt(cb.dataset.id), cantidad: 1 });
            }
        });

        var res = await fetch('/api/reservas/por-tipo', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ tipo, fechaEntrada, fechaSalida, servicios: serviciosSeleccionados }),
        });

        if (res.ok) {
            var reservaCreada = await res.json();

            // Enviar ítems de room service si hay alguno seleccionado
            var rsSeleccionados = rsObtenerSeleccionados();
            if (reservaCreada && reservaCreada.id && rsSeleccionados.length > 0) {
                await Promise.all(rsSeleccionados.map(sel =>
                    fetch('/api/room-service/pedidos/' + reservaCreada.id, {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ itemId: sel.itemId, cantidad: sel.cantidad }),
                    })
                ));
            }

            msg.style.display = 'block';
            msg.style.color   = 'var(--gold)';
            msg.textContent   = '¡Reserva confirmada! Tu habitación ha sido reservada.';
            btn.textContent   = 'Reservado';
            // Refrescar disponibilidad en la sección principal
            loadRooms();
        } else if (res.status === 409) {
            msg.style.display  = 'block';
            msg.style.color    = '#c0392b';
            msg.textContent    = 'No hay habitaciones disponibles de ese tipo para las fechas seleccionadas.';
            btn.disabled       = false;
            btn.textContent    = 'Confirmar Reserva';
        } else if (res.status === 401) {
            openAuthModal();
        } else {
            msg.style.display  = 'block';
            msg.style.color    = '#c0392b';
            msg.textContent    = 'Error al procesar la reserva. Inténtalo de nuevo.';
            btn.disabled       = false;
            btn.textContent    = 'Confirmar Reserva';
        }
    } catch (_) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = 'Error de conexión. Inténtalo de nuevo.';
        btn.disabled       = false;
        btn.textContent    = 'Confirmar Reserva';
    }
};

window.backFromDetail = () => {
    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    history.pushState({ view: 'home' }, '', '/');
    showLanding();
    loadRooms();
};

// ── HELPERS MIS RESERVAS ──────────────────────────────────────────────────────

function calcularEstado(fechaEntrada, fechaSalida) {
    var hoy   = new Date(); hoy.setHours(0,0,0,0);
    var entrada = new Date(fechaEntrada + 'T00:00:00');
    var salida  = new Date(fechaSalida  + 'T00:00:00');
    if (hoy < entrada) return 'PROXIMA';
    if (hoy >= salida) return 'PASADA';
    return 'EN_CURSO';
}

function formatFecha(dateStr) {
    var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var parts = dateStr.split('-');
    return parts[2] + ' ' + meses[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

// ── MIS RESERVAS ──────────────────────────────────────────────────────────────

window.showMisReservas = async () => {
    showDynamic(`
        <p class="section-label">Tu historial</p>
        <h2 class="serif mb-2" style="color:var(--cream); font-size:2.5rem;">Mis Reservas</h2>
        <div class="gold-line mb-5"></div>
        <div id="reservas-container" style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">
            Cargando...
        </div>
    `);

    var res;
    try {
        res = await fetch('/api/reservas/mis-reservas');
    } catch (_) {
        document.getElementById('reservas-container').textContent = 'Error de conexión.';
        return;
    }

    if (res.status === 401) { openAuthModal(); return; }
    if (!res.ok) {
        document.getElementById('reservas-container').textContent = 'No se pudieron cargar las reservas.';
        return;
    }

    var reservas = await res.json();
    var container = document.getElementById('reservas-container');

    if (!reservas || reservas.length === 0) {
        container.innerHTML = `
            <div class="reserva-empty">
                <p class="reserva-empty-title">Todavía no tienes reservas</p>
                <p class="reserva-empty-sub">Explora nuestras habitaciones y encuentra la tuya</p>
                <button class="btn-reserva-empty" onclick="goHome()">Explorar habitaciones</button>
            </div>`;
        return;
    }

    var estadoOrder = { EN_CURSO: 0, PROXIMA: 1, PASADA: 2 };
    reservas.sort((a, b) => {
        var ea = calcularEstado(a.fechaEntrada, a.fechaSalida);
        var eb = calcularEstado(b.fechaEntrada, b.fechaSalida);
        if (estadoOrder[ea] !== estadoOrder[eb]) return estadoOrder[ea] - estadoOrder[eb];
        if (ea === 'PROXIMA') return new Date(a.fechaEntrada) - new Date(b.fechaEntrada);
        return new Date(b.fechaEntrada) - new Date(a.fechaEntrada);
    });

    var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };

    var html = '<div class="reservas-list">';
    reservas.forEach(r => {
        var estado  = calcularEstado(r.fechaEntrada, r.fechaSalida);
        var noches  = Math.max(1, Math.round(
            (new Date(r.fechaSalida + 'T00:00:00') - new Date(r.fechaEntrada + 'T00:00:00')) / 86400000
        ));
        var total   = r.total ? parseFloat(r.total).toFixed(2) : (parseFloat(r.precioNoche) * noches).toFixed(2);
        var img     = (TIPO_IMAGES[r.habitacionTipo] || [])[0] || '';
        var label   = tipoLabels[r.habitacionTipo] || r.habitacionTipo;
        var serviciosHtml = (r.servicios && r.servicios.length > 0)
            ? `<p class="reserva-meta" style="margin-top:4px; font-size:0.75rem;">
                   Servicios: ${r.servicios.map(s => `${s.nombre} ×${s.cantidad}`).join(' · ')}
               </p>`
            : '';

        var badgeStyle, badgeText;
        if (estado === 'EN_CURSO') {
            badgeStyle = 'background:rgba(39,174,96,0.15); color:#27ae60;';
            badgeText  = '● EN CURSO';
        } else if (estado === 'PROXIMA') {
            badgeStyle = 'background:rgba(185,149,77,0.15); color:var(--gold);';
            badgeText  = '● PRÓXIMA';
        } else {
            badgeStyle = 'background:rgba(154,154,154,0.1); color:var(--text-muted-custom);';
            badgeText  = '● PASADA';
        }

        var cancelBtn = estado === 'PROXIMA'
            ? `<button class="btn-cancelar" onclick="cancelarReserva(${r.id})">Cancelar reserva</button>`
            : '';

        var gestionRsBtn = (estado === 'PROXIMA' || estado === 'EN_CURSO')
            ? `<button class="admin-btn" style="margin-top:8px; font-size:0.75rem; padding:6px 14px;" onclick="abrirGestionRS(${r.id})">🍽 Gestionar Room Service</button>`
            : '';

        var rsSubtotalStr = r.subtotalRoomService && parseFloat(r.subtotalRoomService) > 0
            ? `<p class="reserva-meta" style="font-size:0.75rem;" id="rs-info-${r.id}">
                   Room Service: <strong style="color:var(--gold);">${parseFloat(r.subtotalRoomService).toFixed(2)} €</strong>
               </p>`
            : `<p class="reserva-meta" style="font-size:0.75rem; color:var(--text-muted-custom);" id="rs-info-${r.id}">Sin pedido de room service</p>`;

        html += `
            <div class="reserva-card${estado === 'PASADA' ? ' reserva-card--pasada' : ''}">
                ${img ? `<img class="reserva-card-img" src="${img}" alt="${label}">` : ''}
                <div class="reserva-card-body">
                    <div class="reserva-card-header">
                        <div>
                            <p class="reserva-tipo-label">${label}</p>
                            <p class="reserva-hab-num">Habitación nº ${r.habitacionNumero}</p>
                        </div>
                        <span class="reserva-estado-badge" style="${badgeStyle}">${badgeText}</span>
                    </div>
                    <p class="reserva-dates">
                        ${formatFecha(r.fechaEntrada)}
                        <span>→</span>
                        ${formatFecha(r.fechaSalida)}
                    </p>
                    <p class="reserva-meta">
                        ${noches} noche${noches > 1 ? 's' : ''} &nbsp;·&nbsp;
                        Total: <strong>${total} €</strong>
                    </p>
                    ${serviciosHtml}
                    ${rsSubtotalStr}
                    ${gestionRsBtn}
                    ${cancelBtn}
                </div>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
};

window.cancelarReserva = async (id) => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            showMisReservas();
        } else {
            alert('No se pudo cancelar la reserva. Inténtalo de nuevo.');
        }
    } catch (_) {
        alert('Error de conexión al cancelar.');
    }
};

// ── GESTIÓN ROOM SERVICE DESDE MIS RESERVAS ───────────────────────────────────

window.abrirGestionRS = async (reservaId) => {
    var items, pedidosActuales;
    try {
        var [resItems, resPedidos] = await Promise.all([
            fetch('/api/room-service/items'),
            fetch('/api/room-service/pedidos/' + reservaId),
        ]);
        items          = resItems.ok  ? await resItems.json()  : [];
        pedidosActuales = resPedidos.ok ? await resPedidos.json() : [];
    } catch (_) {
        alert('Error al cargar la carta.'); return;
    }

    // Mapa pedidoId → cantidad actual para ítems ya pedidos
    var pedidoMap = {};
    pedidosActuales.forEach(p => { pedidoMap[p.itemId] = { pedidoId: p.pedidoId, cantidad: p.cantidad }; });

    var categorias = ['DESAYUNO','ALMUERZO','CENA','SNACKS','BEBIDAS'];
    var catLabels  = { DESAYUNO:'Desayuno', ALMUERZO:'Almuerzo', CENA:'Cena', SNACKS:'Snacks', BEBIDAS:'Bebidas' };
    var disponibles = items.filter(i => i.disponible);

    var cartaRows = categorias.map(cat => {
        var catItems = disponibles.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.65rem;letter-spacing:2px;color:var(--text-muted-custom);margin:14px 0 8px;text-transform:uppercase;">${catLabels[cat]}</p>
            ${catItems.map(item => {
                var qtyActual = pedidoMap[item.id] ? pedidoMap[item.id].cantidad : 0;
                return `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <span style="flex:1;font-size:0.83rem;color:var(--cream);">${item.nombre}</span>
                    <span style="color:var(--gold);font-size:0.83rem;flex-shrink:0;">${parseFloat(item.precio).toFixed(2)} €</span>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        <button type="button" onclick="grsAjustar(${item.id},-1)"
                            style="background:rgba(255,255,255,0.07);border:1px solid rgba(185,149,77,0.3);color:var(--cream);width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:1rem;line-height:1;padding:0;">−</button>
                        <span id="grs-qty-${item.id}" style="min-width:18px;text-align:center;font-size:0.85rem;color:var(--cream);">${qtyActual}</span>
                        <button type="button" onclick="grsAjustar(${item.id},1)"
                            style="background:rgba(255,255,255,0.07);border:1px solid rgba(185,149,77,0.3);color:var(--cream);width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:1rem;line-height:1;padding:0;">+</button>
                    </div>
                </div>`;
            }).join('')}`;
    }).join('');

    // Crear modal
    var modalEl = document.createElement('div');
    modalEl.id  = 'modal-gestion-rs';
    modalEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modalEl.innerHTML = `
        <div style="background:#141414;border:1px solid rgba(185,149,77,0.35);border-radius:14px;padding:28px;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;">
            <p style="font-size:0.65rem;letter-spacing:3px;color:var(--text-muted-custom);margin-bottom:4px;">ROOM SERVICE</p>
            <h3 class="serif" style="color:var(--cream);font-size:1.4rem;margin-bottom:4px;">Carta del Room Service</h3>
            <div class="gold-line mb-4" style="width:60px;"></div>
            ${cartaRows || '<p style="color:var(--text-muted-custom);font-size:0.8rem;">No hay ítems disponibles.</p>'}
            <p id="grs-subtotal" style="color:var(--gold);font-size:0.88rem;font-weight:600;margin-top:14px;letter-spacing:1px;"></p>
            <div id="grs-msg" style="display:none;font-size:0.8rem;margin-top:8px;"></div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button class="btn-room" style="flex:1;padding:12px;" onclick="guardarPedidoRS(${reservaId})">Guardar cambios</button>
                <button class="admin-btn admin-btn--ghost" style="flex:1;" onclick="cerrarGestionRS()">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modalEl);

    // Guardar referencia a pedidoMap para guardarPedidoRS
    window._grsPedidoMap    = pedidoMap;
    window._grsItems        = items;
    window._grsReservaId    = reservaId;

    grsActualizarSubtotal();
};

window.grsAjustar = (itemId, delta) => {
    var el = document.getElementById('grs-qty-' + itemId);
    if (!el) return;
    el.textContent = Math.max(0, (parseInt(el.textContent) || 0) + delta);
    grsActualizarSubtotal();
};

function grsActualizarSubtotal() {
    var subtotal = 0;
    document.querySelectorAll('[id^="grs-qty-"]').forEach(el => {
        var qty = parseInt(el.textContent) || 0;
        if (qty > 0) {
            var itemId = parseInt(el.id.replace('grs-qty-', ''));
            var item = (window._grsItems || []).find(i => i.id === itemId);
            if (item) subtotal += parseFloat(item.precio) * qty;
        }
    });
    var el = document.getElementById('grs-subtotal');
    if (el) el.textContent = subtotal > 0 ? 'Subtotal: ' + subtotal.toFixed(2) + ' €' : '';
}

window.cerrarGestionRS = () => {
    var m = document.getElementById('modal-gestion-rs');
    if (m) m.remove();
};

window.guardarPedidoRS = async (reservaId) => {
    var pedidoMap = window._grsPedidoMap || {};
    var calls = [];

    document.querySelectorAll('[id^="grs-qty-"]').forEach(el => {
        var itemId    = parseInt(el.id.replace('grs-qty-', ''));
        var nuevaQty  = parseInt(el.textContent) || 0;
        var existente = pedidoMap[itemId];

        if (existente && nuevaQty === 0) {
            // Eliminar línea
            calls.push(fetch('/api/room-service/pedidos/' + existente.pedidoId, { method: 'DELETE' }));
        } else if (existente && nuevaQty !== existente.cantidad) {
            // Actualizar cantidad
            calls.push(fetch('/api/room-service/pedidos/' + existente.pedidoId, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cantidad: nuevaQty }),
            }));
        } else if (!existente && nuevaQty > 0) {
            // Nueva línea
            calls.push(fetch('/api/room-service/pedidos/' + reservaId, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, cantidad: nuevaQty }),
            }));
        }
    });

    var msgEl = document.getElementById('grs-msg');
    try {
        await Promise.all(calls);
        cerrarGestionRS();
        showMisReservas(); // refresca toda la vista para reflejar cambios
    } catch (_) {
        msgEl.style.display = 'block';
        msgEl.style.color   = '#c0392b';
        msgEl.textContent   = 'Error al guardar. Inténtalo de nuevo.';
    }
};

// ── PANEL ADMIN ───────────────────────────────────────────────────────────────

window.showAdmin = async () => {
    showDynamic(`
        <p class="section-label">Panel de Control</p>
        <h2 class="serif mb-2" style="color:var(--cream); font-size:2.5rem;">Administración</h2>
        <div class="gold-line mb-4"></div>

        <div class="admin-tabs-bar mb-4">
            <button class="admin-tab-btn active" id="atab-dashboard"    onclick="switchAdminTab('dashboard')">Dashboard</button>
            <button class="admin-tab-btn"        id="atab-reservas"     onclick="switchAdminTab('reservas')">Reservas</button>
            <button class="admin-tab-btn"        id="atab-habitaciones" onclick="switchAdminTab('habitaciones')">Habitaciones</button>
            <button class="admin-tab-btn"        id="atab-servicios"    onclick="switchAdminTab('servicios')">Servicios</button>
            <button class="admin-tab-btn"        id="atab-roomservice"  onclick="switchAdminTab('roomservice')">Room Service</button>
            <button class="admin-tab-btn"        id="atab-usuarios"     onclick="switchAdminTab('usuarios')">Usuarios</button>
        </div>

        <div id="admin-tab-body" style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">Cargando...</div>
    `);

    switchAdminTab('dashboard');
};

window.switchAdminTab = (tab) => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    var btn = document.getElementById('atab-' + tab);
    if (btn) btn.classList.add('active');
    var body = document.getElementById('admin-tab-body');
    if (!body) return;
    body.innerHTML = '<div style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; padding:20px 0;">Cargando...</div>';

    if (tab === 'dashboard')    loadAdminDashboard();
    if (tab === 'reservas')     loadAdminReservas();
    if (tab === 'habitaciones') loadAdminHabitaciones();
    if (tab === 'servicios')    loadAdminServicios();
    if (tab === 'roomservice')  loadAdminRoomService();
    if (tab === 'usuarios')     loadAdminUsuarios();
};

// ── ADMIN: DASHBOARD ──────────────────────────────────────────────────────────

async function loadAdminDashboard() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/admin/stats'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar las métricas.</p>'; return; }
    var s = await res.json();

    var ocupPct = s.totalHabitaciones > 0
        ? Math.round((s.ocupadasHoy / s.totalHabitaciones) * 100) : 0;

    var proximasHtml = s.proximasLlegadas && s.proximasLlegadas.length > 0
        ? `<table class="admin-table mt-3">
               <thead><tr><th>Cliente</th><th>Habitación</th><th>Tipo</th><th>Llegada</th><th>Salida</th></tr></thead>
               <tbody>
                   ${s.proximasLlegadas.map(p => `
                       <tr>
                           <td>${p.clienteNombre}</td>
                           <td>${p.habitacionNumero}</td>
                           <td><span class="admin-badge">${p.habitacionTipo}</span></td>
                           <td>${formatFecha(p.fechaEntrada)}</td>
                           <td>${formatFecha(p.fechaSalida)}</td>
                       </tr>`).join('')}
               </tbody>
           </table>`
        : '<p style="color:var(--text-muted-custom); font-size:0.8rem; margin-top:12px; letter-spacing:1px;">No hay llegadas próximas.</p>';

    body.innerHTML = `
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <p class="admin-stat-label">Reservas hoy</p>
                <p class="admin-stat-value">${s.reservasHoy}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">Reservas este mes</p>
                <p class="admin-stat-value">${s.reservasMes}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">Ingresos este mes</p>
                <p class="admin-stat-value">${parseFloat(s.ingresosMes).toFixed(2)} €</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">Ocupación hoy</p>
                <p class="admin-stat-value">${s.ocupadasHoy} / ${s.totalHabitaciones} <small style="font-size:1rem;">(${ocupPct}%)</small></p>
            </div>
        </div>

        <div class="mt-5">
            <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:4px;">PRÓXIMAS LLEGADAS</p>
            <div class="gold-line" style="width:60px; margin-bottom:0;"></div>
            ${proximasHtml}
        </div>`;
}

// ── ADMIN: RESERVAS ───────────────────────────────────────────────────────────

async function loadAdminReservas() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/reservas'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar las reservas.</p>'; return; }
    var reservas = await res.json();

    if (!reservas || reservas.length === 0) {
        body.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">No hay reservas.</p>';
        return;
    }

    var tipoLabels = { NORMAL: 'Normal', DOBLE: 'Doble', SUITE: 'Suite', LUJO: 'Lujo' };

    body.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th><th>Cliente</th><th>Habitación</th><th>Llegada</th><th>Salida</th>
                    <th>Servicios</th><th>Total</th><th></th>
                </tr>
            </thead>
            <tbody>
                ${reservas.map(r => {
                    var serviciosStr = r.servicios && r.servicios.length > 0
                        ? r.servicios.map(s => s.nombre).join(', ')
                        : '—';
                    return `<tr>
                        <td>${r.id}</td>
                        <td><span style="color:var(--cream);">${r.clienteNombre || '—'}</span><br><small style="color:var(--text-muted-custom);">${r.clienteEmail || ''}</small></td>
                        <td><span class="admin-badge">${tipoLabels[r.habitacionTipo] || r.habitacionTipo}</span> nº ${r.habitacionNumero}</td>
                        <td>${formatFecha(r.fechaEntrada)}</td>
                        <td>${formatFecha(r.fechaSalida)}</td>
                        <td style="font-size:0.75rem;">${serviciosStr}</td>
                        <td style="color:var(--gold); white-space:nowrap;">${parseFloat(r.total).toFixed(2)} €</td>
                        <td><button class="admin-btn admin-btn--danger" onclick="adminCancelarReserva(${r.id})">Cancelar</button></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

window.adminCancelarReserva = async (id) => {
    if (!confirm('¿Cancelar esta reserva? Esta acción no se puede deshacer.')) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminReservas();
        } else {
            alert('No se pudo cancelar la reserva.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

// ── ADMIN: HABITACIONES (por tipo) ───────────────────────────────────────────

var TIPO_LABELS_ADMIN = {
    NORMAL: { label: 'Habitación Normal' },
    DOBLE:  { label: 'Habitación Doble'  },
    SUITE:  { label: 'Suite'             },
    LUJO:   { label: 'Suite de Lujo'     },
};

async function loadAdminHabitaciones() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/habitaciones'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar las habitaciones.</p>'; return; }
    var habitaciones = await res.json();

    // Agrupa por tipo
    var tipos = { NORMAL: [], DOBLE: [], SUITE: [], LUJO: [] };
    habitaciones.forEach(h => {
        if (tipos[h.tipo]) tipos[h.tipo].push(h);
    });

    var tipoOrder = ['NORMAL', 'DOBLE', 'SUITE', 'LUJO'];

    var cardsHtml = tipoOrder.map(tipo => {
        var lista = tipos[tipo];
        var info  = TIPO_LABELS_ADMIN[tipo] || { label: tipo };
        var precio    = lista.length > 0 ? parseFloat(lista[0].precioNoche).toFixed(2) : '—';
        var desc      = lista.length > 0 ? (lista[0].descripcion || '') : '';
        var count     = lista.length;
        var descEsc   = desc.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        var precioVal = lista.length > 0 ? parseFloat(lista[0].precioNoche) : 0;
        var bgImg     = (TIPO_IMAGES[tipo] || [])[0] || '';
        var bgStyle   = bgImg ? `background-image:url('${bgImg}'); background-size:cover; background-position:center;` : '';

        return `
        <div style="position:relative; border-radius:14px; overflow:hidden; min-height:260px; display:flex; flex-direction:column; justify-content:flex-end; ${bgStyle} box-shadow:0 4px 24px rgba(0,0,0,0.35);">
            <!-- Overlay degradado oscuro -->
            <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.92) 100%); border-radius:14px;"></div>
            <!-- Badge cantidad -->
            <div style="position:absolute; top:14px; right:14px; font-size:0.68rem; background:rgba(185,149,77,0.85); color:#0a0a0a; padding:4px 12px; border-radius:20px; letter-spacing:1px; font-weight:700;">
                ${count} hab.
            </div>
            <!-- Contenido inferior -->
            <div style="position:relative; padding:20px 22px 22px;">
                <p style="margin:0 0 2px; font-size:0.6rem; letter-spacing:3px; color:rgba(255,255,255,0.5); text-transform:uppercase;">${tipo}</p>
                <p style="margin:0 0 6px; font-size:1.1rem; color:var(--cream); font-family:'Playfair Display',serif; font-weight:700;">${info.label}</p>
                <p style="margin:0 0 4px; font-size:1.6rem; color:var(--gold); font-weight:700; line-height:1;">${precio} <small style="font-size:0.85rem; color:rgba(255,255,255,0.5); font-weight:400;">€/noche</small></p>
                <p style="margin:0 0 16px; font-size:0.75rem; color:rgba(255,255,255,0.55); min-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${desc || 'Sin descripción'}</p>
                <button class="admin-btn" onclick="abrirModalTipo('${tipo}', ${precioVal}, '${descEsc}')" style="width:100%;">Editar habitación</button>
            </div>
        </div>`;
    }).join('');

    body.innerHTML = `
        <div class="admin-stats-grid">${cardsHtml}</div>

        <!-- Modal editar tipo -->
        <div id="modal-tipo-hab" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:460px; margin:16px;">
                <h3 class="serif mb-1" id="modal-tipo-title" style="color:var(--cream); font-size:1.4rem;"></h3>
                <p style="font-size:0.72rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:24px;">
                    Los cambios se aplicarán a <strong style="color:var(--gold);">todas</strong> las habitaciones de este tipo.
                </p>
                <div class="mb-3">
                    <label class="admin-form-label">Precio / noche (€)</label>
                    <input type="number" id="tipo-precio" class="admin-form-input" step="0.01" min="0" placeholder="Ej: 120.00">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label">Descripción (opcional)</label>
                    <input type="text" id="tipo-descripcion" class="admin-form-input" placeholder="Descripción breve del tipo">
                </div>
                <div id="modal-tipo-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" id="btn-guardar-tipo" onclick="guardarTipoHabitacion()">Guardar cambios</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalTipo()">Cancelar</button>
                </div>
            </div>
        </div>`;
}

var _editTipoActual = null;

window.abrirModalTipo = (tipo, precio, descripcion) => {
    _editTipoActual = tipo;
    var info = TIPO_LABELS_ADMIN[tipo] || { label: tipo, icon: '🏨' };
    document.getElementById('modal-tipo-title').textContent = info.icon + '  ' + info.label;
    document.getElementById('tipo-precio').value      = precio || '';
    document.getElementById('tipo-descripcion').value = descripcion || '';
    document.getElementById('modal-tipo-error').classList.add('d-none');
    var modal = document.getElementById('modal-tipo-hab');
    modal.style.display = 'flex';
};

window.cerrarModalTipo = () => {
    document.getElementById('modal-tipo-hab').style.display = 'none';
};

window.guardarTipoHabitacion = async () => {
    var precio      = document.getElementById('tipo-precio').value;
    var descripcion = document.getElementById('tipo-descripcion').value.trim();
    var errEl       = document.getElementById('modal-tipo-error');
    var btn         = document.getElementById('btn-guardar-tipo');

    if (!precio || parseFloat(precio) <= 0) {
        errEl.textContent = 'El precio es obligatorio y debe ser mayor que 0.';
        errEl.classList.remove('d-none'); return;
    }

    btn.disabled    = true;
    btn.textContent = 'Guardando...';

    try {
        var res = await fetch('/api/habitaciones/tipo/' + _editTipoActual, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ precioNoche: parseFloat(precio), descripcion: descripcion || null }),
        });
        if (res.ok) {
            cerrarModalTipo();
            loadAdminHabitaciones();
        } else if (res.status === 404) {
            errEl.textContent = 'No existe ninguna habitación de ese tipo.';
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = 'Error al guardar. Inténtalo de nuevo.';
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión.';
        errEl.classList.remove('d-none');
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Guardar cambios';
    }
};

// ── ADMIN: SERVICIOS ──────────────────────────────────────────────────────────

async function loadAdminServicios() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/servicios'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar los servicios.</p>'; return; }
    var servicios = await res.json();

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalServicio(null)">+ Nuevo Servicio</button>
        </div>
        <table class="admin-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Precio</th><th></th></tr></thead>
            <tbody>
                ${servicios.map(s => `
                    <tr>
                        <td>${s.id}</td>
                        <td style="color:var(--cream);">${s.nombre}</td>
                        <td style="color:var(--gold);">${parseFloat(s.precio).toFixed(2)} €</td>
                        <td style="white-space:nowrap;">
                            <button class="admin-btn" onclick='abrirModalServicio(${JSON.stringify(s)})'>Editar</button>
                            <button class="admin-btn admin-btn--danger" onclick="adminEliminarServicio(${s.id})">Eliminar</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>

        <!-- Modal servicio -->
        <div id="modal-servicio" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:400px;">
                <h3 class="serif mb-4" id="modal-svc-title" style="color:var(--cream);">Servicio</h3>
                <div class="mb-3">
                    <label class="admin-form-label">Nombre</label>
                    <input type="text" id="svc-nombre" class="admin-form-input" placeholder="Ej: Spa Premium">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label">Precio (€)</label>
                    <input type="number" id="svc-precio" class="admin-form-input" step="0.01" min="0" placeholder="Ej: 45.00">
                </div>
                <div id="modal-svc-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarServicio()">Guardar</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalServicio()">Cancelar</button>
                </div>
            </div>
        </div>`;
}

var _editSvcId = null;

window.abrirModalServicio = (svc) => {
    _editSvcId = svc ? svc.id : null;
    document.getElementById('modal-svc-title').textContent = svc ? 'Editar Servicio' : 'Nuevo Servicio';
    document.getElementById('svc-nombre').value = svc ? svc.nombre : '';
    document.getElementById('svc-precio').value = svc ? svc.precio : '';
    document.getElementById('modal-svc-error').classList.add('d-none');
    var modal = document.getElementById('modal-servicio');
    modal.style.display = 'flex';
};

window.cerrarModalServicio = () => {
    document.getElementById('modal-servicio').style.display = 'none';
};

window.guardarServicio = async () => {
    var nombre = document.getElementById('svc-nombre').value.trim();
    var precio = document.getElementById('svc-precio').value;
    var errEl  = document.getElementById('modal-svc-error');

    if (!nombre || !precio) {
        errEl.textContent = 'Nombre y precio son obligatorios.';
        errEl.classList.remove('d-none'); return;
    }

    var url    = _editSvcId ? '/api/servicios/' + _editSvcId : '/api/servicios';
    var method = _editSvcId ? 'PUT' : 'POST';

    try {
        var res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio: parseFloat(precio) }),
        });
        if (res.ok || res.status === 201) {
            _serviciosCache = null; // invalidar cache
            cerrarModalServicio();
            loadAdminServicios();
        } else if (res.status === 409) {
            errEl.textContent = 'Ya existe un servicio con ese nombre.';
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = 'Error al guardar.';
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión.';
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarServicio = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
        var res = await fetch('/api/servicios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _serviciosCache = null;
            loadAdminServicios();
        } else {
            alert('No se pudo eliminar el servicio.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

// ── ADMIN: ROOM SERVICE ───────────────────────────────────────────────────────

async function loadAdminRoomService() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/room-service/items'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar los ítems.</p>'; return; }
    var items = await res.json();
    _rsItemsCache = null; // invalidar caché del frontend al editar desde admin

    var categorias = ['DESAYUNO','ALMUERZO','CENA','SNACKS','BEBIDAS'];
    var catLabels  = { DESAYUNO:'Desayuno', ALMUERZO:'Almuerzo', CENA:'Cena', SNACKS:'Snacks', BEBIDAS:'Bebidas' };

    var tablasPorCat = categorias.map(cat => {
        var catItems = items.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.7rem;letter-spacing:2px;color:var(--text-muted-custom);margin:18px 0 6px;text-transform:uppercase;">${catLabels[cat]}</p>
            <table class="admin-table">
                <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th>Precio</th><th>Disponible</th><th></th></tr></thead>
                <tbody>
                    ${catItems.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td style="color:var(--cream);">${item.nombre}</td>
                            <td style="color:var(--text-muted-custom);font-size:0.75rem;">${item.descripcion || '—'}</td>
                            <td style="color:var(--gold);">${parseFloat(item.precio).toFixed(2)} €</td>
                            <td>${item.disponible ? '<span class="admin-badge" style="color:#27ae60;">Sí</span>' : '<span class="admin-badge" style="color:#c0392b;">No</span>'}</td>
                            <td style="white-space:nowrap;">
                                <button class="admin-btn" onclick='abrirModalRSItem(${JSON.stringify(item)})'>Editar</button>
                                <button class="admin-btn admin-btn--danger" onclick="adminEliminarRSItem(${item.id})">Eliminar</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }).join('');

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalRSItem(null)">+ Nuevo ítem</button>
        </div>
        ${tablasPorCat || '<p style="color:var(--text-muted-custom);font-size:0.8rem;letter-spacing:1px;margin-top:12px;">No hay ítems en la carta.</p>'}

        <!-- Modal ítem room service -->
        <div id="modal-rs-item" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:#1a1a1a;border:1px solid rgba(185,149,77,0.3);border-radius:12px;padding:32px;width:100%;max-width:460px;margin:16px;max-height:90vh;overflow-y:auto;">
                <h3 class="serif mb-4" id="modal-rsitem-title" style="color:var(--cream);">Ítem Room Service</h3>
                <div class="mb-3">
                    <label class="admin-form-label">Nombre</label>
                    <input type="text" id="rsi-nombre" class="admin-form-input" placeholder="Ej: Hamburguesa gourmet">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label">Descripción (opcional)</label>
                    <input type="text" id="rsi-descripcion" class="admin-form-input" placeholder="Breve descripción del plato">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label">Precio (€)</label>
                    <input type="number" id="rsi-precio" class="admin-form-input" step="0.01" min="0" placeholder="Ej: 12.50">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label">Categoría</label>
                    <select id="rsi-categoria" class="admin-form-input" style="cursor:pointer;">
                        <option value="DESAYUNO">Desayuno</option>
                        <option value="ALMUERZO">Almuerzo</option>
                        <option value="CENA">Cena</option>
                        <option value="SNACKS">Snacks</option>
                        <option value="BEBIDAS">Bebidas</option>
                    </select>
                </div>
                <div class="mb-4" style="display:flex;align-items:center;gap:10px;">
                    <input type="checkbox" id="rsi-disponible" checked style="accent-color:var(--gold);width:16px;height:16px;cursor:pointer;">
                    <label for="rsi-disponible" class="admin-form-label" style="margin:0;cursor:pointer;">Disponible</label>
                </div>
                <div id="modal-rsitem-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarRSItem()">Guardar</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalRSItem()">Cancelar</button>
                </div>
            </div>
        </div>`;
}

var _editRSItemId = null;

window.abrirModalRSItem = (item) => {
    _editRSItemId = item ? item.id : null;
    document.getElementById('modal-rsitem-title').textContent = item ? 'Editar ítem' : 'Nuevo ítem';
    document.getElementById('rsi-nombre').value      = item ? item.nombre      : '';
    document.getElementById('rsi-descripcion').value = item ? (item.descripcion || '') : '';
    document.getElementById('rsi-precio').value      = item ? item.precio      : '';
    document.getElementById('rsi-categoria').value   = item ? item.categoria   : 'SNACKS';
    document.getElementById('rsi-disponible').checked = item ? item.disponible : true;
    document.getElementById('modal-rsitem-error').classList.add('d-none');
    document.getElementById('modal-rs-item').style.display = 'flex';
};

window.cerrarModalRSItem = () => {
    document.getElementById('modal-rs-item').style.display = 'none';
};

window.guardarRSItem = async () => {
    var nombre      = document.getElementById('rsi-nombre').value.trim();
    var descripcion = document.getElementById('rsi-descripcion').value.trim();
    var precio      = document.getElementById('rsi-precio').value;
    var categoria   = document.getElementById('rsi-categoria').value;
    var disponible  = document.getElementById('rsi-disponible').checked;
    var errEl       = document.getElementById('modal-rsitem-error');

    if (!nombre || !precio || parseFloat(precio) <= 0) {
        errEl.textContent = 'Nombre y precio (mayor que 0) son obligatorios.';
        errEl.classList.remove('d-none'); return;
    }

    var url    = _editRSItemId ? '/api/room-service/items/' + _editRSItemId : '/api/room-service/items';
    var method = _editRSItemId ? 'PUT' : 'POST';

    try {
        var res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion: descripcion || null, precio: parseFloat(precio), categoria, disponible }),
        });
        if (res.ok || res.status === 201) {
            _rsItemsCache = null;
            cerrarModalRSItem();
            loadAdminRoomService();
        } else if (res.status === 404) {
            errEl.textContent = 'Ítem no encontrado.';
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = 'Error al guardar.';
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión.';
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarRSItem = async (id) => {
    if (!confirm('¿Eliminar este ítem de la carta?')) return;
    try {
        var res = await fetch('/api/room-service/items/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _rsItemsCache = null;
            loadAdminRoomService();
        } else if (res.status === 409) {
            alert('No se puede eliminar: hay pedidos activos que usan este ítem. Márcalo como no disponible primero.');
        } else {
            alert('No se pudo eliminar el ítem.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

// ── ADMIN: USUARIOS ───────────────────────────────────────────────────────────

async function loadAdminUsuarios() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/admin/usuarios'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar los usuarios.</p>'; return; }
    var usuarios = await res.json();

    body.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr></thead>
            <tbody>
                ${usuarios.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td style="color:var(--cream);">${u.nombre || '—'}</td>
                        <td style="color:var(--text-muted-custom);">${u.email}</td>
                        <td><span class="admin-badge ${u.rol === 'ROLE_ADMIN' ? 'admin-badge--admin' : ''}">${u.rol === 'ROLE_ADMIN' ? 'ADMIN' : 'CLIENTE'}</span></td>
                        <td><button class="admin-btn admin-btn--danger" onclick="adminEliminarUsuario(${u.id})">Eliminar</button></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

window.adminEliminarUsuario = async (id) => {
    if (!confirm('¿Eliminar este usuario? Se cancelarán todas sus reservas.')) return;
    try {
        var res = await fetch('/api/admin/usuarios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminUsuarios();
        } else if (res.status === 400) {
            var data = await res.text();
            alert(data || 'No se puede eliminar este usuario.');
        } else {
            alert('No se pudo eliminar el usuario.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

// ── AUTH MODAL — pendiente de backend ────────────────────────────────────────

function openAuthModal() {
    if (!authModal) authModal = new bootstrap.Modal(document.getElementById('authModal'));
    showAuthTab('login');
    document.getElementById('auth-error').classList.add('d-none');
    authModal.show();
}

window.showAuthTab = (tab) => {
    document.getElementById('form-login').classList.toggle('d-none',    tab !== 'login');
    document.getElementById('form-register').classList.toggle('d-none', tab !== 'register');
    document.getElementById('tab-login').classList.toggle('active',     tab === 'login');
    document.getElementById('tab-register').classList.toggle('active',  tab === 'register');
    document.getElementById('auth-error').classList.add('d-none');
};

function showAuthError(msg) {
    var el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('d-none');
}

window.handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('username', document.getElementById('login-email').value);
    form.append('password', document.getElementById('login-password').value);

    const res = await fetch('/login', { method: 'POST', body: form });

    if (res.ok || res.redirected) {
        window.location.reload();
    } else {
        showAuthError('Email o contraseña incorrectos.');
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const nombre   = document.getElementById('reg-nombre').value;
    const email    = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        if (res.ok) {
            window.location.reload();
        } else {
            const msg = await res.text();
            showAuthError(msg || 'Error al registrarse.');
        }
    } catch (_) {
        showAuthError('Error de conexión.');
    }
};

function logout() {
    localStorage.clear();
    state.token        = null;
    state.user         = null;
    state.pendingRoom  = null;
    state.pendingDates = null;
    // Cerrar sesión en el servidor
    fetch('/logout', { method: 'POST' }).finally(() => window.location.reload());
}

// ── ROOM LIGHTBOX ─────────────────────────────────────────────────────────────

var lbState   = { images: [], index: 0, preloads: [] };
let lbAnimGen = 0;

window.openRoomLightbox = (name, tipo, price) => {
    lbState.images   = TIPO_IMAGES[tipo] || [];
    lbState.index    = 0;
    lbState.preloads = lbState.images.map(src => { var img = new Image(); img.src = src; return img; });
    var lb = document.getElementById('room-lightbox');
    lb.querySelector('.room-lightbox-name').textContent  = name;
    lb.querySelector('.room-lightbox-price').textContent = price + '€ / noche';
    lbRender(false);
    lb.style.display = 'flex';
    requestAnimationFrame(() => lb.classList.add('active'));
};

function lbRender(animate = true) {
    var lb        = document.getElementById('room-lightbox');
    var { images, index } = lbState;
    var imgEl     = lb.querySelector('.room-lightbox-img');
    var nextImgEl = lb.querySelector('.room-lightbox-img-next');

    var updateUI = () => {
        document.getElementById('lb-current').textContent = index + 1;
        document.getElementById('lb-total').textContent   = images.length;
        lb.querySelector('.room-lb-prev').classList.toggle('lb-hidden', images.length <= 1);
        lb.querySelector('.room-lb-next').classList.toggle('lb-hidden', images.length <= 1);
        document.getElementById('lb-dots').innerHTML = images.map((_, i) =>
            `<div class="room-lb-dot ${i === index ? 'active' : ''}" onclick="lbGoTo(${i})"></div>`
        ).join('');
    };

    if (animate) {
        var newSrc = images[index] || '';
        var alt    = lb.querySelector('.room-lightbox-name').textContent;
        var myGen  = ++lbAnimGen;

        nextImgEl.style.transition = 'none';
        nextImgEl.style.opacity    = '0';
        nextImgEl.classList.remove('visible');

        var doTransition = () => {
            if (myGen !== lbAnimGen) return;
            requestAnimationFrame(() => {
                if (myGen !== lbAnimGen) return;
                requestAnimationFrame(() => {
                    if (myGen !== lbAnimGen) return;
                    nextImgEl.style.transition = '';
                    nextImgEl.style.opacity    = '';
                    nextImgEl.classList.add('visible');
                    setTimeout(() => {
                        if (myGen !== lbAnimGen) return;
                        imgEl.src = newSrc;
                        imgEl.alt = alt;
                        var hide = () => {
                            if (myGen !== lbAnimGen) return;
                            nextImgEl.style.transition = 'none';
                            nextImgEl.style.opacity    = '0';
                            nextImgEl.classList.remove('visible');
                            updateUI();
                        };
                        imgEl.decode().then(hide).catch(hide);
                    }, 420);
                });
            });
        };

        nextImgEl.src = newSrc;
        if (nextImgEl.complete && nextImgEl.naturalWidth > 0) {
            doTransition();
        } else {
            nextImgEl.onload  = doTransition;
            nextImgEl.onerror = () => { if (myGen === lbAnimGen) { imgEl.src = newSrc; updateUI(); } };
        }
        updateUI();
    } else {
        imgEl.src = images[index] || '';
        imgEl.alt = lb.querySelector('.room-lightbox-name').textContent;
        updateUI();
    }
}

window.lbNav = (dir) => {
    lbState.index = (lbState.index + dir + lbState.images.length) % lbState.images.length;
    lbRender(true);
};

window.lbGoTo = (i) => {
    if (i === lbState.index) return;
    lbState.index = i;
    lbRender(true);
};

window.closeRoomLightbox = () => {
    var lb = document.getElementById('room-lightbox');
    lb.classList.remove('active');
    setTimeout(() => { lb.style.display = 'none'; }, 350);
};

document.addEventListener('keydown', e => {
    if (e.key === 'Escape')     closeRoomLightbox();
    if (e.key === 'ArrowLeft')  lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
});

// ── SERVICIO DETAIL PAGE ─────────────────────────────────────────────────────

window.openServicioDetail = async function(id) {
    var servicios = await fetchServicios();
    var servicio  = servicios.find(s => s.id === id || s.id === parseInt(id));
    var data      = SERVICIO_DATA[id] || SERVICIO_DATA[parseInt(id)];

    if (!servicio) return;

    var nombre = servicio.nombre;
    var precio = parseFloat(servicio.precio).toFixed(2);
    var slug   = slugify(nombre);

    if (!_suppressHistoryPush) {
        history.pushState({ view: 'servicio', id, slug }, '', '/servicio/' + slug);
    }

    var slidesHtml = '';
    if (data && data.images && data.images.length > 0) {
        slidesHtml = data.images.map(src =>
            `<div class="swiper-slide servicio-detail-slide"><img src="${src}" alt="${nombre}"></div>`
        ).join('');
    } else {
        slidesHtml = `<div class="swiper-slide servicio-detail-slide"><img src="/images/servicio-fallback.jpg" alt="${nombre}"></div>`;
    }

    var descripcion     = data ? data.descripcion    : '';
    var horario         = data ? data.horario        : '–';
    var capacidad       = data ? data.capacidad      : '–';
    var caracteristicas = data && data.caracteristicas
        ? data.caracteristicas.map(c => `<li>✦ ${c}</li>`).join('')
        : '';

    showDynamic(`
        <div class="servicio-detail-page">

            <button class="btn-volver" onclick="backToServicios()">← Volver a Servicios</button>

            <div class="servicio-detail-header">
                <div>
                    <p class="section-label mb-0">Hotel DAW · Nuestros Servicios</p>
                    <h2 class="servicio-detail-titulo serif">${nombre}</h2>
                </div>
                <div class="servicio-detail-precio-badge">
                    <span class="servicio-detail-precio">${precio} €</span>
                    <span class="servicio-detail-precio-label">/ servicio</span>
                </div>
            </div>

            <div class="gold-line mb-4"></div>

            <div class="swiper servicioDetailSwiper servicio-detail-carousel mb-5">
                <div class="swiper-wrapper">${slidesHtml}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>

            <div class="servicio-detail-body">

                <p class="servicio-detail-description">${descripcion}</p>

                <div class="servicio-info-cards">
                    <div class="servicio-info-card">
                        <p class="servicio-info-card-label">HORARIO</p>
                        <p class="servicio-info-card-value">${horario}</p>
                    </div>
                    <div class="servicio-info-card">
                        <p class="servicio-info-card-label">CONDICIONES</p>
                        <p class="servicio-info-card-value">${capacidad}</p>
                    </div>
                </div>

                ${caracteristicas ? `
                <div class="servicio-caracteristicas-section">
                    <p class="servicio-section-label">INCLUYE</p>
                    <ul class="servicio-caracteristicas">${caracteristicas}</ul>
                </div>` : ''}

            </div>
        </div>
    `);

    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    detailSwiper = new Swiper('.servicioDetailSwiper', {
        slidesPerView: 1,
        spaceBetween:  0,
        loop: (data && data.images && data.images.length > 1),
        autoplay: { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination:  { el: '.servicioDetailSwiper .swiper-pagination', clickable: true },
        navigation:  { nextEl: '.servicioDetailSwiper .swiper-button-next', prevEl: '.servicioDetailSwiper .swiper-button-prev' },
    });
};

window.backToServicios = function() {
    history.pushState({ view: 'home' }, '', '/');
    showLanding();
    setTimeout(() => {
        var el = document.getElementById('servicios');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
};

// ── START ─────────────────────────────────────────────────────────────────────
init();
