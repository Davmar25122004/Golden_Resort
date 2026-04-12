// ── START ─────────────────────────────────────────────────────────────────────

// Aplicar idioma guardado antes de que la página sea visible
document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('lang-btn--active', btn.dataset.lang === LANG);
});
applyTranslations();

// Inicialización común (sesión, navbar, AOS, flatpickr)
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
    }
});
