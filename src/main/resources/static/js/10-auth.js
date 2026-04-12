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
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAuthError('Por favor, introduce un formato de email válido.');
        return;
    }

    const form = new FormData();
    form.append('username', email);
    form.append('password', password);

    const res = await fetch('/login', { method: 'POST', body: form });

    if (res.url && res.url.includes('error')) {
        showAuthError('Email o contraseña incorrectos.');
    } else if (res.ok || res.redirected) {
        window.location.reload();
    } else {
        showAuthError(t('auth_error_login'));
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const nombreRegex = /^(?=.{2,50}$)[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+(?:-[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)*$/;
    if (!nombreRegex.test(nombre)) {
        showAuthError('El nombre solo puede contener letras, espacios o guiones. Mínimo 2 caracteres.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAuthError('Por favor, introduce un formato de email válido.');
        return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
        showAuthError('La contraseña debe tener al menos 6 caracteres, una mayúscula y un número.');
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        if (res.ok) {
            window.location.reload();
        } else {
            const msg = await res.text();
            showAuthError(msg || t('auth_error_reg'));
        }
    } catch (_) {
        showAuthError(t('auth_error_conn'));
    }
};

function logout() {
    var savedLang = localStorage.getItem('lang');
    localStorage.clear();
    if (savedLang) localStorage.setItem('lang', savedLang);
    state.token        = null;
    state.user         = null;
    state.pendingRoom  = null;
    state.pendingDates = null;
    // Cerrar sesión en el servidor
    fetch('/logout', { method: 'POST' }).finally(() => window.location.href = '/');
}

