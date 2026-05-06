// ── INIT ──────────────────────────────────────────────────────────────────────

function init() {
    AOS.init({ duration: 800, once: false });

    if (document.getElementById('in-date'))  flatpickr('#in-date',  { ...FP_CONFIG, onChange: (dates) => { if (!dates.length) { state.searchDates = null; sessionStorage.removeItem('searchDates'); } } });
    if (document.getElementById('out-date')) flatpickr('#out-date', { ...FP_CONFIG, onChange: (dates) => { if (!dates.length) { state.searchDates = null; sessionStorage.removeItem('searchDates'); } } });

    configurarScrollNavbar();
    setupSearch();

    // El navbar y la sesión vienen ya renderizados por el servidor (NavbarAdvice).
    // updateNav() solo sincroniza el state JS y arranca el polling de la campanita.
    actualizarNavbar();
    checkCookies();

    return Promise.resolve();
}

