// ── START ─────────────────────────────────────────────────────────────────────

// Aplicar traducciones
applyTranslations();

// Inicialización común (sesión, navbar, AOS, flatpickr)
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
