// ── ADMIN: GESTIÓN DE CLIENTES ────────────────────────────────────────────────

var _cachedClientes = [];

window.loadAdminClientes = async function () {
    var body = document.getElementById('admin-tab-body');
    try {
        var res = await fetch('/api/admin/usuarios');
        if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">Error al cargar clientes.</p>'; return; }
        var todos = await res.json();
        _cachedClientes = todos.filter(u => {
            var roles = u.roles || (u.rol ? [u.rol] : []);
            return roles.includes('ROLE_CLIENTE') || roles.length === 0;
        });
    } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }

    body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
                <div style="font-size:0.85rem; color:var(--cream);">
                    Buscar:
                    <input type="text" id="cli-search" class="admin-form-input"
                           placeholder="Nombre, email o documento..."
                           style="display:inline-block; width:220px; margin-left:10px; padding:6px 12px;"
                           oninput="filtrarClientes()">
                </div>
                <button class="admin-btn" onclick="loadAdminClientes()" style="font-size:0.7rem; padding:6px 14px;">↻ Refrescar</button>
            </div>
            <button class="admin-btn admin-btn--gold" onclick="abrirModalNuevoCliente()"
                    style="font-size:0.75rem; padding:7px 18px; background:rgba(201,168,76,0.15); border-color:rgba(201,168,76,0.4); color:#c9a84c;">
                + Nuevo Cliente
            </button>
        </div>
        <div id="cli-table-container"></div>
    `;

    renderClientesTable(_cachedClientes);
};

window.filtrarClientes = () => {
    var query = (document.getElementById('cli-search').value || '').toLowerCase();
    var filtered = _cachedClientes.filter(u => {
        return (u.nombre  || '').toLowerCase().includes(query) ||
               (u.email   || '').toLowerCase().includes(query) ||
               (u.numDocumento || '').toLowerCase().includes(query);
    });
    renderClientesTable(filtered);
};

window.renderClientesTable = (clientes) => {
    var container = document.getElementById('cli-table-container');
    if (!container) return;
    if (!clientes || clientes.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">No hay clientes que coincidan con la búsqueda.</p>';
        return;
    }
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Documento</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td><a href="javascript:void(0)" onclick="adminAbrirDetalleUsuario(${u.id})"
                               style="color:#c9a84c;text-decoration:none;font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(201,168,76,0.4);"
                               onmouseover="this.style.borderBottomColor='#c9a84c'"
                               onmouseout="this.style.borderBottomColor='rgba(201,168,76,0.4)'">${u.nombre || '—'}</a></td>
                        <td style="color:var(--text-muted-custom);">${u.email}</td>
                        <td style="color:var(--text-muted-custom);">${u.telefonoPrefijo ? u.telefonoPrefijo + ' ' : ''}${u.telefono || '—'}</td>
                        <td style="color:var(--text-muted-custom);">${u.tipoDocumento ? u.tipoDocumento + ': ' + u.numDocumento : '—'}</td>
                        <td>
                            <button class="admin-btn admin-btn--danger" onclick="adminEliminarCliente(${u.id})">Eliminar</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
};

window.adminEliminarCliente = async (id) => {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return;
    try {
        var res = await fetch('/api/admin/usuarios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminClientes();
        } else {
            var msg = await res.text();
            alert(msg || 'No se pudo eliminar el cliente.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

window.abrirModalNuevoCliente = function () {
    var overlay = document.createElement('div');
    overlay.id = 'modal-nuevo-cliente';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:#161616;border:1px solid rgba(201,168,76,0.35);border-radius:4px;padding:2rem;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;">
            <h3 style="font-family:'Cormorant Garamond',serif;color:#c9a84c;font-size:1.3rem;margin-bottom:1.2rem;letter-spacing:1px;">Nuevo Cliente</h3>
            <div id="ncli-error" class="alert alert-danger d-none py-2" style="font-size:0.8rem;"></div>
            <div class="mb-3">
                <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Nombre</label>
                <input type="text" id="ncli-nombre" class="form-control" style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
            </div>
            <div class="mb-3">
                <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Email</label>
                <input type="email" id="ncli-email" class="form-control" style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
            </div>
            <div class="mb-3">
                <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Contraseña temporal</label>
                <input type="password" id="ncli-password" class="form-control" style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
            </div>
            <div class="mb-3">
                <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Fecha de nacimiento</label>
                <input type="text" id="ncli-fecha-nac" class="form-control" placeholder="dd/mm/aaaa" readonly style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
            </div>
            <div class="row g-2 mb-3">
                <div class="col-5">
                    <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Tipo documento</label>
                    <select id="ncli-tipo-doc" class="form-select" style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
                        <option value="">— Opcional —</option>
                        <option value="DNI">DNI</option>
                        <option value="NIE">NIE</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="TIE">TIE</option>
                    </select>
                </div>
                <div class="col-7">
                    <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Nº documento</label>
                    <input type="text" id="ncli-num-doc" class="form-control" style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-5">
                    <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Prefijo</label>
                    <select id="ncli-prefijo" class="form-select" style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+351">🇵🇹 +351</option>
                    </select>
                </div>
                <div class="col-7">
                    <label class="form-label" style="color:#d8d2c5;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;">Teléfono</label>
                    <input type="tel" id="ncli-telefono" class="form-control" placeholder="612345678" style="background:rgba(0,0,0,0.45);color:#f5f0e8;border:1px solid rgba(201,168,76,0.32);">
                </div>
            </div>
            <div class="d-flex gap-2 mt-3">
                <button onclick="cerrarModalNuevoCliente()" class="admin-btn" style="flex:1;">Cancelar</button>
                <button onclick="guardarNuevoCliente()" class="admin-btn admin-btn--gold" style="flex:2;background:rgba(201,168,76,0.15);border-color:rgba(201,168,76,0.4);color:#c9a84c;">Crear Cliente</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModalNuevoCliente(); });

    flatpickr(document.getElementById('ncli-fecha-nac'), Object.assign({}, FP_CONFIG, {
        dateFormat:  'Y-m-d',
        altInput:    true,
        altFormat:   'd/m/Y',
        maxDate:     'today',
        allowInput:  false,
    }));
};

window.cerrarModalNuevoCliente = function () {
    var el = document.getElementById('modal-nuevo-cliente');
    if (el) el.remove();
};

window.guardarNuevoCliente = async function () {
    var err = document.getElementById('ncli-error');
    err.classList.add('d-none');

    var nombre   = (document.getElementById('ncli-nombre').value   || '').trim();
    var email    = (document.getElementById('ncli-email').value    || '').trim();
    var password = (document.getElementById('ncli-password').value || '').trim();
    var fechaNac = document.getElementById('ncli-fecha-nac').value || null;
    var tipoDoc  = document.getElementById('ncli-tipo-doc').value;
    var numDoc   = (document.getElementById('ncli-num-doc').value  || '').trim().toUpperCase();
    var prefijo  = document.getElementById('ncli-prefijo').value;
    var telefono = (document.getElementById('ncli-telefono').value  || '').trim();

    const show = msg => { err.textContent = msg; err.classList.remove('d-none'); };

    if (!nombre) { show('El nombre es obligatorio.'); return; }
    if (!/^(?=.{2,50}$)[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+(?:-[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)*$/.test(nombre)) {
        show('El nombre solo puede contener letras, espacios o guiones. Mínimo 2 caracteres.'); return;
    }
    if (!email) { show('El email es obligatorio.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { show('Formato de email no válido.'); return; }
    if (!password || password.length < 6) { show('La contraseña debe tener mínimo 6 caracteres.'); return; }

    // Fecha de nacimiento — si se indica, mínimo 18 años
    if (fechaNac) {
        const fn = new Date(fechaNac), hoy = new Date();
        let edad = hoy.getFullYear() - fn.getFullYear();
        const m = hoy.getMonth() - fn.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;
        if (edad < 18) { show('El cliente debe ser mayor de 18 años (tiene ' + edad + ' años según la fecha indicada).'); return; }
        if (edad > 120) { show('Introduce una fecha de nacimiento válida.'); return; }
    }

    // Documento — si se indica tipo, el número es obligatorio y debe tener formato correcto
    const NIE_LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE';
    if (tipoDoc) {
        if (!numDoc) { show('Si indicas el tipo de documento, el número es obligatorio.'); return; }
        if (tipoDoc === 'DNI') {
            if (!/^\d{8}[A-Z]$/i.test(numDoc)) { show('El DNI debe tener 8 dígitos seguidos de una letra (ej: 12345678A).'); return; }
            if (numDoc[8].toUpperCase() !== NIE_LETRAS[parseInt(numDoc.slice(0,8)) % 23]) { show('La letra del DNI no es correcta.'); return; }
        } else if (tipoDoc === 'NIE') {
            if (!/^[XYZ]\d{7}[A-Z]$/i.test(numDoc)) { show('El NIE debe tener formato X/Y/Z + 7 dígitos + letra.'); return; }
            const nieNum = numDoc.replace('X','0').replace('Y','1').replace('Z','2');
            if (numDoc[8].toUpperCase() !== NIE_LETRAS[parseInt(nieNum.slice(0,8)) % 23]) { show('La letra del NIE no es correcta.'); return; }
        } else if (tipoDoc === 'PASAPORTE' || tipoDoc === 'TIE') {
            if (!/^[A-Z0-9]{6,12}$/i.test(numDoc)) { show('El número de ' + tipoDoc + ' debe tener entre 6 y 12 caracteres alfanuméricos.'); return; }
        }
    }

    // Teléfono — si se indica, solo dígitos, 6-15 cifras
    if (telefono && !/^\d{6,15}$/.test(telefono.replace(/[\s\-().]/g, ''))) {
        show('El teléfono solo puede contener dígitos (6–15 cifras).'); return;
    }

    try {
        var res = await fetch('/api/admin/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, fechaNacimiento: fechaNac, tipoDocumento: tipoDoc || null, numDocumento: numDoc || null, telefonoPrefijo: prefijo, telefono: telefono || null })
        });
        if (res.ok) {
            cerrarModalNuevoCliente();
            loadAdminClientes();
        } else {
            var msg = await res.text();
            err.textContent = msg || 'Error al crear el cliente.';
            err.classList.remove('d-none');
        }
    } catch (_) {
        err.textContent = 'Error de conexión.';
        err.classList.remove('d-none');
    }
};
