// ── INIT ──────────────────────────────────────────────────────────────────────

async function init() {
    AOS.init({ duration: 800, once: false });

    if (document.getElementById('in-date'))  flatpickr('#in-date',  { ...FP_CONFIG, onChange: (dates) => { if (!dates.length) { state.searchDates = null; sessionStorage.removeItem('searchDates'); } } });
    if (document.getElementById('out-date')) flatpickr('#out-date', { ...FP_CONFIG, onChange: (dates) => { if (!dates.length) { state.searchDates = null; sessionStorage.removeItem('searchDates'); } } });

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
    checkCookies();
}

