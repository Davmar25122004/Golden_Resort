// ── AUTH MODAL — pendiente de backend ────────────────────────────────────────

const _docPlaceholders = {
    'DNI':       '12345678A',
    'NIE':       'X1234567A',
    'PASAPORTE': 'ABC123456',
    'TIE':       'X1234567A',
    '':          'Selecciona un tipo primero'
};

window.actualizarPlaceholderDoc = () => {
    const tipo  = document.getElementById('reg-tipo-doc').value;
    const input = document.getElementById('reg-num-doc');
    if (input) {
        input.placeholder = _docPlaceholders[tipo] || '';
        input.value = '';
    }
};

function _inicializarExtrasRegistro() {
    const fechaInput = document.getElementById('reg-fecha-nac');
    if (fechaInput && !fechaInput._flatpickr) {
        flatpickr(fechaInput, Object.assign({}, FP_CONFIG, {
            dateFormat:  'Y-m-d',
            altInput:    true,
            altFormat:   'd/m/Y',
            maxDate:     'today',
            defaultDate: null,
            allowInput:  false,
        }));
    }
}

function abrirModalAuth() {
    if (!authModal) authModal = new bootstrap.Modal(document.getElementById('authModal'));
    mostrarPestanaAuth('login');
    document.getElementById('auth-error').classList.add('d-none');
    authModal.show();
}

window.mostrarPestanaAuth = (tab) => {
    document.getElementById('form-login').classList.toggle('d-none',    tab !== 'login');
    document.getElementById('form-register').classList.toggle('d-none', tab !== 'register');
    var forgotEl = document.getElementById('form-forgot');
    if (forgotEl) forgotEl.classList.toggle('d-none', tab !== 'forgot');
    document.getElementById('tab-login').classList.toggle('active',     tab === 'login');
    document.getElementById('tab-register').classList.toggle('active',  tab === 'register');
    document.getElementById('auth-error').classList.add('d-none');
    if (tab === 'register') _inicializarExtrasRegistro();
    if (tab === 'forgot') {
        var fe = document.getElementById('forgot-email');
        if (fe) fe.value = '';
        var fo = document.getElementById('forgot-ok');
        var ferr = document.getElementById('forgot-err');
        if (fo) fo.classList.add('d-none');
        if (ferr) ferr.classList.add('d-none');
    }
};

window.manejarOlvidePassword = async () => {
    var email = document.getElementById('forgot-email').value.trim();
    var ok = document.getElementById('forgot-ok');
    var err = document.getElementById('forgot-err');
    var btn = document.getElementById('btn-forgot');
    ok.classList.add('d-none'); err.classList.add('d-none');

    if (!email) { err.textContent = 'Introduce tu email.'; err.classList.remove('d-none'); return; }

    btn.disabled = true; btn.textContent = 'Enviando...';
    var controller = new AbortController();
    var timer = setTimeout(() => controller.abort(), 15000);
    try {
        var res = await fetch('/api/auth/reset-password/solicitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            signal: controller.signal
        });
        clearTimeout(timer);
        var data = await res.json();
        if (data.ok) {
            ok.textContent = data.mensaje;
            ok.classList.remove('d-none');
        } else {
            err.textContent = data.mensaje || 'Ha ocurrido un error.';
            err.classList.remove('d-none');
        }
    } catch (_) {
        clearTimeout(timer);
        err.textContent = 'Error de conexión. Inténtalo de nuevo.';
        err.classList.remove('d-none');
    } finally {
        btn.disabled = false; btn.textContent = 'Enviar enlace';
    }
};

function mostrarErrorAuth(msg) {
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
        mostrarErrorAuth('Por favor, introduce un formato de email válido.');
        return;
    }

    const form = new FormData();
    form.append('username', email);
    form.append('password', password);

    const res = await fetch('/login', { method: 'POST', body: form });

    if (res.url && res.url.includes('error')) {
        mostrarErrorAuth('Email o contraseña incorrectos.');
    } else if (res.ok || res.redirected) {
        window.location.href = res.url || '/';
    } else {
        mostrarErrorAuth(t('auth_error_login'));
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const terminosCheck = document.getElementById('reg-terminos');
    if (!terminosCheck || !terminosCheck.checked) {
        mostrarErrorAuth('Debes aceptar la Política de Privacidad y la Política de Cookies para continuar.');
        return;
    }

    const nombreRegex = /^(?=.{2,50}$)[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+(?:-[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)*$/;
    if (!nombreRegex.test(nombre)) {
        mostrarErrorAuth('El nombre solo puede contener letras, espacios o guiones. Mínimo 2 caracteres.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarErrorAuth('Por favor, introduce un formato de email válido.');
        return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
        mostrarErrorAuth('La contraseña debe tener al menos 6 caracteres, una mayúscula y un número.');
        return;
    }

    // ── Documento ────────────────────────────────────────────────────────────
    const tipoDocumento = document.getElementById('reg-tipo-doc').value;
    const numDocumento  = document.getElementById('reg-num-doc').value.trim().toUpperCase();
    if (!tipoDocumento) { mostrarErrorAuth('Selecciona un tipo de documento.'); return; }
    if (!numDocumento)  { mostrarErrorAuth('Introduce tu número de documento.'); return; }

    const NIE_LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE';
    if (tipoDocumento === 'DNI') {
        if (!/^\d{8}[A-Z]$/i.test(numDocumento)) {
            mostrarErrorAuth('El DNI debe tener 8 dígitos seguidos de una letra (ej: 12345678A).'); return;
        }
        const letra = NIE_LETRAS[parseInt(numDocumento.slice(0, 8)) % 23];
        if (numDocumento[8].toUpperCase() !== letra) {
            mostrarErrorAuth('La letra del DNI no es correcta.'); return;
        }
    } else if (tipoDocumento === 'NIE') {
        if (!/^[XYZ]\d{7}[A-Z]$/i.test(numDocumento)) {
            mostrarErrorAuth('El NIE debe tener formato: X/Y/Z + 7 dígitos + letra (ej: X1234567A).'); return;
        }
        const nieNum = numDocumento.replace('X','0').replace('Y','1').replace('Z','2');
        const letraNie = NIE_LETRAS[parseInt(nieNum.slice(0,8)) % 23];
        if (numDocumento[8].toUpperCase() !== letraNie) {
            mostrarErrorAuth('La letra del NIE no es correcta.'); return;
        }
    } else if (tipoDocumento === 'PASAPORTE' || tipoDocumento === 'TIE') {
        if (!/^[A-Z0-9]{6,12}$/i.test(numDocumento)) {
            mostrarErrorAuth('El número de ' + tipoDocumento + ' debe tener entre 6 y 12 caracteres alfanuméricos.'); return;
        }
    }

    // ── Fecha de nacimiento ───────────────────────────────────────────────────
    const fechaNacStr = document.getElementById('reg-fecha-nac').value;
    if (!fechaNacStr) { mostrarErrorAuth('Introduce tu fecha de nacimiento.'); return; }
    const fechaNac = new Date(fechaNacStr);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const m = hoy.getMonth() - fechaNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
    if (edad < 18) {
        mostrarErrorAuth('Debes ser mayor de 18 años para registrarte. Según tu fecha de nacimiento tienes ' + edad + ' años.');
        return;
    }
    if (edad > 120) { mostrarErrorAuth('Introduce una fecha de nacimiento válida.'); return; }

    // ── Teléfono ──────────────────────────────────────────────────────────────
    const telefonoPrefijo = document.getElementById('reg-prefijo').value;
    const telefono = document.getElementById('reg-telefono').value.replace(/[\s\-().]/g, '');
    if (!telefono) { mostrarErrorAuth('Introduce tu número de teléfono.'); return; }
    if (!/^\d{6,15}$/.test(telefono)) {
        mostrarErrorAuth('El número de teléfono solo puede contener dígitos (6–15 cifras).'); return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, tipoDocumento, numDocumento, fechaNacimiento: fechaNacStr, telefonoPrefijo, telefono })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.message === 'CHECK_EMAIL') {
                // Ocultar formulario y mostrar mensaje de verificación pendiente
                document.getElementById('form-register').innerHTML = `
                    <div class="text-center py-3">
                        <div style="font-size:2.5rem">📧</div>
                        <h6 class="mt-2 mb-1" style="color:#c9a96e">¡Revisa tu correo!</h6>
                        <p class="small text-secondary mb-0">
                            Te hemos enviado un enlace de verificación a <strong>${email}</strong>.<br>
                            Haz clic en él para activar tu cuenta.
                        </p>
                    </div>`;
            } else {
                window.location.reload();
            }
        } else {
            const msg = await res.text();
            mostrarErrorAuth(msg || t('auth_error_reg'));
        }
    } catch (_) {
        mostrarErrorAuth(t('auth_error_conn'));
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

