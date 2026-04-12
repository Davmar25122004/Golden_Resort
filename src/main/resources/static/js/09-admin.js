// ── PANEL ADMIN ───────────────────────────────────────────────────────────────

window.showAdmin = async () => {
    var _mc = document.getElementById('main-content');
    var _dv = document.getElementById('dynamic-view');
    if (_mc) _mc.style.display = 'block';
    if (_dv) _dv.innerHTML = `
        <p class="section-label">${t('admin_label')}</p>
        <h2 class="serif mb-2" style="color:var(--cream); font-size:2.5rem;">${t('admin_title')}</h2>
        <div class="gold-line mb-4"></div>

        <div class="admin-tabs-bar mb-4">
            <button class="admin-tab-btn active" id="atab-dashboard"    onclick="switchAdminTab('dashboard')">${t('admin_tab_dashboard')}</button>
            <button class="admin-tab-btn"        id="atab-reservas"     onclick="switchAdminTab('reservas')">${t('admin_tab_bookings')}</button>
            <button class="admin-tab-btn"        id="atab-habitaciones" onclick="switchAdminTab('habitaciones')">${t('admin_tab_rooms')}</button>
            <button class="admin-tab-btn"        id="atab-servicios"    onclick="switchAdminTab('servicios')">${t('admin_tab_services')}</button>
            <button class="admin-tab-btn"        id="atab-roomservice"  onclick="switchAdminTab('roomservice')">${t('admin_tab_rs')}</button>
            <button class="admin-tab-btn"        id="atab-usuarios"     onclick="switchAdminTab('usuarios')">${t('admin_tab_users')}</button>
        </div>

        <div id="admin-tab-body" style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">${t('admin_loading')}</div>
    `;

    switchAdminTab('dashboard');
};

window.switchAdminTab = (tab) => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    var btn = document.getElementById('atab-' + tab);
    if (btn) btn.classList.add('active');
    var body = document.getElementById('admin-tab-body');
    if (!body) return;
    body.innerHTML = '<div style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; padding:20px 0;">' + t('admin_loading') + '</div>';

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
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_stats') + '</p>'; return; }
    var s = await res.json();

    var ocupPct = s.totalHabitaciones > 0
        ? Math.round((s.ocupadasHoy / s.totalHabitaciones) * 100) : 0;

    var proximasHtml = s.proximasLlegadas && s.proximasLlegadas.length > 0
        ? `<table class="admin-table mt-3">
               <thead><tr><th>${t('adm_col_client')}</th><th>${t('adm_col_room')}</th><th>${t('adm_col_type')}</th><th>${t('adm_col_arrival')}</th><th>${t('adm_col_departure')}</th></tr></thead>
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
        : '<p style="color:var(--text-muted-custom); font-size:0.8rem; margin-top:12px; letter-spacing:1px;">' + t('adm_no_arrivals') + '</p>';

    body.innerHTML = `
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_today')}</p>
                <p class="admin-stat-value">${s.reservasHoy}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_month')}</p>
                <p class="admin-stat-value">${s.reservasMes}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_revenue')}</p>
                <p class="admin-stat-value">${parseFloat(s.ingresosMes).toFixed(2)} €</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_occupancy')}</p>
                <p class="admin-stat-value">${s.ocupadasHoy} / ${s.totalHabitaciones} <small style="font-size:1rem;">(${ocupPct}%)</small></p>
            </div>
        </div>

        <div class="mt-5">
            <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:4px;">${t('adm_upcoming')}</p>
            <div class="gold-line" style="width:60px; margin-bottom:0;"></div>
            ${proximasHtml}
        </div>`;
}

// ── ADMIN: RESERVAS ───────────────────────────────────────────────────────────

var _cachedReservasAdmin = [];

async function loadAdminReservas() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/reservas'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_res_error') + '</p>'; return; }
    
    var reservas = await res.json();
    _cachedReservasAdmin = reservas;

    if (!reservas || reservas.length === 0) {
        body.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">' + t('adm_res_no_data') + '</p>';
        return;
    }

    body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="font-size:0.85rem; color:var(--cream);">
                Filtrar por mes: 
                <select id="admin-res-month-filter" class="admin-form-input" style="display:inline-block; width:auto; margin-left:10px; padding:6px 12px; cursor:pointer;" onchange="filtrarReservasMes()">
                    <option value="ALL">Todas</option>
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                </select>
            </div>
        </div>
        <div id="admin-res-table-container"></div>
    `;

    renderReservasTable(_cachedReservasAdmin);
}

window.filtrarReservasMes = () => {
    var month = document.getElementById('admin-res-month-filter').value;
    if (month === 'ALL') {
        renderReservasTable(_cachedReservasAdmin);
        return;
    }
    
    var targetMonthZeroIndexed = parseInt(month) - 1;
    var filtered = _cachedReservasAdmin.filter(r => {
        var dIn = new Date(r.fechaEntrada);
        var dOut = new Date(r.fechaSalida);
        var current = new Date(dIn);
        while(current <= dOut) {
            if(current.getMonth() === targetMonthZeroIndexed) return true;
            current.setDate(current.getDate() + 1);
        }
        return false;
    });

    renderReservasTable(filtered);
};

window.renderReservasTable = (reservas) => {
    var container = document.getElementById('admin-res-table-container');
    if (!reservas || reservas.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">No hay reservas que coincidan con este mes.</p>';
        return;
    }

    var tipoLabels = { NORMAL: 'Normal', DOBLE: 'Doble', SUITE: 'Suite', LUJO: 'Lujo' };

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th><th>${t('adm_col_client')}</th><th>${t('adm_col_room')}</th><th>${t('adm_col_arrival')}</th><th>${t('adm_col_departure')}</th>
                    <th>${t('adm_res_services')}</th><th>${t('adm_res_total')}</th><th></th>
                </tr>
            </thead>
            <tbody>
                ${reservas.map(r => {
                    var serviciosStr = r.servicios && r.servicios.length > 0
                        ? r.servicios.map(s => s.nombre).join(', ')
                        : '';

                    if (r.pedidosRoomService && r.pedidosRoomService.length > 0) {
                        window._rsData = window._rsData || {};
                        window._rsData[r.id] = { items: r.pedidosRoomService, total: r.subtotalRoomService };
                    }

                    var rsBadge = (r.pedidosRoomService && r.pedidosRoomService.length > 0)
                        ? `<button onclick="toggleRSPopover(event,${r.id})" style="display:inline-flex;align-items:center;gap:5px;margin-top:${serviciosStr ? 6 : 0}px;background:rgba(185,149,77,0.1);border:1px solid rgba(185,149,77,0.35);color:var(--gold);font-size:0.7rem;letter-spacing:1px;padding:4px 10px;border-radius:20px;cursor:pointer;transition:background 0.2s;font-family:inherit;" onmouseover="this.style.background='rgba(185,149,77,0.22)'" onmouseout="this.style.background='rgba(185,149,77,0.1)'"> Room Service <span style="background:rgba(185,149,77,0.28);border-radius:10px;padding:1px 6px;font-size:0.62rem;margin-left:2px;">${r.pedidosRoomService.length}</span></button>`
                        : '';

                    if (!serviciosStr && !rsBadge) serviciosStr = '—';
                    return `<tr>
                        <td>${r.id}</td>
                        <td><span style="color:var(--cream);">${r.clienteNombre || '—'}</span><br><small style="color:var(--text-muted-custom);">${r.clienteEmail || ''}</small></td>
                        <td>
                            <span class="admin-badge">${tipoLabels[r.habitacionTipo] || r.habitacionTipo}</span><br>
                            <small style="color:var(--text-muted-custom); margin-top:4px; display:inline-block;">nº ${r.habitacionNumero}</small>
                        </td>
                        <td>${formatFecha(r.fechaEntrada)}</td>
                        <td>${formatFecha(r.fechaSalida)}</td>
                        <td style="font-size:0.75rem;">${serviciosStr}${rsBadge ? (serviciosStr ? '<br>' : '') + rsBadge : ''}</td>
                        <td style="color:var(--gold); white-space:nowrap;">${parseFloat(r.total).toFixed(2)} €</td>
                        <td>
                            <div style="display:flex; gap:8px; justify-content:flex-end;">
                                <button class="admin-btn" style="background:rgba(255,255,255,0.05); color:var(--gold); border:1px solid rgba(185,149,77,0.4);" onclick='adminModificarReserva(${JSON.stringify(r).replace(/'/g, "&#39;")})'>${t('adm_res_modify')}</button>
                                <button class="admin-btn admin-btn--danger" onclick="adminCancelarReserva(${r.id})">${t('adm_res_cancel')}</button>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// ── POPOVER ROOM SERVICE ─────────────────────────────────────────────────────

window.toggleRSPopover = (evt, reservaId) => {
    evt.stopPropagation();
    var existing = document.getElementById('rs-pop-global');
    var sameBtn  = window._rsPopBtn === evt.currentTarget;
    if (existing) { existing.remove(); window._rsPopBtn = null; }
    if (sameBtn) return;

    window._rsPopBtn = evt.currentTarget;
    var data = (window._rsData || {})[reservaId];
    if (!data) return;

    var rect = evt.currentTarget.getBoundingClientRect();

    var itemsHtml = data.items.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(185,149,77,0.1);">
            <div>
                <span style="color:var(--cream);font-size:0.82rem;">${p.nombre}</span>
                <span style="color:var(--text-muted-custom);font-size:0.7rem;margin-left:4px;">×${p.cantidad}</span>
            </div>
            <span style="color:var(--gold);font-size:0.82rem;font-weight:600;white-space:nowrap;margin-left:12px;">
                ${p.precio ? (parseFloat(p.precio) * p.cantidad).toFixed(2) + ' €' : ''}
            </span>
        </div>`).join('');

    var total = data.total ? parseFloat(data.total).toFixed(2) + ' €' : '—';

    var pop = document.createElement('div');
    pop.id = 'rs-pop-global';
    pop.innerHTML = `
        <p style="font-size:0.6rem;letter-spacing:2.5px;color:var(--text-muted-custom);margin-bottom:12px;text-transform:uppercase;"> Pedido Room Service</p>
        ${itemsHtml}
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(185,149,77,0.25);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.68rem;letter-spacing:1px;color:var(--text-muted-custom);">SUBTOTAL</span>
            <span style="color:var(--gold);font-weight:700;font-size:0.95rem;">${total}</span>
        </div>`;

    Object.assign(pop.style, {
        position:    'fixed',
        zIndex:      '99999',
        background:  'linear-gradient(145deg,#1c1507,#181810)',
        border:      '1px solid rgba(185,149,77,0.45)',
        borderRadius:'10px',
        padding:     '16px 18px',
        minWidth:    '250px',
        maxWidth:    '320px',
        boxShadow:   '0 16px 48px rgba(0,0,0,0.75),0 0 0 1px rgba(185,149,77,0.08)',
        top:         (rect.bottom + 8) + 'px',
        left:        Math.min(rect.left, window.innerWidth - 340) + 'px',
    });

    document.body.appendChild(pop);

    // Animación de entrada
    pop.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:140,easing:'ease-out',fill:'forwards'});

    // Cerrar al click fuera
    setTimeout(() => {
        document.addEventListener('click', function closeRS(e) {
            if (!pop.contains(e.target)) {
                pop.animate([{opacity:1},{opacity:0,transform:'translateY(-4px)'}],{duration:100,easing:'ease-in',fill:'forwards'}).onfinish = () => pop.remove();
                window._rsPopBtn = null;
                document.removeEventListener('click', closeRS);
            }
        });
    }, 10);
};

window.adminCancelarReserva = async (id) => {
    if (!confirm(t('adm_res_confirm_cancel'))) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminReservas();
        } else {
            alert(t('adm_res_cancel_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
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
                <h3 class="serif mb-1" style="color:var(--cream); font-size:1.4rem;">${t('adm_mod_title')}${r.id}</h3>
                <p style="font-size:0.75rem; color:var(--text-muted-custom); margin-bottom:20px;">
                    ${r.clienteNombre} (${r.habitacionTipo} nº ${r.habitacionNumero})
                </p>

                <div class="mb-3 d-flex gap-2">
                    <div style="flex:1;">
                        <label class="admin-form-label">${t('adm_mod_arrival')}</label>
                        <input type="date" id="mod-llegada" class="admin-form-input" value="${dIn}" required>
                    </div>
                    <div style="flex:1;">
                        <label class="admin-form-label">${t('adm_mod_departure')}</label>
                        <input type="date" id="mod-salida" class="admin-form-input" value="${dOut}" required>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="admin-form-label mb-2">${t('adm_mod_add_services')}</label>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(185,149,77,0.2); border-radius:8px; padding:16px; max-height:180px; overflow-y:auto;">
                        ${servHtml || '<p style="color:var(--text-muted-custom);font-size:0.8rem;margin:0;">' + t('adm_mod_no_services') + '</p>'}
                    </div>
                </div>

                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarModificacionReserva(${r.id})">${t('adm_mod_save')}</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalModRe()">${t('adm_mod_cancel')}</button>
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
            alert(t('adm_mod_error') + msg);
        }
    } catch(e) {
        alert(t('adm_mod_error_conn'));
    }
};

// ── ADMIN: HABITACIONES (por tipo) ───────────────────────────────────────────

var TIPO_LABELS_ADMIN = {
    NORMAL: { label: 'tipo_normal' },
    DOBLE:  { label: 'tipo_doble'  },
    SUITE:  { label: 'tipo_suite'  },
    LUJO:   { label: 'tipo_lujo'   },
};

async function loadAdminHabitaciones() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/habitaciones'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_hab_error') + '</p>'; return; }
    var habitaciones = await res.json();

    // Agrupa por tipo
    var tipos = { NORMAL: [], DOBLE: [], SUITE: [], LUJO: [] };
    habitaciones.forEach(h => {
        if (tipos[h.tipo]) tipos[h.tipo].push(h);
    });

    var tipoOrder = ['NORMAL', 'DOBLE', 'SUITE', 'LUJO'];

    var cardsHtml = tipoOrder.map(tipo => {
        var lista = tipos[tipo];
        var _rawInfo = TIPO_LABELS_ADMIN[tipo] || { label: tipo };
        var info  = { label: t(_rawInfo.label) };
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
                ${count}${t('adm_hab_count')}
            </div>
            <!-- Contenido inferior -->
            <div style="position:relative; padding:20px 22px 22px;">
                <p style="margin:0 0 2px; font-size:0.6rem; letter-spacing:3px; color:rgba(255,255,255,0.5); text-transform:uppercase;">${tipo}</p>
                <p style="margin:0 0 6px; font-size:1.1rem; color:var(--cream); font-family:'Playfair Display',serif; font-weight:700;">${info.label}</p>
                <p style="margin:0 0 4px; font-size:1.6rem; color:var(--gold); font-weight:700; line-height:1;">${precio} <small style="font-size:0.85rem; color:rgba(255,255,255,0.5); font-weight:400;">€/noche</small></p>
                <p style="margin:0 0 16px; font-size:0.75rem; color:rgba(255,255,255,0.55); min-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${desc || t('adm_hab_no_desc')}</p>
                <button class="admin-btn" onclick="abrirModalTipo('${tipo}', ${precioVal}, '${descEsc}')" style="width:100%;">${t('adm_hab_edit')}</button>
            </div>
        </div>`;
    }).join('');

    body.innerHTML = `
        <div class="admin-stats-grid">${cardsHtml}</div>

        <!-- Modal editar tipo -->
        <div id="modal-tipo-hab" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:460px; margin:16px;">
                <h3 class="serif mb-1" id="modal-tipo-title" style="color:var(--cream); font-size:1.4rem;"></h3>
                <p style="font-size:0.72rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:24px;" id="modal-tipo-note"></p>
                <div class="mb-3">
                    <label class="admin-form-label" id="modal-tipo-price-lbl"></label>
                    <input type="number" id="tipo-precio" class="admin-form-input" step="0.01" min="0">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label" id="modal-tipo-desc-lbl"></label>
                    <input type="text" id="tipo-descripcion" class="admin-form-input">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label">Gestión de Imágenes (click para cambiar)</label>
                    <div id="modal-tipo-images" style="display:flex; gap:10px; margin-top:8px;"></div>
                </div>
                <div id="modal-tipo-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" id="btn-guardar-tipo" onclick="guardarTipoHabitacion()"></button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalTipo()"></button>
                </div>
            </div>
        </div>`;
}

var _editTipoActual = null;

window.abrirModalTipo = (tipo, precio, descripcion) => {
    _editTipoActual = tipo;
    var _rawInfo = TIPO_LABELS_ADMIN[tipo] || { label: tipo };
    document.getElementById('modal-tipo-title').textContent = t(_rawInfo.label);
    document.getElementById('modal-tipo-note').innerHTML    = t('adm_hab_modal_note');
    document.getElementById('modal-tipo-price-lbl').textContent = t('adm_hab_price_label');
    document.getElementById('modal-tipo-desc-lbl').textContent  = t('adm_hab_desc_label');
    document.getElementById('tipo-precio').placeholder      = t('adm_hab_price_placeholder');
    document.getElementById('tipo-descripcion').placeholder = t('adm_hab_desc_placeholder');
    document.getElementById('tipo-precio').value      = precio || '';
    document.getElementById('tipo-descripcion').value = descripcion || '';

    // Cargar imagenes actuales
    var imgsContainer = document.getElementById('modal-tipo-images');
    imgsContainer.innerHTML = '';
    var images = typeof TIPO_IMAGES !== 'undefined' ? (TIPO_IMAGES[tipo] || []) : [];
    images.forEach((imgUrl) => {
        imgsContainer.innerHTML += `
            <div style="position:relative; width:80px; height:60px; border-radius:6px; overflow:hidden; border:1px solid rgba(185,149,77,0.3);">
                <img src="${imgUrl}?t=${Date.now()}" style="width:100%; height:100%; object-fit:cover;">
                <label style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0; transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                    <span style="color:white; font-size:0.65rem;">Cambiar</span>
                    <input type="file" style="display:none;" accept="image/png, image/jpeg" onchange="uploadRoomImage('${tipo}', '${imgUrl}', this)">
                </label>
            </div>
        `;
    });
    document.getElementById('modal-tipo-error').classList.add('d-none');
    document.getElementById('btn-guardar-tipo').textContent = t('adm_hab_save');
    document.querySelector('#modal-tipo-hab .admin-btn--ghost').textContent = t('adm_hab_cancel');
    var modal = document.getElementById('modal-tipo-hab');
    modal.style.display = 'flex';
};

window.cerrarModalTipo = () => {
    document.getElementById('modal-tipo-hab').style.display = 'none';
};

window.uploadRoomImage = async (tipo, imgUrl, input) => {
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var formData = new FormData();
    
    var filename = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
    if (filename.indexOf('?') !== -1) {
        filename = filename.substring(0, filename.indexOf('?'));
    }

    formData.append('filename', filename);
    formData.append('file', file);

    try {
        var res = await fetch('/api/admin/habitaciones/tipo/' + tipo + '/imagen', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            abrirModalTipo(tipo, document.getElementById('tipo-precio').value, document.getElementById('tipo-descripcion').value);
            loadAdminHabitaciones();
        } else {
            var msg = await res.text();
            alert('Error al subir imagen: ' + msg);
        }
    } catch(e) {
        alert('Error de conexión al subir la imagen');
    }
};

window.guardarTipoHabitacion = async () => {
    var precio      = document.getElementById('tipo-precio').value;
    var descripcion = document.getElementById('tipo-descripcion').value.trim();
    var errEl       = document.getElementById('modal-tipo-error');
    var btn         = document.getElementById('btn-guardar-tipo');

    if (!precio || parseFloat(precio) <= 0) {
        errEl.textContent = t('adm_hab_price_error');
        errEl.classList.remove('d-none'); return;
    }

    btn.disabled    = true;
    btn.textContent = t('adm_hab_saving');

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
            errEl.textContent = t('adm_hab_not_found');
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = t('adm_hab_save_error');
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = t('adm_hab_conn_error');
        errEl.classList.remove('d-none');
    } finally {
        btn.disabled    = false;
        btn.textContent = t('adm_hab_save');
    }
};

// ── ADMIN: SERVICIOS ──────────────────────────────────────────────────────────

async function loadAdminServicios() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/servicios'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_svc_error') + '</p>'; return; }
    var servicios = await res.json();

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalServicio(null)">${t('adm_svc_new')}</button>
        </div>
        <table class="admin-table">
            <thead><tr><th>#</th><th>${t('adm_svc_col_name')}</th><th>${t('adm_svc_col_price')}</th><th></th></tr></thead>
            <tbody>
                ${servicios.map(s => `
                    <tr>
                        <td>${s.id}</td>
                        <td style="color:var(--cream);">${s.nombre}</td>
                        <td style="color:var(--gold);">${parseFloat(s.precio).toFixed(2)} €</td>
                        <td style="white-space:nowrap;">
                            <button class="admin-btn" onclick='abrirModalServicio(${JSON.stringify(s)})'>${t('adm_svc_edit')}</button>
                            <button class="admin-btn admin-btn--danger" onclick="adminEliminarServicio(${s.id})">${t('adm_svc_delete')}</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>

        <!-- Modal servicio -->
        <div id="modal-servicio" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:400px;">
                <h3 class="serif mb-4" id="modal-svc-title" style="color:var(--cream);"></h3>
                <div class="mb-3">
                    <label class="admin-form-label" id="svc-name-lbl"></label>
                    <input type="text" id="svc-nombre" class="admin-form-input">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label" id="svc-price-lbl"></label>
                    <input type="number" id="svc-precio" class="admin-form-input" step="0.01" min="0">
                </div>
                <div class="mb-4" id="svc-images-container" style="display:none;">
                    <label class="admin-form-label">Gestión de Imágenes (click para cambiar)</label>
                    <div id="modal-svc-images" style="display:flex; gap:10px; margin-top:8px; flex-wrap:wrap;"></div>
                </div>
                <div id="modal-svc-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarServicio()" id="btn-svc-save"></button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalServicio()" id="btn-svc-cancel"></button>
                </div>
            </div>
        </div>`;
}

var _editSvcId = null;

window.abrirModalServicio = (svc) => {
    _editSvcId = svc ? svc.id : null;
    document.getElementById('modal-svc-title').textContent = svc ? t('adm_svc_modal_edit') : t('adm_svc_modal_new');
    document.getElementById('svc-name-lbl').textContent    = t('adm_svc_name_label');
    document.getElementById('svc-price-lbl').textContent   = t('adm_svc_price_label');
    document.getElementById('svc-nombre').placeholder      = t('adm_svc_name_placeholder');
    document.getElementById('svc-precio').placeholder      = t('adm_svc_price_placeholder');
    document.getElementById('svc-nombre').value = svc ? svc.nombre : '';
    document.getElementById('svc-precio').value = svc ? svc.precio : '';

    var imagesContainer = document.getElementById('svc-images-container');
    var imgsDiv = document.getElementById('modal-svc-images');
    imgsDiv.innerHTML = '';
    
    if (svc && typeof SERVICIO_DATA !== 'undefined' && SERVICIO_DATA[svc.id] && SERVICIO_DATA[svc.id].images) {
        imagesContainer.style.display = 'block';
        var images = SERVICIO_DATA[svc.id].images;
        images.forEach((imgUrl) => {
            imgsDiv.innerHTML += `
                <div style="position:relative; width:80px; height:60px; border-radius:6px; overflow:hidden; border:1px solid rgba(185,149,77,0.3);">
                    <img src="${imgUrl}?t=${Date.now()}" style="width:100%; height:100%; object-fit:cover;">
                    <label style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0; transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                        <span style="color:white; font-size:0.65rem;">Cambiar</span>
                        <input type="file" style="display:none;" accept="image/png, image/jpeg" onchange="uploadSvcImage(${svc.id}, '${imgUrl}', this)">
                    </label>
                </div>
            `;
        });
    } else {
        imagesContainer.style.display = 'none';
    }

    document.getElementById('modal-svc-error').classList.add('d-none');
    document.getElementById('btn-svc-save').textContent   = t('adm_svc_save');
    document.getElementById('btn-svc-cancel').textContent = t('adm_svc_cancel');
    var modal = document.getElementById('modal-servicio');
    modal.style.display = 'flex';
};

window.cerrarModalServicio = () => {
    document.getElementById('modal-servicio').style.display = 'none';
};

window.uploadSvcImage = async (id, imgUrl, input) => {
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var formData = new FormData();
    
    var filename = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
    if (filename.indexOf('?') !== -1) {
        filename = filename.substring(0, filename.indexOf('?'));
    }

    formData.append('filename', filename);
    formData.append('file', file);

    try {
        var res = await fetch('/api/admin/servicios/' + id + '/imagen', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            var fakeSvc = { id: id, nombre: document.getElementById('svc-nombre').value, precio: document.getElementById('svc-precio').value };
            abrirModalServicio(fakeSvc);
            loadAdminServicios();
        } else {
            var msg = await res.text();
            alert('Error al subir imagen: ' + msg);
        }
    } catch(e) {
        alert('Error de conexión al subir la imagen');
    }
};

window.guardarServicio = async () => {
    var nombre = document.getElementById('svc-nombre').value.trim();
    var precio = document.getElementById('svc-precio').value;
    var errEl  = document.getElementById('modal-svc-error');

    if (!nombre || !precio) {
        errEl.textContent = t('adm_svc_req_error');
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
            errEl.textContent = t('adm_svc_dup_error');
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = t('adm_svc_save_error');
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = t('adm_svc_conn_error');
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarServicio = async (id) => {
    if (!confirm(t('adm_svc_del_confirm'))) return;
    try {
        var res = await fetch('/api/servicios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _serviciosCache = null;
            loadAdminServicios();
        } else {
            alert(t('adm_svc_del_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

// ── ADMIN: ROOM SERVICE ───────────────────────────────────────────────────────

async function loadAdminRoomService() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/room-service/items'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_rs_error') + '</p>'; return; }
    var items = await res.json();
    _rsItemsCache = null; // invalidar caché del frontend al editar desde admin

    var categorias = ['DESAYUNO','ALMUERZO','CENA','SNACKS','BEBIDAS'];
    var catLabels  = { DESAYUNO: t('cat_DESAYUNO'), ALMUERZO: t('cat_ALMUERZO'), CENA: t('cat_CENA'), SNACKS: t('cat_SNACKS'), BEBIDAS: t('cat_BEBIDAS') };

    var tablasPorCat = categorias.map(cat => {
        var catItems = items.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.7rem;letter-spacing:2px;color:var(--text-muted-custom);margin:18px 0 6px;text-transform:uppercase;">${catLabels[cat]}</p>
            <table class="admin-table">
                <thead><tr><th>#</th><th>${t('adm_rs_col_name')}</th><th>${t('adm_rs_col_price')}</th><th>${t('adm_rs_col_avail')}</th><th></th></tr></thead>
                <tbody>
                    ${catItems.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td style="color:var(--cream);">${item.nombre}</td>

                            <td style="color:var(--gold);">${parseFloat(item.precio).toFixed(2)} €</td>
                            <td>${item.disponible ? '<span class="admin-badge" style="color:#27ae60;">' + t('adm_rs_yes') + '</span>' : '<span class="admin-badge" style="color:#c0392b;">' + t('adm_rs_no') + '</span>'}</td>
                            <td style="white-space:nowrap;">
                                <button class="admin-btn" onclick='abrirModalRSItem(${JSON.stringify(item)})'>${t('adm_rs_edit')}</button>
                                <button class="admin-btn admin-btn--danger" onclick="adminEliminarRSItem(${item.id})">${t('adm_rs_delete')}</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }).join('');

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalRSItem(null)">${t('adm_rs_new')}</button>
        </div>
        ${tablasPorCat || '<p style="color:var(--text-muted-custom);font-size:0.8rem;letter-spacing:1px;margin-top:12px;">' + t('adm_rs_empty') + '</p>'}

        <!-- Modal ítem room service -->
        <div id="modal-rs-item" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:#1a1a1a;border:1px solid rgba(185,149,77,0.3);border-radius:12px;padding:32px;width:100%;max-width:460px;margin:16px;max-height:90vh;overflow-y:auto;">
                <h3 class="serif mb-4" id="modal-rsitem-title" style="color:var(--cream);"></h3>
                <div class="mb-3">
                    <label class="admin-form-label" id="rsi-name-lbl"></label>
                    <input type="text" id="rsi-nombre" class="admin-form-input">
                </div>

                <div class="mb-3">
                    <label class="admin-form-label" id="rsi-price-lbl"></label>
                    <input type="number" id="rsi-precio" class="admin-form-input" step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label" id="rsi-cat-lbl"></label>
                    <select id="rsi-categoria" class="admin-form-input" style="cursor:pointer;">
                        <option value="DESAYUNO"></option>
                        <option value="ALMUERZO"></option>
                        <option value="CENA"></option>
                        <option value="SNACKS"></option>
                        <option value="BEBIDAS"></option>
                    </select>
                </div>
                <div class="mb-4" style="display:flex;align-items:center;gap:10px;">
                    <input type="checkbox" id="rsi-disponible" checked style="accent-color:var(--gold);width:16px;height:16px;cursor:pointer;">
                    <label for="rsi-disponible" class="admin-form-label" id="rsi-avail-lbl" style="margin:0;cursor:pointer;"></label>
                </div>
                <div id="modal-rsitem-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarRSItem()" id="btn-rsi-save"></button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalRSItem()" id="btn-rsi-cancel"></button>
                </div>
            </div>
        </div>`;
}

var _editRSItemId = null;

window.abrirModalRSItem = (item) => {
    _editRSItemId = item ? item.id : null;
    document.getElementById('modal-rsitem-title').textContent = item ? t('adm_rs_modal_edit') : t('adm_rs_modal_new');
    document.getElementById('rsi-name-lbl').textContent  = t('adm_rs_name_label');

    document.getElementById('rsi-price-lbl').textContent = t('adm_rs_price_label');
    document.getElementById('rsi-cat-lbl').textContent   = t('adm_rs_cat_label');
    document.getElementById('rsi-avail-lbl').textContent = t('adm_rs_avail_label');
    document.getElementById('btn-rsi-save').textContent   = t('adm_rs_save');
    document.getElementById('btn-rsi-cancel').textContent = t('adm_rs_cancel');
    // Translate select options
    var catLabels2 = { DESAYUNO: t('cat_DESAYUNO'), ALMUERZO: t('cat_ALMUERZO'), CENA: t('cat_CENA'), SNACKS: t('cat_SNACKS'), BEBIDAS: t('cat_BEBIDAS') };
    document.querySelectorAll('#rsi-categoria option').forEach(function(opt) {
        opt.textContent = catLabels2[opt.value] || opt.value;
    });
    document.getElementById('rsi-nombre').value      = item ? item.nombre      : '';

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

    var precio      = document.getElementById('rsi-precio').value;
    var categoria   = document.getElementById('rsi-categoria').value;
    var disponible  = document.getElementById('rsi-disponible').checked;
    var errEl       = document.getElementById('modal-rsitem-error');

    if (!nombre || !precio || parseFloat(precio) <= 0) {
        errEl.textContent = t('adm_rs_req_error');
        errEl.classList.remove('d-none'); return;
    }

    var url    = _editRSItemId ? '/api/room-service/items/' + _editRSItemId : '/api/room-service/items';
    var method = _editRSItemId ? 'PUT' : 'POST';

    try {
        var res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio: parseFloat(precio), categoria, disponible }),
        });
        if (res.ok || res.status === 201) {
            _rsItemsCache = null;
            cerrarModalRSItem();
            loadAdminRoomService();
        } else if (res.status === 404) {
            errEl.textContent = t('adm_rs_not_found');
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = t('adm_rs_save_error');
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = t('adm_rs_conn_error');
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarRSItem = async (id) => {
    if (!confirm(t('adm_rs_del_confirm'))) return;
    try {
        var res = await fetch('/api/room-service/items/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _rsItemsCache = null;
            loadAdminRoomService();
        } else if (res.status === 409) {
            alert(t('adm_rs_del_active'));
        } else {
            alert(t('adm_rs_del_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

// ── ADMIN: USUARIOS ───────────────────────────────────────────────────────────

var _cachedUsuariosAdmin = [];

async function loadAdminUsuarios() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/admin/usuarios'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_usr_error') + '</p>'; return; }
    var usuarios = await res.json();
    _cachedUsuariosAdmin = usuarios;

    body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:20px;">
                <!-- Buscador por nombre/email -->
                <div style="font-size:0.85rem; color:var(--cream);">
                    Buscar: 
                    <input type="text" id="admin-usr-search" class="admin-form-input" 
                           placeholder="Nombre o email..." 
                           style="display:inline-block; width:200px; margin-left:10px; padding:6px 12px;" 
                           oninput="filtrarUsuarios()">
                </div>
                <!-- Filtro por rol -->
                <div style="font-size:0.85rem; color:var(--cream);">
                    Filtrar por rol: 
                    <select id="admin-usr-role-filter" class="admin-form-input" 
                            style="display:inline-block; width:auto; margin-left:10px; padding:6px 12px; cursor:pointer;" 
                            onchange="filtrarUsuarios()">
                        <option value="ALL">Todos</option>
                        <option value="ROLE_ADMIN">Admin</option>
                        <option value="ROLE_USER">Cliente</option>
                    </select>
                </div>
            </div>
        </div>
        <div id="admin-usr-table-container"></div>
    `;

    renderUsuariosTable(_cachedUsuariosAdmin);
}

window.filtrarUsuarios = () => {
    var query = (document.getElementById('admin-usr-search').value || "").toLowerCase();
    var role  = (document.getElementById('admin-usr-role-filter').value || "ALL");
    
    var filtered = _cachedUsuariosAdmin.filter(u => {
        // 1. Filtro por búsqueda de texto
        var nombre = (u.nombre || "").toLowerCase();
        var email  = (u.email  || "").toLowerCase();
        var matchesText = nombre.includes(query) || email.includes(query);
        
        // 2. Filtro por rol
        var matchesRole = true;
        if (role === 'ROLE_ADMIN') matchesRole = (u.rol === 'ROLE_ADMIN');
        if (role === 'ROLE_USER')  matchesRole = (u.rol !== 'ROLE_ADMIN');
        
        return matchesText && matchesRole;
    });

    renderUsuariosTable(filtered);
};


window.renderUsuariosTable = (usuarios) => {
    var container = document.getElementById('admin-usr-table-container');
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">No hay usuarios que coincidan con este rol.</p>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>#</th><th>${t('adm_usr_col_name')}</th><th>${t('adm_usr_col_email')}</th><th>${t('adm_usr_col_role')}</th><th></th></tr></thead>
            <tbody>
                ${usuarios.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td style="color:var(--cream);">${u.nombre || '—'}</td>
                        <td style="color:var(--text-muted-custom);">${u.email}</td>
                        <td><span class="admin-badge ${u.rol === 'ROLE_ADMIN' ? 'admin-badge--admin' : ''}">${u.rol === 'ROLE_ADMIN' ? 'ADMIN' : 'CLIENTE'}</span></td>
                        <td><button class="admin-btn admin-btn--danger" onclick="adminEliminarUsuario(${u.id})">${t('adm_usr_delete')}</button></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

window.adminEliminarUsuario = async (id) => {
    if (!confirm(t('adm_usr_del_confirm'))) return;
    try {
        var res = await fetch('/api/admin/usuarios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminUsuarios();
        } else if (res.status === 400) {
            var data = await res.text();
            alert(data || t('adm_usr_del_active'));
        } else {
            alert(t('adm_usr_del_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

