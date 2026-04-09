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
        btnAuth.textContent = t('nav_signout');
        btnAuth.onclick     = logout;
        navUser.style.display        = 'inline';
        navUser.textContent          = state.user.email.split('@')[0];
        navMisReservas.style.display = state.user.rol === 'ADMIN' ? 'none' : 'inline';
        navAdmin.style.display       = state.user.rol === 'ADMIN' ? 'inline' : 'none';
        if (btnReservarNav) btnReservarNav.style.display = state.user.rol === 'ADMIN' ? 'none' : 'inline';
    } else {
        btnAuth.textContent = t('nav_signin');
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

