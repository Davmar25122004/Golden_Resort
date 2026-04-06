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
    const nombre   = document.getElementById('reg-nombre').value;
    const email    = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

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
            showAuthError(msg || 'Error al registrarse.');
        }
    } catch (_) {
        showAuthError('Error de conexión.');
    }
};

function logout() {
    localStorage.clear();
    state.token        = null;
    state.user         = null;
    state.pendingRoom  = null;
    state.pendingDates = null;
    // Cerrar sesión en el servidor
    fetch('/logout', { method: 'POST' }).finally(() => window.location.href = '/');
}

