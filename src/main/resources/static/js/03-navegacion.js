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
    } else if (path === '/mis-reservas') {
        history.replaceState({ view: 'mis-reservas' }, '', path);
        loadRooms();
        loadServicios();
        showMisReservas();
    } else if (path === '/admin') {
        history.replaceState({ view: 'admin' }, '', path);
        loadRooms();
        loadServicios();
        showAdmin();
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
        } else if (ps.view === 'mis-reservas') {
            showMisReservas();
        } else if (ps.view === 'admin') {
            showAdmin();
        }
    });
}

