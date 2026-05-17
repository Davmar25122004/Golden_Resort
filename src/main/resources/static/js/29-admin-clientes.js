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
        <div class="cli-header">
            <div class="cli-header-search">
                <input type="text" id="cli-search" class="admin-form-input"
                       placeholder="Buscar nombre, email o documento..."
                       style="padding:8px 12px; font-size:0.8rem;"
                       oninput="filtrarClientes()">
            </div>
            <div class="cli-header-actions">
                <button class="admin-btn" onclick="loadAdminClientes()" style="font-size:0.7rem; padding:6px 14px;">↻ Refrescar</button>
                <button class="admin-btn admin-btn--gold" onclick="abrirModalNuevoCliente()"
                        style="font-size:0.75rem; padding:7px 18px; background:rgba(201,168,76,0.15); border-color:rgba(201,168,76,0.4); color:#c9a84c;">
                    + Nuevo Cliente
                </button>
            </div>
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
    /* ── Vista tabla (desktop) ── */
    var tableHtml = `
        <table class="admin-table cli-desktop-table">
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

    /* ── Vista cards (mobile) ── */
    var cardsHtml = `
        <div class="cli-mobile-cards">
            ${clientes.map(u => `
                <div class="cli-card">
                    <div class="cli-card-header">
                        <a href="javascript:void(0)" onclick="adminAbrirDetalleUsuario(${u.id})" class="cli-card-name">${u.nombre || '—'}</a>
                        <span class="cli-card-id">#${u.id}</span>
                    </div>
                    <div class="cli-card-body">
                        <div class="cli-card-row">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            <span>${u.email}</span>
                        </div>
                        <div class="cli-card-row">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92z"/></svg>
                            <span>${u.telefonoPrefijo ? u.telefonoPrefijo + ' ' : ''}${u.telefono || '—'}</span>
                        </div>
                        ${u.tipoDocumento ? `<div class="cli-card-row">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>
                            <span>${u.tipoDocumento}: ${u.numDocumento}</span>
                        </div>` : ''}
                    </div>
                    <div class="cli-card-footer">
                        <button class="admin-btn admin-btn--danger" onclick="adminEliminarCliente(${u.id})" style="font-size:0.65rem; padding:5px 12px;">Eliminar</button>
                    </div>
                </div>`).join('')}
        </div>`;

    container.innerHTML = tableHtml + cardsHtml;
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
