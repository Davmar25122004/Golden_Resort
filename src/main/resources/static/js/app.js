// Hotel DAW | app.js



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

var state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    pendingRoom: null,
    pendingDates: null,
    searchDates: null,
};

let roomSwiper = null;
let authModal  = null;

// ── FLATPICKR ─────────────────────────────────────────────────────────────────

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

// ── INIT ──────────────────────────────────────────────────────────────────────

async function init() {
    AOS.init({ duration: 800, once: true });
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
    loadRooms();
    loadServicios();
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
        navUser.style.display        = 'inline';
        navUser.textContent          = state.user.email.split('@')[0];
        navMisReservas.style.display = 'inline';
        navAdmin.style.display       = state.user.rol === 'ADMIN' ? 'inline' : 'none';
        if (btnReservarNav) btnReservarNav.style.display = 'inline';
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

// ── HABITACIONES — datos temporales hasta backend ────────────────────────────

async function loadRooms() {
    var wrapper = document.getElementById('rooms-wrapper');
    if (!wrapper) return;

    var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };

    var habitaciones = [
        { tipo: 'NORMAL', precio: 89,  quedan: 3 },
        { tipo: 'DOBLE',  precio: 139, quedan: 2 },
        { tipo: 'SUITE',  precio: 249, quedan: 1 },
        { tipo: 'LUJO',   precio: 399, quedan: 1 },
    ];

    wrapper.innerHTML = '';

    habitaciones.forEach(h => {
        var imgs  = TIPO_IMAGES[h.tipo] || [];
        var thumb = imgs[0] || '';
        var label = tipoLabels[h.tipo] || h.tipo;
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
                        <span style="font-size:0.7rem; letter-spacing:1px; padding:4px 12px; border-radius:20px;
                            ${h.quedan > 0
                                ? 'background:rgba(185,149,77,0.15); color:var(--gold);'
                                : 'background:rgba(139,26,26,0.2); color:#c0392b;'}">
                            ${h.quedan > 0 ? '● Quedan ' + h.quedan : '● Sin disponibilidad'}
                        </span>
                    </div>
                    ${h.quedan > 0
                        ? `<button class="btn-room" onclick="selectRoom(1, '', '')">Reservar</button>`
                        : `<button class="btn-room" disabled style="opacity:0.4; cursor:not-allowed;">No disponible</button>`
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
}

// ── SERVICIOS — placeholder hasta backend ────────────────────────────────────

async function loadServicios() {
    var grid = document.getElementById('servicios-grid');
    if (!grid) return;

    var placeholders = [
        { icon: '🛁', nombre: 'Spa & Bienestar',   desc: 'Relájate en nuestro spa' },
        { icon: '🍳', nombre: 'Desayuno Premium',  desc: 'Buffet de lujo incluido' },
        { icon: '🚗', nombre: 'Servicio de Coche', desc: 'Transfer al aeropuerto' },
        { icon: '🍷', nombre: 'Cena Gourmet',      desc: 'Experiencia gastronómica' },
        { icon: '🏋️', nombre: 'Gimnasio 24h',      desc: 'Equipamiento profesional' },
        { icon: '🌿', nombre: 'Room Service',      desc: 'A cualquier hora' },
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

// ── RESERVAS — pendiente de backend ───────────────────────────────────────────

window.selectRoom = async () => {
    if (!state.token) { openAuthModal(); return; }
    showDynamic(`
        <div class="reserva-form-container" data-aos="fade-up">
            <p class="section-label mb-1">Habitación seleccionada</p>
            <h2 class="serif mb-4" style="color:var(--cream); font-size:2rem;">Confirmar Reserva</h2>
            <div id="reserva-error" class="alert alert-danger mb-3" style="font-size:0.8rem;">
                Reservas pendientes de backend.
            </div>
            <button class="nav-link-custom d-block text-center mt-3 w-100"
                onclick="showLanding(); loadRooms();">← Volver a habitaciones</button>
        </div>
    `);
};

window.showMisReservas = async () => {
    showDynamic(`
        <p class="section-label">Tu historial</p>
        <h2 class="serif mb-5" style="color:var(--cream); font-size:2.5rem;">Mis Reservas</h2>
        <div style="color:var(--text-muted-custom); font-size:0.85rem; letter-spacing:1px;">
            Pendiente de backend.
        </div>
    `);
};

window.showAdmin = async () => {
    showDynamic(`
        <p class="section-label">Panel de Control</p>
        <h2 class="serif mb-5" style="color:var(--cream); font-size:2.5rem;">Administración</h2>
        <div style="color:var(--text-muted-custom); font-size:0.85rem; letter-spacing:1px;">
            Pendiente de backend.
        </div>
    `);
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
    showAuthError('Registro pendiente de backend.');
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

// ── START ─────────────────────────────────────────────────────────────────────
init();
