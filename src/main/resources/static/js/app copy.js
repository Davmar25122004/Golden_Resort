// Hotel DAW | app.js
// ✓ = Funciona ya    ✗ = Necesita backend

// ⚠️ API_BASE apunta al backend de Spring Boot.
// Todo lo que use esta variable (fetch calls) NO funcionará hasta que:
//   1. El compañero del CRUD cree los endpoints de habitaciones, reservas y servicios
//   2. El compañero de Roles cree los endpoints de autenticación (login/registro)
// Los bloques que dependen de esto están comentados con /* TODO */ a lo largo del archivo.
var API_BASE = '/api';

// Imágenes locales por tipo de habitación ✓
var TIPO_IMAGES = {
    NORMAL: [
        '/images/normal-1.png',
        '/images/normal-2.png',
        '/images/normal-3.png',
        '/images/normal-4.png',
    ],
    DOBLE: [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
        'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&q=80',
    ],
    SUITE: [
        '/images/suite-1.png',
        '/images/suite-2.png',
        '/images/suite-3.png',
    ],
    LUJO: [
        '/images/Lujo_1.png',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80',
        '/images/Lujo-3.png',
    ],
};

// Estado de la aplicación ✓
var state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    pendingRoom: null,
    pendingDates: null,
    searchDates: null,
};

let roomSwiper = null;
let authModal  = null;

// ── INIT ──────────────────────────────────────────────────────────────────────
// ✓ AOS, flatpickr, navbar, búsqueda, nav
// ✗ loadRooms y loadServicios esperan backend

function initFancyMonthDropdown(instance) {
    var select = instance.calendarContainer.querySelector('.flatpickr-monthDropdown-months');
    if (!select || select.dataset.replaced) return;
    select.dataset.replaced = '1';
    select.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';

    var months = Array.from(select.options).map(o => o.text);

    var btn = document.createElement('span');
    btn.className = 'fp-month-btn';
    btn.textContent = months[instance.currentMonth] + ' ▾';

    var list = document.createElement('div');
    list.className = 'fp-month-list';
    list.style.cssText = 'display:none;position:fixed;z-index:999999;';
    list.innerHTML = months.map((m, i) =>
        `<div class="fp-month-item${i === instance.currentMonth ? ' active' : ''}" data-month="${i}">${m}</div>`
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
        var month = parseInt(item.dataset.month);
        instance.changeMonth(month - instance.currentMonth);
        list.style.display = 'none';
    });

    document.addEventListener('click', () => { list.style.display = 'none'; });
    select.parentNode.insertBefore(wrap, select);
}

function syncFancyMonth(instance) {
    var wrap = instance.calendarContainer.querySelector('.fp-month-wrap');
    if (!wrap) return;
    var select = instance.calendarContainer.querySelector('.flatpickr-monthDropdown-months');
    var months = Array.from(select.options).map(o => o.text);
    wrap.querySelector('.fp-month-btn').textContent = months[instance.currentMonth] + ' ▾';
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

function init() {
    AOS.init({ duration: 800, once: true });
    flatpickr('#in-date', FP_CONFIG);
    flatpickr('#out-date', FP_CONFIG);
    setupNavbarScroll();   // ✓
    setupSearch();         // ✓ UI — la búsqueda llama a loadRooms (✗ hasta backend)
    updateNav();           // ✓
    loadRooms();           // ✗ Necesita GET /api/habitaciones
    loadServicios();       // ✗ Con token: GET /api/servicios | Sin token: placeholder ✓
}

// ── NAVBAR ✓ ──────────────────────────────────────────────────────────────────

function setupNavbarScroll() {
    window.addEventListener('scroll', () => {
        var navbar = document.getElementById('navbar');
        if (window.scrollY > 80) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

window.scrollToSection = (id) => {
    showLanding();
    setTimeout(() => {
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
};

window.goHome = () => {
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
        navUser.style.display = 'inline';
        navUser.textContent   = state.user.email.split('@')[0];
        navMisReservas.style.display = 'inline';
        navAdmin.style.display = state.user.rol === 'ADMIN' ? 'inline' : 'none';
        if (btnReservarNav) btnReservarNav.style.display = 'inline';
    } else {
        btnAuth.textContent = 'Iniciar Sesión';
        btnAuth.onclick     = openAuthModal;
        navUser.style.display      = 'none';
        navMisReservas.style.display = 'none';
        navAdmin.style.display     = 'none';
        if (btnReservarNav) btnReservarNav.style.display = 'none';
    }
}

// ── VISTAS ✓ ──────────────────────────────────────────────────────────────────

function showLanding() {
    document.getElementById('hero').style.display          = '';
    document.getElementById('habitaciones').style.display  = '';
    document.getElementById('servicios').style.display     = '';
    document.getElementById('contacto').style.display      = '';
    document.querySelector('footer').style.display         = '';
    document.getElementById('main-content').style.display  = 'none';
}

function showDynamic(html) {
    document.getElementById('hero').style.display          = 'none';
    document.getElementById('habitaciones').style.display  = 'none';
    document.getElementById('servicios').style.display     = 'none';
    document.getElementById('contacto').style.display      = 'none';
    document.querySelector('footer').style.display         = 'none';
    document.getElementById('main-content').style.display  = 'block';
    document.getElementById('dynamic-view').innerHTML      = html;
    window.scrollTo({ top: 0 });
}

// ── SEARCH ✓ (UI) ─────────────────────────────────────────────────────────────

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
            await loadRooms(inDate, outDate); // ✗ Necesita backend
        };
    }
}

// ── HABITACIONES ✗ ───────────────────────────────────────────────────────────
// Necesita: GET /api/habitaciones
//           GET /api/habitaciones/disponibles?entrada=YYYY-MM-DD&salida=YYYY-MM-DD

async function loadRooms(inDate = null, outDate = null) {
    var wrapper = document.getElementById('rooms-wrapper');
    var noMsg   = document.getElementById('no-rooms-msg');
    if (!wrapper) return;

    // TODO: Descomentar cuando el backend esté listo
    wrapper.innerHTML = `
        <div style="color:var(--text-muted-custom); padding:40px; text-align:center;
                    font-size:0.8rem; letter-spacing:2px; width:100%;">
            HABITACIONES — PENDIENTE DE BACKEND
        </div>`;

    /*
    wrapper.innerHTML = '<div style="color:var(--text-muted-custom); padding:40px; text-align:center; font-size:0.8rem; letter-spacing:2px;">CARGANDO...</div>';

    var today    = new Date().toISOString().split('T')[0];
    var tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    var checkIn  = inDate  || today;
    var checkOut = outDate || tomorrow;

    try {
        var [allResp, availResp] = await Promise.all([
            fetch(`${API_BASE}/habitaciones`),
            fetch(`${API_BASE}/habitaciones/disponibles?entrada=${checkIn}&salida=${checkOut}`)
        ]);

        var allRooms   = await allResp.json();
        var availRooms = await availResp.json();

        var byType = {};
        allRooms.forEach(r => {
            if (!byType[r.tipo]) byType[r.tipo] = { total: 0, precio: r.precioNoche, available: [] };
            byType[r.tipo].total++;
        });
        availRooms.forEach(r => {
            if (byType[r.tipo]) byType[r.tipo].available.push(r.id);
        });

        wrapper.innerHTML = '';
        noMsg.style.display = 'none';

        var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };

        Object.entries(byType).forEach(([tipo, data]) => {
            var quedan       = data.available.length;
            var firstAvailId = data.available[0] || null;
            var imgs         = TIPO_IMAGES[tipo] || [];
            var thumb        = imgs[0] || '';
            var label        = tipoLabels[tipo] || tipo;
            var slide        = document.createElement('div');
            slide.className  = 'swiper-slide';
            slide.innerHTML  = `
                <div class="room-card">
                    <div class="room-card-img" onclick="openRoomLightbox('${label}', '${tipo}', ${data.precio})">
                        <img src="${thumb}" alt="${label}" loading="lazy">
                        <div class="room-img-overlay"><span class="room-img-overlay-text">Ver fotos</span></div>
                    </div>
                    <div class="room-card-body">
                        <p class="room-type-badge">${tipo}</p>
                        <h3 class="room-name serif">${tipoLabels[tipo] || tipo}</h3>
                        <p class="room-price">${data.precio}€ <small>/ noche</small></p>
                        <div style="margin-bottom:12px;">
                            <span style="font-size:0.7rem; letter-spacing:1px; padding:4px 12px; border-radius:20px;
                                ${quedan > 0
                                    ? 'background:rgba(185,149,77,0.15); color:var(--gold);'
                                    : 'background:rgba(139,26,26,0.2); color:#c0392b;'}">
                                ${quedan > 0 ? '● Quedan ' + quedan : '● Sin disponibilidad'}
                            </span>
                        </div>
                        ${quedan > 0
                            ? '<button class="btn-room" onclick="selectRoom(' + firstAvailId + ', \'' + checkIn + '\', \'' + checkOut + '\')">Reservar</button>'
                            : '<button class="btn-room" disabled style="opacity:0.4; cursor:not-allowed;">No disponible</button>'
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
            pagination:  { el: '.swiper-pagination', clickable: true },
            navigation:  { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        });

    } catch (err) {
        wrapper.innerHTML = '<div style="color:#8B1A1A; padding:40px; text-align:center;">Error al cargar habitaciones.</div>';
    }
    */
}

// ── SERVICIOS ─────────────────────────────────────────────────────────────────
// ✓ Placeholder visible sin backend
// ✗ Datos reales: GET /api/servicios (requiere token)

async function loadServicios() {
    var grid  = document.getElementById('servicios-grid');
    if (!grid) return;

    var icons = ['🛁', '🍳', '🚗', '🧖', '🏋️', '🍷', '🌿', '📶'];

    // TODO: Descomentar cuando el backend y la auth estén listos
    /*
    if (state.token) {
        try {
            var resp = await fetch(`${API_BASE}/servicios`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            if (resp.ok) {
                var servicios = await resp.json();
                grid.innerHTML = servicios.map((s, i) => `
                    <div class="col-md-4 col-sm-6" data-aos="fade-up" data-aos-delay="${i * 80}">
                        <div class="servicio-card">
                            <div class="servicio-icon">${icons[i % icons.length]}</div>
                            <h4 class="servicio-name serif">${s.nombre}</h4>
                            <p class="servicio-price">Desde ${s.precio}€</p>
                        </div>
                    </div>
                `).join('');
                AOS.refresh();
                return;
            }
        } catch (_) {}
    }
    */

    // Placeholder sin auth ✓
    var placeholders = [
        { icon: '🛁', nombre: 'Spa & Bienestar',    desc: 'Relájate en nuestro spa' },
        { icon: '🍳', nombre: 'Desayuno Premium',   desc: 'Buffet de lujo incluido' },
        { icon: '🚗', nombre: 'Servicio de Coche',  desc: 'Transfer al aeropuerto' },
        { icon: '🍷', nombre: 'Cena Gourmet',       desc: 'Experiencia gastronómica' },
        { icon: '🏋️', nombre: 'Gimnasio 24h',       desc: 'Equipamiento profesional' },
        { icon: '🌿', nombre: 'Room Service',       desc: 'A cualquier hora' },
    ];
    grid.innerHTML = placeholders.map((s, i) => `
        <div class="col-md-4 col-sm-6" data-aos="fade-up" data-aos-delay="${i * 80}">
            <div class="servicio-card">
                <div class="servicio-icon">${s.icon}</div>
                <h4 class="servicio-name serif">${s.nombre}</h4>
                <p class="servicio-price" style="color:var(--text-muted-custom); font-size:0.8rem;">${s.desc}</p>
            </div>
        </div>
    `).join('');
    AOS.refresh();
}

// ── RESERVA ✗ ─────────────────────────────────────────────────────────────────
// Necesita: GET /api/servicios (token)
//           POST /api/reservas

window.selectRoom = async (roomId, inDate, outDate) => {
    if (!state.token) {
        state.pendingRoom  = roomId;
        state.pendingDates = { inDate, outDate };
        openAuthModal();
        return;
    }

    // TODO: Descomentar cuando GET /api/servicios esté listo
    /*
    let servicios = [];
    try {
        var resp = await fetch(`${API_BASE}/servicios`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (resp.ok) servicios = await resp.json();
    } catch (_) {}
    */
    let servicios = []; // placeholder hasta que haya backend

    var fechaEntrada = inDate  || state.searchDates?.inDate  || '';
    var fechaSalida  = outDate || state.searchDates?.outDate || '';

    showDynamic(`
        <div class="reserva-form-container" data-aos="fade-up">
            <p class="section-label mb-1">Habitación seleccionada</p>
            <h2 class="serif mb-4" style="color:var(--cream); font-size:2rem;">Confirmar Reserva</h2>

            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <label class="contact-label">Fecha de Entrada</label>
                    <input type="date" id="confirm-in" class="form-control-dark" value="${fechaEntrada}" required>
                </div>
                <div class="col-md-6">
                    <label class="contact-label">Fecha de Salida</label>
                    <input type="date" id="confirm-out" class="form-control-dark" value="${fechaSalida}" required>
                </div>
            </div>

            ${servicios.length > 0 ? `
            <p class="contact-label mb-3">Servicios Adicionales</p>
            <div id="servicios-select" class="mb-4">
                ${servicios.map(s => `
                    <div class="servicio-select-item">
                        <div>
                            <div style="color:var(--cream); font-size:0.9rem;">${s.nombre}</div>
                            <div style="color:var(--gold); font-size:0.8rem;">${s.precio}€ / unidad</div>
                        </div>
                        <input type="number" class="qty-input" id="srv-${s.id}" min="0" value="0">
                    </div>
                `).join('')}
            </div>` : ''}

            <div id="reserva-error" class="alert alert-danger d-none mb-3" style="font-size:0.8rem;"></div>

            <button class="btn-reservar w-100" style="padding:16px; font-size:0.75rem;"
                onclick="confirmBooking(${roomId})">
                Finalizar Reserva
            </button>
            <button class="nav-link-custom d-block text-center mt-3 w-100"
                onclick="showLanding(); loadRooms();">
                ← Volver a habitaciones
            </button>
        </div>
    `);
    AOS.refresh();
    flatpickr('#confirm-in', FP_CONFIG);
    flatpickr('#confirm-out', FP_CONFIG);
};

window.confirmBooking = async (roomId) => {
    var inDate  = document.getElementById('confirm-in').value;
    var outDate = document.getElementById('confirm-out').value;
    var errorEl = document.getElementById('reserva-error');

    if (!inDate || !outDate) {
        errorEl.textContent = 'Por favor selecciona las fechas de entrada y salida.';
        errorEl.classList.remove('d-none');
        return;
    }

    var servicios = Array.from(document.querySelectorAll('[id^=srv-]'))
        .filter(i => parseInt(i.value) > 0)
        .map(i => ({ servicioId: parseInt(i.id.replace('srv-', '')), cantidad: parseInt(i.value) }));

    // TODO: Descomentar cuando POST /api/reservas esté listo
    /*
    try {
        var resp = await fetch(`${API_BASE}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
            body: JSON.stringify({ habitacionId: roomId, fechaEntrada: inDate, fechaSalida: outDate, servicios })
        });

        if (resp.ok) {
            var data = await resp.json();
            state.pendingRoom  = null;
            state.pendingDates = null;
            showMisReservas();
            setTimeout(() => alert(`✓ Reserva confirmada. Total: ${data.precioTotal}€`), 300);
        } else {
            var err = await resp.json().catch(() => ({}));
            errorEl.textContent = err.message || err.error || 'No se pudo crear la reserva.';
            errorEl.classList.remove('d-none');
        }
    } catch (_) {
        errorEl.textContent = 'Error de conexión. Inténtalo de nuevo.';
        errorEl.classList.remove('d-none');
    }
    */
    errorEl.textContent = 'Reservas pendientes de backend (POST /api/reservas).';
    errorEl.classList.remove('d-none');
};

// ── MIS RESERVAS ✗ ────────────────────────────────────────────────────────────
// Necesita: GET /api/reservas/me (token)

window.showMisReservas = async () => {
    // TODO: Descomentar cuando GET /api/reservas/me esté listo
    /*
    showDynamic('<div class="text-center py-5" style="color:var(--text-muted-custom); letter-spacing:2px; font-size:0.75rem;">CARGANDO...</div>');
    try {
        var resp = await fetch(`${API_BASE}/reservas/me`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        var reservas = await resp.json();
        // ... render reservas
    } catch (_) {
        showDynamic('<div style="color:#8B1A1A;">Error al cargar reservas.</div>');
    }
    */
    showDynamic(`
        <p class="section-label">Tu historial</p>
        <h2 class="serif mb-5" style="color:var(--cream); font-size:2.5rem;">Mis Reservas</h2>
        <div style="color:var(--text-muted-custom); font-size:0.85rem; letter-spacing:1px;">
            Pendiente de backend — GET /api/reservas/me
        </div>
    `);
};

window.cancelBooking = async (id, isAdmin = false) => {
    if (!confirm('¿Cancelar esta reserva?')) return;

    // TODO: Descomentar cuando DELETE /api/reservas/{id} esté listo
    /*
    try {
        var resp = await fetch(`${API_BASE}/reservas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (resp.ok) isAdmin ? showAdmin() : showMisReservas();
        else alert('No se pudo cancelar la reserva.');
    } catch (_) { alert('Error de conexión.'); }
    */
    alert('Cancelación pendiente de backend — DELETE /api/reservas/' + id);
};

window.openModifyFechas = (id) => {
    document.getElementById(`modify-form-${id}`).style.display = 'block';
    flatpickr(`#mod-in-${id}`,  FP_CONFIG);
    flatpickr(`#mod-out-${id}`, FP_CONFIG);
};

window.closeModifyFechas = (id) => {
    document.getElementById(`modify-form-${id}`).style.display = 'none';
};

window.saveModifyFechas = async (id) => {
    var fechaEntrada = document.getElementById(`mod-in-${id}`).value;
    var fechaSalida  = document.getElementById(`mod-out-${id}`).value;
    var errorEl      = document.getElementById(`modify-error-${id}`);
    errorEl.classList.add('d-none');

    if (!fechaEntrada || !fechaSalida) {
        errorEl.textContent = 'Selecciona ambas fechas.';
        errorEl.classList.remove('d-none');
        return;
    }

    // TODO: Descomentar cuando PUT /api/reservas/{id}/fechas esté listo
    /*
    try {
        var resp = await fetch(`${API_BASE}/reservas/${id}/fechas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
            body: JSON.stringify({ fechaEntrada, fechaSalida })
        });
        if (resp.ok) {
            showMisReservas();
        } else {
            var err = await resp.json().catch(() => ({}));
            errorEl.textContent = err.message || err.error || 'No se pudo modificar la reserva.';
            errorEl.classList.remove('d-none');
        }
    } catch (_) {
        errorEl.textContent = 'Error de conexión.';
        errorEl.classList.remove('d-none');
    }
    */
    errorEl.textContent = 'Modificación pendiente de backend — PUT /api/reservas/' + id + '/fechas';
    errorEl.classList.remove('d-none');
};

// ── ADMIN ✗ ───────────────────────────────────────────────────────────────────
// Necesita: GET /api/reservas (token ADMIN)

window.showAdmin = async () => {
    // TODO: Descomentar cuando GET /api/reservas (admin) esté listo
    /*
    showDynamic('<div class="text-center py-5" style="color:var(--text-muted-custom); letter-spacing:2px; font-size:0.75rem;">CARGANDO...</div>');
    try {
        var resp = await fetch(`${API_BASE}/reservas`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        var reservas = await resp.json();
        // ... render tabla admin
    } catch (_) {
        showDynamic('<div style="color:#8B1A1A;">Error al cargar datos de administración.</div>');
    }
    */
    showDynamic(`
        <p class="section-label">Panel de Control</p>
        <h2 class="serif mb-5" style="color:var(--cream); font-size:2.5rem;">Administración</h2>
        <div style="color:var(--text-muted-custom); font-size:0.85rem; letter-spacing:1px;">
            Pendiente de backend — GET /api/reservas (rol ADMIN)
        </div>
    `);
};

// ── AUTH MODAL ✓ (UI) / ✗ (fetch) ────────────────────────────────────────────
// Necesita: POST /api/auth/login
//           POST /api/auth/registro

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

function saveSession(token) {
    var payload  = JSON.parse(atob(token.split('.')[1]));
    state.token  = token;
    state.user   = { email: payload.sub, rol: payload.rol };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(state.user));
}

window.handleLogin = async (e) => {
    e.preventDefault();
    var email    = document.getElementById('login-email').value;
    var password = document.getElementById('login-password').value;

    // TODO: Descomentar cuando POST /api/auth/login esté listo
    /*
    try {
        var resp = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (resp.ok) {
            var { token } = await resp.json();
            saveSession(token);
            authModal.hide();
            updateNav();
            loadServicios();
            resumePendingBooking();
        } else {
            showAuthError('Credenciales inválidas. Comprueba tu email y contraseña.');
        }
    } catch (_) {
        showAuthError('Error de conexión. Inténtalo de nuevo.');
    }
    */
    showAuthError('Login pendiente de backend — POST /api/auth/login');
};

window.handleRegister = async (e) => {
    e.preventDefault();
    var nombre   = document.getElementById('reg-nombre').value;
    var email    = document.getElementById('reg-email').value;
    var password = document.getElementById('reg-password').value;

    // TODO: Descomentar cuando POST /api/auth/registro esté listo
    /*
    try {
        var resp = await fetch(`${API_BASE}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });
        if (resp.ok) {
            var { token } = await resp.json();
            saveSession(token);
            authModal.hide();
            updateNav();
            loadServicios();
            resumePendingBooking();
        } else {
            var data = await resp.json().catch(() => ({}));
            showAuthError(data.error || 'No se pudo completar el registro.');
        }
    } catch (_) {
        showAuthError('Error de conexión. Inténtalo de nuevo.');
    }
    */
    showAuthError('Registro pendiente de backend — POST /api/auth/registro');
};

function resumePendingBooking() {
    if (state.pendingRoom) {
        var { inDate, outDate } = state.pendingDates || {};
        selectRoom(state.pendingRoom, inDate || '', outDate || '');
    }
}

function logout() {
    localStorage.clear();
    state.token        = null;
    state.user         = null;
    state.pendingRoom  = null;
    state.pendingDates = null;
    updateNav();
    showLanding();
    loadServicios();
}

// ── ROOM LIGHTBOX ✓ ───────────────────────────────────────────────────────────

var lbState  = { images: [], index: 0, preloads: [] };
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

// ── START ✓ ───────────────────────────────────────────────────────────────────
init();
