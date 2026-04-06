// ── PANEL ADMIN ───────────────────────────────────────────────────────────────

window.showAdmin = async () => {
    history.pushState({ view: 'admin' }, '', '/admin');
    showDynamic(`
        <p class="section-label">Panel de Control</p>
        <h2 class="serif mb-2" style="color:var(--cream); font-size:2.5rem;">Administración</h2>
        <div class="gold-line mb-4"></div>

        <div class="admin-tabs-bar mb-4">
            <button class="admin-tab-btn active" id="atab-dashboard"    onclick="switchAdminTab('dashboard')">Dashboard</button>
            <button class="admin-tab-btn"        id="atab-reservas"     onclick="switchAdminTab('reservas')">Reservas</button>
            <button class="admin-tab-btn"        id="atab-habitaciones" onclick="switchAdminTab('habitaciones')">Habitaciones</button>
            <button class="admin-tab-btn"        id="atab-servicios"    onclick="switchAdminTab('servicios')">Servicios</button>
            <button class="admin-tab-btn"        id="atab-roomservice"  onclick="switchAdminTab('roomservice')">Room Service</button>
            <button class="admin-tab-btn"        id="atab-usuarios"     onclick="switchAdminTab('usuarios')">Usuarios</button>
        </div>

        <div id="admin-tab-body" style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">Cargando...</div>
    `);

    switchAdminTab('dashboard');
};

window.switchAdminTab = (tab) => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    var btn = document.getElementById('atab-' + tab);
    if (btn) btn.classList.add('active');
    var body = document.getElementById('admin-tab-body');
    if (!body) return;
    body.innerHTML = '<div style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; padding:20px 0;">Cargando...</div>';

    if (tab === 'dashboard')    loadAdminDashboard();
    if (tab === 'reservas')     loadAdminReservas();
    if (tab === 'habitaciones') loadAdminHabitaciones();
    if (tab === 'servicios')    loadAdminServicios();
    if (tab === 'roomservice')  loadAdminRoomService();
    if (tab === 'usuarios')     loadAdminUsuarios();
};

// ── ADMIN: DASHBOARD ──────────────────────────────────────────────────────────

async function loadAdminDashboard() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/admin/stats'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar las métricas.</p>'; return; }
    var s = await res.json();

    var ocupPct = s.totalHabitaciones > 0
        ? Math.round((s.ocupadasHoy / s.totalHabitaciones) * 100) : 0;

    var proximasHtml = s.proximasLlegadas && s.proximasLlegadas.length > 0
        ? `<table class="admin-table mt-3">
               <thead><tr><th>Cliente</th><th>Habitación</th><th>Tipo</th><th>Llegada</th><th>Salida</th></tr></thead>
               <tbody>
                   ${s.proximasLlegadas.map(p => `
                       <tr>
                           <td>${p.clienteNombre}</td>
                           <td>${p.habitacionNumero}</td>
                           <td><span class="admin-badge">${p.habitacionTipo}</span></td>
                           <td>${formatFecha(p.fechaEntrada)}</td>
                           <td>${formatFecha(p.fechaSalida)}</td>
                       </tr>`).join('')}
               </tbody>
           </table>`
        : '<p style="color:var(--text-muted-custom); font-size:0.8rem; margin-top:12px; letter-spacing:1px;">No hay llegadas próximas.</p>';

    body.innerHTML = `
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <p class="admin-stat-label">Reservas hoy</p>
                <p class="admin-stat-value">${s.reservasHoy}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">Reservas este mes</p>
                <p class="admin-stat-value">${s.reservasMes}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">Ingresos este mes</p>
                <p class="admin-stat-value">${parseFloat(s.ingresosMes).toFixed(2)} €</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">Ocupación hoy</p>
                <p class="admin-stat-value">${s.ocupadasHoy} / ${s.totalHabitaciones} <small style="font-size:1rem;">(${ocupPct}%)</small></p>
            </div>
        </div>

        <div class="mt-5">
            <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:4px;">PRÓXIMAS LLEGADAS</p>
            <div class="gold-line" style="width:60px; margin-bottom:0;"></div>
            ${proximasHtml}
        </div>`;
}

// ── ADMIN: RESERVAS ───────────────────────────────────────────────────────────

async function loadAdminReservas() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/reservas'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar las reservas.</p>'; return; }
    var reservas = await res.json();

    if (!reservas || reservas.length === 0) {
        body.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">No hay reservas.</p>';
        return;
    }

    var tipoLabels = { NORMAL: 'Normal', DOBLE: 'Doble', SUITE: 'Suite', LUJO: 'Lujo' };

    body.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th><th>Cliente</th><th>Habitación</th><th>Llegada</th><th>Salida</th>
                    <th>Servicios</th><th>Total</th><th></th>
                </tr>
            </thead>
            <tbody>
                ${reservas.map(r => {
                    var serviciosStr = r.servicios && r.servicios.length > 0
                        ? r.servicios.map(s => s.nombre).join(', ')
                        : '';
                    if (r.pedidosRoomService && r.pedidosRoomService.length > 0) {
                        var rsStr = 'Room Service (' + r.pedidosRoomService.map(p => p.cantidad + 'x ' + p.nombre).join(', ') + ')';
                        serviciosStr = serviciosStr ? serviciosStr + '<br><span style="color:var(--gold);">' + rsStr + '</span>' : '<span style="color:var(--gold);">' + rsStr + '</span>';
                    }
                    if (!serviciosStr) serviciosStr = '—';
                    return `<tr>
                        <td>${r.id}</td>
                        <td><span style="color:var(--cream);">${r.clienteNombre || '—'}</span><br><small style="color:var(--text-muted-custom);">${r.clienteEmail || ''}</small></td>
                        <td><span class="admin-badge">${tipoLabels[r.habitacionTipo] || r.habitacionTipo}</span> nº ${r.habitacionNumero}</td>
                        <td>${formatFecha(r.fechaEntrada)}</td>
                        <td>${formatFecha(r.fechaSalida)}</td>
                        <td style="font-size:0.75rem;">${serviciosStr}</td>
                        <td style="color:var(--gold); white-space:nowrap;">${parseFloat(r.total).toFixed(2)} €</td>
                        <td>
                            <div style="display:flex; gap:8px; justify-content:flex-end;">
                                <button class="admin-btn" style="background:rgba(255,255,255,0.05); color:var(--gold); border:1px solid rgba(185,149,77,0.4);" onclick='adminModificarReserva(${JSON.stringify(r).replace(/'/g, "&#39;")})'>Modificar</button>
                                <button class="admin-btn admin-btn--danger" onclick="adminCancelarReserva(${r.id})">Cancelar</button>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

window.adminCancelarReserva = async (id) => {
    if (!confirm('¿Cancelar esta reserva? Esta acción no se puede deshacer.')) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminReservas();
        } else {
            alert('No se pudo cancelar la reserva.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

window.adminModificarReserva = async (r) => {
    var todosServicios = await fetchServicios();
    var dIn = r.fechaEntrada;
    var dOut = r.fechaSalida;
    
    var servHtml = todosServicios.map(s => {
        if(s.nombre.toLowerCase().includes('room service')) return '';
        var isChecked = r.servicios && r.servicios.some(rs => rs.nombre === s.nombre) ? 'checked' : '';
        return `
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:0.85rem; color:var(--cream); cursor:pointer;">
                <input type="checkbox" class="mod-serv-check" value="${s.id}" ${isChecked} style="accent-color:var(--gold); width:16px; height:16px;">
                ${s.nombre} (+${parseFloat(s.precio).toFixed(2)} €)
            </label>
        `;
    }).join('');

    var modalHtml = `
        <div id="modal-mod-reserva" style="display:flex; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:460px; margin:16px;">
                <h3 class="serif mb-1" style="color:var(--cream); font-size:1.4rem;">Modificar Reserva #${r.id}</h3>
                <p style="font-size:0.75rem; color:var(--text-muted-custom); margin-bottom:20px;">
                    ${r.clienteNombre} (${r.habitacionTipo} nº ${r.habitacionNumero})
                </p>
                
                <div class="mb-3 d-flex gap-2">
                    <div style="flex:1;">
                        <label class="admin-form-label">Llegada</label>
                        <input type="date" id="mod-llegada" class="admin-form-input" value="${dIn}" required>
                    </div>
                    <div style="flex:1;">
                        <label class="admin-form-label">Salida</label>
                        <input type="date" id="mod-salida" class="admin-form-input" value="${dOut}" required>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="admin-form-label mb-2">Servicios Adicionales</label>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(185,149,77,0.2); border-radius:8px; padding:16px; max-height:180px; overflow-y:auto;">
                        ${servHtml || '<p style="color:var(--text-muted-custom);font-size:0.8rem;margin:0;">No hay servicios.</p>'}
                    </div>
                </div>

                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarModificacionReserva(${r.id})">Guardar cambios</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalModRe()">Cancelar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Inicializar Flatpickr en los nuevos inputs del modal
    flatpickr('#mod-llegada', FP_CONFIG);
    flatpickr('#mod-salida', FP_CONFIG);
};

window.cerrarModalModRe = () => {
    var el = document.getElementById('modal-mod-reserva');
    if (el) el.remove();
};

window.guardarModificacionReserva = async (id) => {
    var inDate = document.getElementById('mod-llegada').value;
    var outDate = document.getElementById('mod-salida').value;
    
    var checks = document.querySelectorAll('.mod-serv-check:checked');
    var serviciosArr = Array.from(checks).map(c => ({ servicioId: parseInt(c.value), cantidad: 1 }));

    try {
        var res = await fetch('/api/reservas/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fechaEntrada: inDate,
                fechaSalida: outDate,
                servicios: serviciosArr
            })
        });

        if (res.ok) {
            cerrarModalModRe();
            loadAdminReservas();
            // Actualizar header de statistics si es necesario
            if (typeof loadAdminStats === 'function') loadAdminStats();
        } else {
            var msg = await res.text();
            alert('Error al modificar: ' + msg);
        }
    } catch(e) {
        alert('Error de conexión.');
    }
};

// ── ADMIN: HABITACIONES (por tipo) ───────────────────────────────────────────

var TIPO_LABELS_ADMIN = {
    NORMAL: { label: 'Habitación Normal' },
    DOBLE:  { label: 'Habitación Doble'  },
    SUITE:  { label: 'Suite'             },
    LUJO:   { label: 'Suite de Lujo'     },
};

async function loadAdminHabitaciones() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/habitaciones'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar las habitaciones.</p>'; return; }
    var habitaciones = await res.json();

    // Agrupa por tipo
    var tipos = { NORMAL: [], DOBLE: [], SUITE: [], LUJO: [] };
    habitaciones.forEach(h => {
        if (tipos[h.tipo]) tipos[h.tipo].push(h);
    });

    var tipoOrder = ['NORMAL', 'DOBLE', 'SUITE', 'LUJO'];

    var cardsHtml = tipoOrder.map(tipo => {
        var lista = tipos[tipo];
        var info  = TIPO_LABELS_ADMIN[tipo] || { label: tipo };
        var precio    = lista.length > 0 ? parseFloat(lista[0].precioNoche).toFixed(2) : '—';
        var desc      = lista.length > 0 ? (lista[0].descripcion || '') : '';
        var count     = lista.length;
        var descEsc   = desc.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        var precioVal = lista.length > 0 ? parseFloat(lista[0].precioNoche) : 0;
        var bgImg     = (TIPO_IMAGES[tipo] || [])[0] || '';
        var bgStyle   = bgImg ? `background-image:url('${bgImg}'); background-size:cover; background-position:center;` : '';

        return `
        <div style="position:relative; border-radius:14px; overflow:hidden; min-height:260px; display:flex; flex-direction:column; justify-content:flex-end; ${bgStyle} box-shadow:0 4px 24px rgba(0,0,0,0.35);">
            <!-- Overlay degradado oscuro -->
            <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.92) 100%); border-radius:14px;"></div>
            <!-- Badge cantidad -->
            <div style="position:absolute; top:14px; right:14px; font-size:0.68rem; background:rgba(185,149,77,0.85); color:#0a0a0a; padding:4px 12px; border-radius:20px; letter-spacing:1px; font-weight:700;">
                ${count} hab.
            </div>
            <!-- Contenido inferior -->
            <div style="position:relative; padding:20px 22px 22px;">
                <p style="margin:0 0 2px; font-size:0.6rem; letter-spacing:3px; color:rgba(255,255,255,0.5); text-transform:uppercase;">${tipo}</p>
                <p style="margin:0 0 6px; font-size:1.1rem; color:var(--cream); font-family:'Playfair Display',serif; font-weight:700;">${info.label}</p>
                <p style="margin:0 0 4px; font-size:1.6rem; color:var(--gold); font-weight:700; line-height:1;">${precio} <small style="font-size:0.85rem; color:rgba(255,255,255,0.5); font-weight:400;">€/noche</small></p>
                <p style="margin:0 0 16px; font-size:0.75rem; color:rgba(255,255,255,0.55); min-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${desc || 'Sin descripción'}</p>
                <button class="admin-btn" onclick="abrirModalTipo('${tipo}', ${precioVal}, '${descEsc}')" style="width:100%;">Editar habitación</button>
            </div>
        </div>`;
    }).join('');

    body.innerHTML = `
        <div class="admin-stats-grid">${cardsHtml}</div>

        <!-- Modal editar tipo -->
        <div id="modal-tipo-hab" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:460px; margin:16px;">
                <h3 class="serif mb-1" id="modal-tipo-title" style="color:var(--cream); font-size:1.4rem;"></h3>
                <p style="font-size:0.72rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:24px;">
                    Los cambios se aplicarán a <strong style="color:var(--gold);">todas</strong> las habitaciones de este tipo.
                </p>
                <div class="mb-3">
                    <label class="admin-form-label">Precio / noche (€)</label>
                    <input type="number" id="tipo-precio" class="admin-form-input" step="0.01" min="0" placeholder="Ej: 120.00">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label">Descripción (opcional)</label>
                    <input type="text" id="tipo-descripcion" class="admin-form-input" placeholder="Descripción breve del tipo">
                </div>
                <div id="modal-tipo-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" id="btn-guardar-tipo" onclick="guardarTipoHabitacion()">Guardar cambios</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalTipo()">Cancelar</button>
                </div>
            </div>
        </div>`;
}

var _editTipoActual = null;

window.abrirModalTipo = (tipo, precio, descripcion) => {
    _editTipoActual = tipo;
    var info = TIPO_LABELS_ADMIN[tipo] || { label: tipo, icon: '🏨' };
    document.getElementById('modal-tipo-title').textContent = info.icon + '  ' + info.label;
    document.getElementById('tipo-precio').value      = precio || '';
    document.getElementById('tipo-descripcion').value = descripcion || '';
    document.getElementById('modal-tipo-error').classList.add('d-none');
    var modal = document.getElementById('modal-tipo-hab');
    modal.style.display = 'flex';
};

window.cerrarModalTipo = () => {
    document.getElementById('modal-tipo-hab').style.display = 'none';
};

window.guardarTipoHabitacion = async () => {
    var precio      = document.getElementById('tipo-precio').value;
    var descripcion = document.getElementById('tipo-descripcion').value.trim();
    var errEl       = document.getElementById('modal-tipo-error');
    var btn         = document.getElementById('btn-guardar-tipo');

    if (!precio || parseFloat(precio) <= 0) {
        errEl.textContent = 'El precio es obligatorio y debe ser mayor que 0.';
        errEl.classList.remove('d-none'); return;
    }

    btn.disabled    = true;
    btn.textContent = 'Guardando...';

    try {
        var res = await fetch('/api/habitaciones/tipo/' + _editTipoActual, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ precioNoche: parseFloat(precio), descripcion: descripcion || null }),
        });
        if (res.ok) {
            cerrarModalTipo();
            loadAdminHabitaciones();
        } else if (res.status === 404) {
            errEl.textContent = 'No existe ninguna habitación de ese tipo.';
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = 'Error al guardar. Inténtalo de nuevo.';
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión.';
        errEl.classList.remove('d-none');
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Guardar cambios';
    }
};

// ── ADMIN: SERVICIOS ──────────────────────────────────────────────────────────

async function loadAdminServicios() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/servicios'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar los servicios.</p>'; return; }
    var servicios = await res.json();

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalServicio(null)">+ Nuevo Servicio</button>
        </div>
        <table class="admin-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Precio</th><th></th></tr></thead>
            <tbody>
                ${servicios.map(s => `
                    <tr>
                        <td>${s.id}</td>
                        <td style="color:var(--cream);">${s.nombre}</td>
                        <td style="color:var(--gold);">${parseFloat(s.precio).toFixed(2)} €</td>
                        <td style="white-space:nowrap;">
                            <button class="admin-btn" onclick='abrirModalServicio(${JSON.stringify(s)})'>Editar</button>
                            <button class="admin-btn admin-btn--danger" onclick="adminEliminarServicio(${s.id})">Eliminar</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>

        <!-- Modal servicio -->
        <div id="modal-servicio" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:400px;">
                <h3 class="serif mb-4" id="modal-svc-title" style="color:var(--cream);">Servicio</h3>
                <div class="mb-3">
                    <label class="admin-form-label">Nombre</label>
                    <input type="text" id="svc-nombre" class="admin-form-input" placeholder="Ej: Spa Premium">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label">Precio (€)</label>
                    <input type="number" id="svc-precio" class="admin-form-input" step="0.01" min="0" placeholder="Ej: 45.00">
                </div>
                <div id="modal-svc-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarServicio()">Guardar</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalServicio()">Cancelar</button>
                </div>
            </div>
        </div>`;
}

var _editSvcId = null;

window.abrirModalServicio = (svc) => {
    _editSvcId = svc ? svc.id : null;
    document.getElementById('modal-svc-title').textContent = svc ? 'Editar Servicio' : 'Nuevo Servicio';
    document.getElementById('svc-nombre').value = svc ? svc.nombre : '';
    document.getElementById('svc-precio').value = svc ? svc.precio : '';
    document.getElementById('modal-svc-error').classList.add('d-none');
    var modal = document.getElementById('modal-servicio');
    modal.style.display = 'flex';
};

window.cerrarModalServicio = () => {
    document.getElementById('modal-servicio').style.display = 'none';
};

window.guardarServicio = async () => {
    var nombre = document.getElementById('svc-nombre').value.trim();
    var precio = document.getElementById('svc-precio').value;
    var errEl  = document.getElementById('modal-svc-error');

    if (!nombre || !precio) {
        errEl.textContent = 'Nombre y precio son obligatorios.';
        errEl.classList.remove('d-none'); return;
    }

    var url    = _editSvcId ? '/api/servicios/' + _editSvcId : '/api/servicios';
    var method = _editSvcId ? 'PUT' : 'POST';

    try {
        var res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio: parseFloat(precio) }),
        });
        if (res.ok || res.status === 201) {
            _serviciosCache = null; // invalidar cache
            cerrarModalServicio();
            loadAdminServicios();
        } else if (res.status === 409) {
            errEl.textContent = 'Ya existe un servicio con ese nombre.';
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = 'Error al guardar.';
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión.';
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarServicio = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
        var res = await fetch('/api/servicios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _serviciosCache = null;
            loadAdminServicios();
        } else {
            alert('No se pudo eliminar el servicio.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

// ── ADMIN: ROOM SERVICE ───────────────────────────────────────────────────────

async function loadAdminRoomService() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/room-service/items'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar los ítems.</p>'; return; }
    var items = await res.json();
    _rsItemsCache = null; // invalidar caché del frontend al editar desde admin

    var categorias = ['DESAYUNO','ALMUERZO','CENA','SNACKS','BEBIDAS'];
    var catLabels  = { DESAYUNO:'Desayuno', ALMUERZO:'Almuerzo', CENA:'Cena', SNACKS:'Snacks', BEBIDAS:'Bebidas' };

    var tablasPorCat = categorias.map(cat => {
        var catItems = items.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.7rem;letter-spacing:2px;color:var(--text-muted-custom);margin:18px 0 6px;text-transform:uppercase;">${catLabels[cat]}</p>
            <table class="admin-table">
                <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th>Precio</th><th>Disponible</th><th></th></tr></thead>
                <tbody>
                    ${catItems.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td style="color:var(--cream);">${item.nombre}</td>
                            <td style="color:var(--text-muted-custom);font-size:0.75rem;">${item.descripcion || '—'}</td>
                            <td style="color:var(--gold);">${parseFloat(item.precio).toFixed(2)} €</td>
                            <td>${item.disponible ? '<span class="admin-badge" style="color:#27ae60;">Sí</span>' : '<span class="admin-badge" style="color:#c0392b;">No</span>'}</td>
                            <td style="white-space:nowrap;">
                                <button class="admin-btn" onclick='abrirModalRSItem(${JSON.stringify(item)})'>Editar</button>
                                <button class="admin-btn admin-btn--danger" onclick="adminEliminarRSItem(${item.id})">Eliminar</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }).join('');

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalRSItem(null)">+ Nuevo ítem</button>
        </div>
        ${tablasPorCat || '<p style="color:var(--text-muted-custom);font-size:0.8rem;letter-spacing:1px;margin-top:12px;">No hay ítems en la carta.</p>'}

        <!-- Modal ítem room service -->
        <div id="modal-rs-item" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:#1a1a1a;border:1px solid rgba(185,149,77,0.3);border-radius:12px;padding:32px;width:100%;max-width:460px;margin:16px;max-height:90vh;overflow-y:auto;">
                <h3 class="serif mb-4" id="modal-rsitem-title" style="color:var(--cream);">Ítem Room Service</h3>
                <div class="mb-3">
                    <label class="admin-form-label">Nombre</label>
                    <input type="text" id="rsi-nombre" class="admin-form-input" placeholder="Ej: Hamburguesa gourmet">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label">Descripción (opcional)</label>
                    <input type="text" id="rsi-descripcion" class="admin-form-input" placeholder="Breve descripción del plato">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label">Precio (€)</label>
                    <input type="number" id="rsi-precio" class="admin-form-input" step="0.01" min="0" placeholder="Ej: 12.50">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label">Categoría</label>
                    <select id="rsi-categoria" class="admin-form-input" style="cursor:pointer;">
                        <option value="DESAYUNO">Desayuno</option>
                        <option value="ALMUERZO">Almuerzo</option>
                        <option value="CENA">Cena</option>
                        <option value="SNACKS">Snacks</option>
                        <option value="BEBIDAS">Bebidas</option>
                    </select>
                </div>
                <div class="mb-4" style="display:flex;align-items:center;gap:10px;">
                    <input type="checkbox" id="rsi-disponible" checked style="accent-color:var(--gold);width:16px;height:16px;cursor:pointer;">
                    <label for="rsi-disponible" class="admin-form-label" style="margin:0;cursor:pointer;">Disponible</label>
                </div>
                <div id="modal-rsitem-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarRSItem()">Guardar</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalRSItem()">Cancelar</button>
                </div>
            </div>
        </div>`;
}

var _editRSItemId = null;

window.abrirModalRSItem = (item) => {
    _editRSItemId = item ? item.id : null;
    document.getElementById('modal-rsitem-title').textContent = item ? 'Editar ítem' : 'Nuevo ítem';
    document.getElementById('rsi-nombre').value      = item ? item.nombre      : '';
    document.getElementById('rsi-descripcion').value = item ? (item.descripcion || '') : '';
    document.getElementById('rsi-precio').value      = item ? item.precio      : '';
    document.getElementById('rsi-categoria').value   = item ? item.categoria   : 'SNACKS';
    document.getElementById('rsi-disponible').checked = item ? item.disponible : true;
    document.getElementById('modal-rsitem-error').classList.add('d-none');
    document.getElementById('modal-rs-item').style.display = 'flex';
};

window.cerrarModalRSItem = () => {
    document.getElementById('modal-rs-item').style.display = 'none';
};

window.guardarRSItem = async () => {
    var nombre      = document.getElementById('rsi-nombre').value.trim();
    var descripcion = document.getElementById('rsi-descripcion').value.trim();
    var precio      = document.getElementById('rsi-precio').value;
    var categoria   = document.getElementById('rsi-categoria').value;
    var disponible  = document.getElementById('rsi-disponible').checked;
    var errEl       = document.getElementById('modal-rsitem-error');

    if (!nombre || !precio || parseFloat(precio) <= 0) {
        errEl.textContent = 'Nombre y precio (mayor que 0) son obligatorios.';
        errEl.classList.remove('d-none'); return;
    }

    var url    = _editRSItemId ? '/api/room-service/items/' + _editRSItemId : '/api/room-service/items';
    var method = _editRSItemId ? 'PUT' : 'POST';

    try {
        var res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion: descripcion || null, precio: parseFloat(precio), categoria, disponible }),
        });
        if (res.ok || res.status === 201) {
            _rsItemsCache = null;
            cerrarModalRSItem();
            loadAdminRoomService();
        } else if (res.status === 404) {
            errEl.textContent = 'Ítem no encontrado.';
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = 'Error al guardar.';
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión.';
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarRSItem = async (id) => {
    if (!confirm('¿Eliminar este ítem de la carta?')) return;
    try {
        var res = await fetch('/api/room-service/items/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _rsItemsCache = null;
            loadAdminRoomService();
        } else if (res.status === 409) {
            alert('No se puede eliminar: hay pedidos activos que usan este ítem. Márcalo como no disponible primero.');
        } else {
            alert('No se pudo eliminar el ítem.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

// ── ADMIN: USUARIOS ───────────────────────────────────────────────────────────

async function loadAdminUsuarios() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/admin/usuarios'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">Error de conexión.</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">No se pudieron cargar los usuarios.</p>'; return; }
    var usuarios = await res.json();

    body.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr></thead>
            <tbody>
                ${usuarios.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td style="color:var(--cream);">${u.nombre || '—'}</td>
                        <td style="color:var(--text-muted-custom);">${u.email}</td>
                        <td><span class="admin-badge ${u.rol === 'ROLE_ADMIN' ? 'admin-badge--admin' : ''}">${u.rol === 'ROLE_ADMIN' ? 'ADMIN' : 'CLIENTE'}</span></td>
                        <td><button class="admin-btn admin-btn--danger" onclick="adminEliminarUsuario(${u.id})">Eliminar</button></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

window.adminEliminarUsuario = async (id) => {
    if (!confirm('¿Eliminar este usuario? Se cancelarán todas sus reservas.')) return;
    try {
        var res = await fetch('/api/admin/usuarios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminUsuarios();
        } else if (res.status === 400) {
            var data = await res.text();
            alert(data || 'No se puede eliminar este usuario.');
        } else {
            alert('No se pudo eliminar el usuario.');
        }
    } catch (_) { alert('Error de conexión.'); }
};

