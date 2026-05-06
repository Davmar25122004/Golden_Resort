// ── ALTA DE NUEVO EMPLEADO ─────────────────────────────────────────────────

var _nempTab = 'datos';
var _nempFpInstances = [];

window.openNuevoEmpleadoModal = function () {
    _nempTab = 'datos';
    var old = document.getElementById('nemp-overlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'nemp-overlay';
    overlay.style.cssText = [
        'position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:9000;',
        'display:flex;align-items:center;justify-content:center;padding:16px;'
    ].join('');
    overlay.innerHTML = _nempBuildHtml();
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeNuevoEmpleadoModal();
    });

    fetch('/api/admin/roles')
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(roles) {
            var sel = document.getElementById('nemp-rol');
            if (!sel) return;
            roles
                .filter(function(r) { return r.name !== 'ROLE_CLIENTE'; })
                .sort(function(a, b) { return a.name.localeCompare(b.name); })
                .forEach(function(r) {
                    var opt = document.createElement('option');
                    opt.value = r.name;
                    var clean = r.name.replace(/^ROLE_/, '');
                    opt.textContent = clean.charAt(0) + clean.slice(1).toLowerCase();
                    sel.appendChild(opt);
                });
        })
        .catch(function() {});

    _nempShowTab('datos');

    // Inicializar flatpickr en los campos de fecha
    _nempFpInstances.forEach(function (fp) { try { fp.destroy(); } catch (_) {} });
    _nempFpInstances = [];
    var fpCfg = Object.assign({}, FP_CONFIG, {
        dateFormat: 'Y-m-d',
        altInput:   true,
        altFormat:  'd/m/Y',
    });
    ['nemp-fechaNac', 'nemp-fechaCont'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el || !window.flatpickr) return;
        var fp = flatpickr(el, fpCfg);
        if (fp && fp.altInput) {
            fp.altInput.style.cssText = _nempInputStyle + 'cursor:pointer;';
            fp.altInput.onfocus = function () { this.style.borderColor = 'rgba(201,168,76,0.5)'; };
            fp.altInput.onblur  = function () { this.style.borderColor = 'rgba(255,255,255,0.12)'; };
        }
        _nempFpInstances.push(fp);
    });
};

window.closeNuevoEmpleadoModal = function () {
    _nempFpInstances.forEach(function (fp) { try { fp.destroy(); } catch (_) {} });
    _nempFpInstances = [];
    var el = document.getElementById('nemp-overlay');
    if (el) el.remove();
};

function _nempBuildHtml() {
    return (
        '<div style="background:#13181f;border:1px solid rgba(201,168,76,0.22);border-radius:12px;' +
        'width:100%;max-width:780px;max-height:92vh;display:flex;flex-direction:column;' +
        'box-shadow:0 28px 80px rgba(0,0,0,0.75);">' +

        // ── HEADER
        '<div style="display:flex;align-items:center;justify-content:space-between;' +
        'padding:20px 28px 16px;border-bottom:1px solid rgba(201,168,76,0.12);flex-shrink:0;">' +
            '<div style="display:flex;align-items:center;gap:14px;">' +
                '<div style="width:40px;height:40px;background:rgba(201,168,76,0.1);border-radius:8px;' +
                'display:flex;align-items:center;justify-content:center;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c9a84c" width="22" height="22">' +
                        '<path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z"/>' +
                        '<path d="M12 14c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/>' +
                    '</svg>' +
                '</div>' +
                '<div>' +
                    '<div style="font-family:\'Playfair Display\',serif;font-size:1rem;letter-spacing:0.1em;' +
                    'color:#c9a84c;text-transform:uppercase;">Alta de Nuevo Empleado</div>' +
                    '<div style="font-size:0.66rem;letter-spacing:0.1em;color:rgba(255,255,255,0.35);' +
                    'text-transform:uppercase;margin-top:2px;">Creación de identidad y credenciales de acceso</div>' +
                '</div>' +
            '</div>' +
            '<button onclick="closeNuevoEmpleadoModal()" ' +
            'style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4);' +
            'font-size:1.4rem;line-height:1;padding:4px 8px;" ' +
            'onmouseover="this.style.color=\'#c9a84c\'" onmouseout="this.style.color=\'rgba(255,255,255,0.4)\'">✕</button>' +
        '</div>' +

        // ── TABS
        '<div style="display:flex;border-bottom:1px solid rgba(201,168,76,0.12);flex-shrink:0;padding:0 28px;">' +
            '<button id="nemp-tab-btn-datos"   onclick="_nempShowTab(\'datos\')"   style="' + _nempTabStyle('datos',   true)  + '">Datos Principales</button>' +
            '<button id="nemp-tab-btn-acceso"  onclick="_nempShowTab(\'acceso\')"  style="' + _nempTabStyle('acceso',  false) + '">Control de Acceso</button>' +
            '<button id="nemp-tab-btn-detalle" onclick="_nempShowTab(\'detalle\')" style="' + _nempTabStyle('detalle', false) + '">Detalle</button>' +
        '</div>' +

        // ── BODY
        '<div style="flex:1;overflow-y:auto;padding:24px 28px;">' +

            // TAB: DATOS PRINCIPALES
            '<div id="nemp-panel-datos">' +
                '<div style="display:flex;gap:24px;align-items:flex-start;">' +

                    // Campos
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
                        _nempField('NOMBRE',                'nemp-nombre',    'text',   'Ej: David') +
                        _nempField('APELLIDOS',             'nemp-apellidos', 'text',   'Ej: Pérez García') +
                        _nempSelect('GÉNERO', 'nemp-genero', [
                            ['','— Sin especificar —'],
                            ['MASCULINO','Masculino'],
                            ['FEMENINO','Femenino'],
                            ['NO_ESPECIFICADO','No especificar']
                        ]) +
                        _nempSelect('TIPO DE DOCUMENTO', 'nemp-tipoDoc',
                            ENUMS.toOptionPairs('tiposDocumento', ['','— Sin especificar —'])
                        ) +
                        _nempField('DOCUMENTO / CÉDULA',    'nemp-numDoc',    'text',   'Ej: 12345678Z') +
                        _nempField('TELÉFONO / CELULAR',    'nemp-telefono',  'tel',    'Ej: +34 600 000 000') +
                        _nempField('PUESTO / CARGO',        'nemp-cargo',     'text',   'Ej: Recepcionista') +
                        _nempDateField('FECHA DE NACIMIENTO',   'nemp-fechaNac') +
                        _nempDateField('FECHA DE CONTRATACIÓN', 'nemp-fechaCont') +
                        '<div></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // TAB: CONTROL DE ACCESO
            '<div id="nemp-panel-acceso" style="display:none;">' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
                    '<div style="grid-column:1/-1;">' + _nempField('CORREO ELECTRÓNICO *', 'nemp-email', 'email', 'Ej: empleado@hotel.com') + '</div>' +
                    _nempField('CONTRASEÑA *',           'nemp-password',  'password', 'Mínimo 6 caracteres') +
                    _nempField('CONFIRMAR CONTRASEÑA *', 'nemp-password2', 'password', 'Repite la contraseña') +
                    _nempSelect('ROL ASIGNADO', 'nemp-rol', [
                        ['','— Sin rol —']
                    ]) +
                    _nempSelect('DEPARTAMENTO', 'nemp-departamento',
                        ENUMS.toOptionPairs('departamentos', ['','— Sin asignar —'])
                    ) +
                '</div>' +
            '</div>' +

            // TAB: DETALLE
            '<div id="nemp-panel-detalle" style="display:none;">' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
                    _nempSelect('TIPO DE EMPLEADO', 'nemp-tipoEmpleado',
                        ENUMS.toOptionPairs('tiposEmpleado', ['','— ---- —'])
                    ) +
                    _nempSelect('TIPO DE CONTRATACIÓN', 'nemp-tipoContratacion',
                        ENUMS.toOptionPairs('tiposContratacion', ['','— ---- —'])
                    ) +
                    _nempField('LUGAR DE NACIMIENTO',  'nemp-lugarNac',   'text', 'Ej: Madrid, España') +
                    _nempField('PAÍS',                 'nemp-pais',       'text', 'Ej: España') +
                    _nempField('TELÉFONO DE CASA',     'nemp-telCasa',    'tel',  'Ej: +34 91 000 0000') +
                    _nempField('DIRECCIÓN DE CASA',    'nemp-dirCasa',    'text', 'Ej: C/ Mayor 1, 28001 Madrid') +
                    _nempField('TELÉFONO DE OFICINA',  'nemp-telOficina', 'tel',  'Ej: +34 91 000 0001') +
                    _nempField('DIRECCIÓN DE OFICINA', 'nemp-dirOficina', 'text', 'Ej: Avda. Empresa 5, Planta 3') +
                '</div>' +
            '</div>' +

        '</div>' +

        // ── FOOTER
        '<div style="display:flex;align-items:center;justify-content:space-between;' +
        'padding:16px 28px;border-top:1px solid rgba(201,168,76,0.12);flex-shrink:0;">' +
            '<div id="nemp-error" style="font-size:0.78rem;color:#e74c3c;max-width:360px;"></div>' +
            '<div style="display:flex;gap:10px;">' +
                '<button onclick="closeNuevoEmpleadoModal()" style="' + _nempCancelBtn() + '">Cancelar</button>' +
                '<button id="nemp-submit-btn" onclick="_nempSubmit()" style="' + _nempSubmitBtn() + '">Crear Empleado</button>' +
            '</div>' +
        '</div>' +

        '</div>'
    );
}

// ── Tab helpers ─────────────────────────────────────────────────────────────

function _nempTabStyle(tab, active) {
    return [
        'background:none;border:none;border-bottom:2px solid ',
        active ? '#c9a84c' : 'transparent',
        ';cursor:pointer;padding:12px 18px 10px;font-size:0.71rem;letter-spacing:0.1em;',
        'text-transform:uppercase;color:',
        active ? '#c9a84c' : 'rgba(255,255,255,0.38)',
        ';transition:color 0.15s,border-color 0.15s;'
    ].join('');
}

window._nempShowTab = function (tab) {
    _nempTab = tab;
    ['datos', 'acceso', 'detalle'].forEach(function (t) {
        var panel = document.getElementById('nemp-panel-' + t);
        var btn   = document.getElementById('nemp-tab-btn-' + t);
        if (panel) panel.style.display = t === tab ? '' : 'none';
        if (btn)   btn.style.cssText   = _nempTabStyle(t, t === tab);
    });
};

// ── Field builders ──────────────────────────────────────────────────────────

var _nempInputStyle = [
    'width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);',
    'border-radius:6px;color:#fff;font-size:0.82rem;padding:8px 12px;box-sizing:border-box;',
    'outline:none;'
].join('');

var _nempLabelStyle = [
    'font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;',
    'color:rgba(255,255,255,0.42);margin-bottom:5px;display:block;'
].join('');

function _nempField(label, id, type, placeholder) {
    return (
        '<div>' +
            '<span style="' + _nempLabelStyle + '">' + label + '</span>' +
            '<input type="' + type + '" id="' + id + '" placeholder="' + placeholder + '" ' +
            'style="' + _nempInputStyle + '" ' +
            'onfocus="this.style.borderColor=\'rgba(201,168,76,0.5)\'" ' +
            'onblur="this.style.borderColor=\'rgba(255,255,255,0.12)\'">' +
        '</div>'
    );
}

function _nempDateField(label, id) {
    return (
        '<div>' +
            '<span style="' + _nempLabelStyle + '">' + label + '</span>' +
            '<input type="text" id="' + id + '" placeholder="dd/mm/aaaa" readonly ' +
            'style="' + _nempInputStyle + 'cursor:pointer;" ' +
            'onfocus="this.style.borderColor=\'rgba(201,168,76,0.5)\'" ' +
            'onblur="this.style.borderColor=\'rgba(255,255,255,0.12)\'">' +
        '</div>'
    );
}

function _nempSelect(label, id, options) {
    var opts = options.map(function (o) {
        return '<option value="' + o[0] + '" style="background:#1a2030;color:#e0d4b0;">' + o[1] + '</option>';
    }).join('');
    return (
        '<div>' +
            '<span style="' + _nempLabelStyle + '">' + label + '</span>' +
            '<select id="' + id + '" style="' + _nempInputStyle + 'cursor:pointer;color-scheme:dark;" ' +
            'onfocus="this.style.borderColor=\'rgba(201,168,76,0.5)\'" ' +
            'onblur="this.style.borderColor=\'rgba(255,255,255,0.12)\'">' +
            opts +
            '</select>' +
        '</div>'
    );
}

function _nempSmallBtn() {
    return [
        'background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:#c9a84c;',
        'cursor:pointer;padding:5px 12px;font-size:0.7rem;border-radius:5px;width:110px;',
        'letter-spacing:0.06em;'
    ].join('');
}

function _nempCancelBtn() {
    return [
        'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);',
        'color:rgba(255,255,255,0.6);cursor:pointer;padding:9px 20px;border-radius:6px;',
        'font-size:0.78rem;letter-spacing:0.06em;'
    ].join('');
}

function _nempSubmitBtn() {
    return [
        'background:#c9a84c;border:none;color:#0d1117;cursor:pointer;padding:9px 26px;',
        'border-radius:6px;font-size:0.78rem;font-weight:700;letter-spacing:0.08em;'
    ].join('');
}

// ── Submit ──────────────────────────────────────────────────────────────────

window._nempSubmit = async function () {
    var errEl = document.getElementById('nemp-error');
    if (errEl) errEl.textContent = '';

    function val(id) {
        var el = document.getElementById(id);
        if (!el) return null;
        var v = el.value.trim();
        return v || null;
    }

    // Validación cliente: todos los campos son obligatorios
    var REQUIRED = [
        ['nemp-nombre',           'Nombre',                'datos'],
        ['nemp-apellidos',        'Apellidos',             'datos'],
        ['nemp-genero',           'Género',                'datos'],
        ['nemp-tipoDoc',          'Tipo de documento',     'datos'],
        ['nemp-numDoc',           'Número de documento',   'datos'],
        ['nemp-telefono',         'Teléfono',              'datos'],
        ['nemp-cargo',            'Cargo',                 'datos'],
        ['nemp-fechaNac',         'Fecha de nacimiento',   'datos'],
        ['nemp-fechaCont',        'Fecha de contratación', 'datos'],
        ['nemp-email',            'Email',                 'acceso'],
        ['nemp-password',         'Contraseña',            'acceso'],
        ['nemp-password2',        'Confirmar contraseña',  'acceso'],
        ['nemp-rol',              'Rol asignado',          'acceso'],
        ['nemp-departamento',     'Departamento',          'acceso'],
        ['nemp-tipoEmpleado',     'Tipo de empleado',      'detalle'],
        ['nemp-tipoContratacion', 'Tipo de contratación',  'detalle'],
        ['nemp-lugarNac',         'Lugar de nacimiento',   'detalle'],
        ['nemp-pais',             'País',                  'detalle'],
        ['nemp-telCasa',          'Teléfono de casa',      'detalle'],
        ['nemp-dirCasa',          'Dirección de casa',     'detalle'],
        ['nemp-telOficina',       'Teléfono de oficina',   'detalle'],
        ['nemp-dirOficina',       'Dirección de oficina',  'detalle']
    ];
    for (var i = 0; i < REQUIRED.length; i++) {
        var req = REQUIRED[i];
        if (!val(req[0])) {
            if (errEl) errEl.textContent = 'El campo «' + req[1] + '» es obligatorio.';
            _nempShowTab(req[2]);
            var el = document.getElementById(req[0]);
            if (el && el.focus) el.focus();
            return;
        }
    }

    var email    = val('nemp-email');
    var password = document.getElementById('nemp-password').value || '';
    var pass2    = document.getElementById('nemp-password2').value || '';

    if (password.length < 6) {
        if (errEl) errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        _nempShowTab('acceso'); return;
    }
    if (password !== pass2) {
        if (errEl) errEl.textContent = 'Las contraseñas no coinciden.';
        _nempShowTab('acceso'); return;
    }

    var btn = document.getElementById('nemp-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Creando…'; }

    var body = {
        nombre:            val('nemp-nombre'),
        apellidos:         val('nemp-apellidos'),
        email:             email,
        password:          password,
        rol:               val('nemp-rol'),
        genero:            val('nemp-genero'),
        tipoDocumento:     val('nemp-tipoDoc'),
        numDocumento:      val('nemp-numDoc'),
        telefono:          val('nemp-telefono'),
        cargo:             val('nemp-cargo'),
        fechaNacimiento:   val('nemp-fechaNac'),
        fechaContratacion: val('nemp-fechaCont'),
        tipoEmpleado:      val('nemp-tipoEmpleado'),
        tipoContratacion:  val('nemp-tipoContratacion'),
        departamento:      val('nemp-departamento'),
        lugarNacimiento:   val('nemp-lugarNac'),
        pais:              val('nemp-pais'),
        telefonoCasa:      val('nemp-telCasa'),
        direccionCasa:     val('nemp-dirCasa'),
        telefonoOficina:   val('nemp-telOficina'),
        direccionOficina:  val('nemp-dirOficina')
    };

    try {
        var res = await fetch('/api/admin/empleados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            closeNuevoEmpleadoModal();
            if (typeof loadAdminUsuarios === 'function') loadAdminUsuarios();
        } else if (res.status === 409) {
            var msgDup = await res.text();
            if (errEl) errEl.textContent = msgDup || 'Ya existe un usuario con esos datos.';
            if (btn) { btn.disabled = false; btn.textContent = 'Crear Empleado'; }
        } else {
            var msg = await res.text();
            if (errEl) errEl.textContent = msg || 'Error al crear el empleado.';
            if (btn) { btn.disabled = false; btn.textContent = 'Crear Empleado'; }
        }
    } catch (_) {
        if (errEl) errEl.textContent = 'Error de conexión.';
        if (btn) { btn.disabled = false; btn.textContent = 'Crear Empleado'; }
    }
};
