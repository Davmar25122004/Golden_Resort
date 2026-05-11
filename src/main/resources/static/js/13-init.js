// ── START ─────────────────────────────────────────────────────────────────────

// Aplicar traducciones
applyTranslations();

// ── DRAWER LATERAL MÓVIL ───────────────────────────────────────────────────────
(function() {
    var toggler  = document.querySelector('.navbar-toggler[data-bs-target="#navCollapse"]');
    var drawer   = document.getElementById('navCollapse');
    var backdrop = document.getElementById('nav-drawer-backdrop');
    if (!toggler || !drawer) return;

    function openDrawer() {
        drawer.classList.add('nav-drawer-open');
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        drawer.classList.remove('nav-drawer-open');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
    function isMobile() { return window.innerWidth < 768; }

    // Interceptar click del toggler en fase de captura (antes que Bootstrap)
    toggler.addEventListener('click', function(e) {
        if (!isMobile()) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        drawer.classList.contains('nav-drawer-open') ? closeDrawer() : openDrawer();
    }, true);

    // Cerrar al pulsar el backdrop
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // Cerrar al pulsar cualquier item del menú en móvil
    drawer.addEventListener('click', function(e) {
        if (!isMobile()) return;
        if (e.target.closest('.nav-dropdown-item')) closeDrawer();
    });

    // En resize a desktop, limpiar estado
    window.addEventListener('resize', function() {
        if (!isMobile()) { closeDrawer(); document.body.style.overflow = ''; }
    });
})();

// En móvil: cerrar el navbar collapse al hacer clic en cualquier item del menú
document.querySelectorAll('#navCollapse .nav-dropdown-item').forEach(function(item) {
    item.addEventListener('click', function() {
        var collapse = document.getElementById('navCollapse');
        if (collapse && collapse.classList.contains('show')) {
            var bsCollapse = bootstrap.Collapse.getInstance(collapse);
            if (bsCollapse) bsCollapse.hide();
        }
    });
});
// Desktop: cerrar dropdown al clicar un item (evita que quede "pillado")
document.querySelectorAll('.nav-dropdown-item').forEach(function(item) {
    item.addEventListener('click', function() {
        var dd = item.closest('.nav-dropdown');
        if (dd) {
            dd.classList.add('nav-dropdown--closing');
            setTimeout(function() { dd.classList.remove('nav-dropdown--closing'); }, 300);
        }
    });
});
// Admin navbar: cerrar collapse al clicar un item
document.querySelectorAll('#adminNavCollapse .nav-dropdown-item').forEach(function(item) {
    item.addEventListener('click', function() {
        var el = document.getElementById('adminNavCollapse');
        if (el) el.classList.remove('admin-nav-open');
    });
});

init().then(() => {
    // Restaurar searchDates desde sessionStorage (solo si NO estamos en la home)
    var _path = window.location.pathname;
    if (_path === '/' || _path === '') {
        state.searchDates = null;
        sessionStorage.removeItem('searchDates');
    } else {
        var _sd = sessionStorage.getItem('searchDates');
        if (_sd) { try { state.searchDates = JSON.parse(_sd); } catch(_) {} }
    }

    // Inyectar sidebar admin en todas las páginas
    if (typeof asbInjectOnPage === 'function') {
        asbInjectOnPage();
    }

    // Page-specific init según la ruta actual
    var _path = window.location.pathname;

    if (_path === '/' || _path === '') {
        loadRooms();
        loadServicios();
    } else if (_path.startsWith('/habitacion/')) {
        var tipo = decodeURIComponent(_path.split('/')[2]);
        loadAndShowRoom(tipo);
    } else if (_path.startsWith('/servicio/')) {
        var slug = decodeURIComponent(_path.split('/')[2]);
        loadAndShowServicio(slug);
    } else if (_path === '/mis-reservas') {
        showMisReservas();
    } else if (_path === '/admin') {
        showAdmin();
    } else if (_path === '/perfil') {
        showPerfil();
    } else if (_path === '/peticiones') {
        peticionesInit();
    }
});
