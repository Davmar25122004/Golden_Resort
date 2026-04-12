// ── NAVBAR ────────────────────────────────────────────────────────────────────

function setupNavbarScroll() {
    window.addEventListener('scroll', () => {
        var navbar = document.getElementById('navbar');
        if (window.scrollY > 80) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

window.scrollToSection = (id) => {
    var el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = '/#' + id;
    }
};

window.goHome = () => {
    window.location.href = '/';
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
    var hero = document.getElementById('hero');
    var hab  = document.getElementById('habitaciones');
    var srv  = document.getElementById('servicios');
    var cnt  = document.getElementById('contacto');
    var ftr  = document.querySelector('footer');
    var mc   = document.getElementById('main-content');
    if (hero) hero.style.display = '';
    if (hab)  hab.style.display  = '';
    if (srv)  srv.style.display  = '';
    if (cnt)  cnt.style.display  = '';
    if (ftr)  ftr.style.display  = '';
    if (mc)   mc.style.display   = 'none';
}

function showDynamic(html) {
    var hero = document.getElementById('hero');
    var hab  = document.getElementById('habitaciones');
    var srv  = document.getElementById('servicios');
    var cnt  = document.getElementById('contacto');
    var ftr  = document.querySelector('footer');
    var mc   = document.getElementById('main-content');
    var dv   = document.getElementById('dynamic-view');
    if (hero) hero.style.display = 'none';
    if (hab)  hab.style.display  = 'none';
    if (srv)  srv.style.display  = 'none';
    if (cnt)  cnt.style.display  = 'none';
    if (ftr)  ftr.style.display  = 'none';
    if (mc)   mc.style.display   = 'block';
    if (dv)   dv.innerHTML       = html;
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
            
            var errContainer = document.getElementById('search-error-container');
            var errMsg = document.getElementById('search-error');

            if (!inDate || !outDate) {
                state.searchDates = null;
                sessionStorage.removeItem('searchDates');
                if (errContainer) errContainer.classList.add('d-none');
                showLanding();
                setTimeout(() => document.getElementById('habitaciones').scrollIntoView({ behavior: 'smooth' }), 50);
                await loadRooms();
                return;
            }

            var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(inDate) || !dateRegex.test(outDate)) {
                if (errContainer) errContainer.classList.remove('d-none');
                if (errMsg) errMsg.textContent = 'Formato de fecha inválido (AAAA-MM-DD).';
                return;
            }

            var hoy = new Date(); 
            hoy.setHours(0,0,0,0);
            var dIn = new Date(inDate + 'T00:00:00');
            var dOut = new Date(outDate + 'T00:00:00');

            if (dIn < hoy) {
                if (errContainer) errContainer.classList.remove('d-none');
                if (errMsg) errMsg.textContent = 'La reserva debe ser posterior a hoy.';
                return;
            }

            if (dIn >= dOut) {
                if (errContainer) errContainer.classList.remove('d-none');
                if (errMsg) errMsg.textContent = 'La fecha de entrada no puede ser posterior a la de salida.';
                return;
            }

            if (errContainer) errContainer.classList.add('d-none');
            state.searchDates = { inDate, outDate };
            showLanding();
            setTimeout(() => document.getElementById('habitaciones').scrollIntoView({ behavior: 'smooth' }), 50);
            await loadRooms();
        };
    }
}

// ── COOKIES ───────────────────────────────────────────────────────────────────

function checkCookies() {
    if (!document.cookie.includes('hotelDAW_cookies=')) {
        setTimeout(() => {
            var banner = document.getElementById('cookie-banner');
            if (banner) banner.style.display = 'block';
        }, 1200);
    }
}

window.acceptCookies = (all) => {
    var val = all ? 'all' : 'essential';
    document.cookie = 'hotelDAW_cookies=' + val + '; max-age=' + (60*60*24*365) + '; path=/';
    var banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => banner.style.display = 'none', 400);
    }
};

// ── UTILS ─────────────────────────────────────────────────────────────────────

function calcularEstado(fechaEntrada, fechaSalida) {
    var hoy   = new Date(); hoy.setHours(0,0,0,0);
    var entrada = new Date(fechaEntrada + 'T00:00:00');
    var salida  = new Date(fechaSalida  + 'T00:00:00');
    if (hoy < entrada) return 'PROXIMA';
    if (hoy >= salida) return 'PASADA';
    return 'EN_CURSO';
}

function formatFecha(dateStr) {
    if (!dateStr) return '—';
    var meses = LANG === 'en'
        ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        : ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return parts[2] + ' ' + meses[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

