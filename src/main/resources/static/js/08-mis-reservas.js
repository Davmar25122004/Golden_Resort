// ── HELPERS MIS RESERVAS ──────────────────────────────────────────────────────

function calcularEstado(fechaEntrada, fechaSalida) {
    var hoy   = new Date(); hoy.setHours(0,0,0,0);
    var entrada = new Date(fechaEntrada + 'T00:00:00');
    var salida  = new Date(fechaSalida  + 'T00:00:00');
    if (hoy < entrada) return 'PROXIMA';
    if (hoy >= salida) return 'PASADA';
    return 'EN_CURSO';
}

function formatFecha(dateStr) {
    var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var parts = dateStr.split('-');
    return parts[2] + ' ' + meses[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

// ── MIS RESERVAS ──────────────────────────────────────────────────────────────

window.showMisReservas = async () => {
    history.pushState({ view: 'mis-reservas' }, '', '/mis-reservas');
    showDynamic(`
        <p class="section-label">Tu historial</p>
        <h2 class="serif mb-2" style="color:var(--cream); font-size:2.5rem;">Mis Reservas</h2>
        <div class="gold-line mb-5"></div>
        <div id="reservas-container" style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">
            Cargando...
        </div>
    `);

    var res;
    try {
        res = await fetch('/api/reservas/mis-reservas');
    } catch (_) {
        document.getElementById('reservas-container').textContent = 'Error de conexión.';
        return;
    }

    if (res.status === 401) { openAuthModal(); return; }
    if (!res.ok) {
        document.getElementById('reservas-container').textContent = 'No se pudieron cargar las reservas.';
        return;
    }

    var reservas = await res.json();
    var container = document.getElementById('reservas-container');

    if (!reservas || reservas.length === 0) {
        container.innerHTML = `
            <div class="reserva-empty">
                <p class="reserva-empty-title">Todavía no tienes reservas</p>
                <p class="reserva-empty-sub">Explora nuestras habitaciones y encuentra la tuya</p>
                <button class="btn-reserva-empty" onclick="goHome()">Explorar habitaciones</button>
            </div>`;
        return;
    }

    var estadoOrder = { EN_CURSO: 0, PROXIMA: 1, PASADA: 2 };
    reservas.sort((a, b) => {
        var ea = calcularEstado(a.fechaEntrada, a.fechaSalida);
        var eb = calcularEstado(b.fechaEntrada, b.fechaSalida);
        if (estadoOrder[ea] !== estadoOrder[eb]) return estadoOrder[ea] - estadoOrder[eb];
        if (ea === 'PROXIMA') return new Date(a.fechaEntrada) - new Date(b.fechaEntrada);
        return new Date(b.fechaEntrada) - new Date(a.fechaEntrada);
    });

        var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };

    var html = '<div class="reservas-list">';
    reservas.forEach(r => {
        var estado  = calcularEstado(r.fechaEntrada, r.fechaSalida);
        var noches  = Math.max(1, Math.round(
            (new Date(r.fechaSalida + 'T00:00:00') - new Date(r.fechaEntrada + 'T00:00:00')) / 86400000
        ));
        var total   = r.total ? parseFloat(r.total).toFixed(2) : (parseFloat(r.precioNoche) * noches).toFixed(2);
        var img     = (TIPO_IMAGES[r.habitacionTipo] || [])[0] || '';
        var label   = tipoLabels[r.habitacionTipo] || r.habitacionTipo;
        var serviciosHtml = (r.servicios && r.servicios.length > 0)
            ? `<p class="reserva-meta" style="margin-top:4px; font-size:0.75rem;">
                   Servicios: ${r.servicios.map(s => `${s.nombre} ×${s.cantidad}`).join(' · ')}
               </p>`
            : '';

        var badgeStyle, badgeText;
        if (estado === 'EN_CURSO') {
            badgeStyle = 'background:rgba(39,174,96,0.15); color:#27ae60;';
            badgeText  = '● EN CURSO';
        } else if (estado === 'PROXIMA') {
            badgeStyle = 'background:rgba(185,149,77,0.15); color:var(--gold);';
            badgeText  = '● PRÓXIMA';
        } else {
            badgeStyle = 'background:rgba(154,154,154,0.1); color:var(--text-muted-custom);';
            badgeText  = '● PASADA';
        }

        var cancelBtn = estado === 'PROXIMA'
            ? `<button class="btn-cancelar" onclick="cancelarReserva(${r.id})">Cancelar reserva</button>`
            : '';

        var gestionRsBtn = (estado === 'PROXIMA' || estado === 'EN_CURSO')
            ? `<button class="admin-btn" style="margin-top:8px; font-size:0.75rem; padding:6px 14px;" onclick="abrirGestionRS(${r.id})">🍽 Gestionar Room Service</button>`
            : '';

        var rsSubtotalStr;
        if (r.pedidosRoomService && r.pedidosRoomService.length > 0) {
            var itemsHtml = r.pedidosRoomService.map(p =>
                `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:6px;margin-bottom:4px;
                              background:rgba(185,149,77,0.1);border:1px solid rgba(185,149,77,0.25);
                              border-radius:20px;padding:2px 10px;font-size:0.72rem;color:var(--cream);">
                    ${p.nombre}&nbsp;<strong style="color:var(--gold);">×${p.cantidad}</strong>
                    <span style="color:var(--text-muted-custom);margin-left:2px;">${parseFloat(p.subtotal).toFixed(2)} €</span>
                </span>`
            ).join('');
            rsSubtotalStr = `<div id="rs-info-${r.id}" style="margin-top:8px;">
                <p class="reserva-meta" style="font-size:0.7rem;letter-spacing:1px;color:var(--text-muted-custom);margin-bottom:6px;">ROOM SERVICE</p>
                <div style="display:flex;flex-wrap:wrap;gap:2px;">${itemsHtml}</div>
                <p class="reserva-meta" style="font-size:0.75rem;margin-top:6px;">
                    Total: <strong style="color:var(--gold);">${parseFloat(r.subtotalRoomService).toFixed(2)} €</strong>
                </p>
            </div>`;
        } else {
            rsSubtotalStr = `<p class="reserva-meta" style="font-size:0.75rem;color:var(--text-muted-custom);" id="rs-info-${r.id}">Sin pedido de room service</p>`;
        }

        html += `
            <div class="reserva-card${estado === 'PASADA' ? ' reserva-card--pasada' : ''}">
                ${img ? `<img class="reserva-card-img" src="${img}" alt="${label}">` : ''}
                <div class="reserva-card-body">
                    <div class="reserva-card-header">
                        <div>
                            <p class="reserva-tipo-label">${label}</p>
                            <p class="reserva-hab-num">Habitación nº ${r.habitacionNumero}</p>
                        </div>
                        <span class="reserva-estado-badge" style="${badgeStyle}">${badgeText}</span>
                    </div>
                    <p class="reserva-dates">
                        ${formatFecha(r.fechaEntrada)}
                        <span>→</span>
                        ${formatFecha(r.fechaSalida)}
                    </p>
                    <p class="reserva-meta">
                        ${noches} noche${noches > 1 ? 's' : ''} &nbsp;·&nbsp;
                        Total: <strong>${total} €</strong>
                    </p>
                    ${serviciosHtml}
                    ${rsSubtotalStr}
                    ${gestionRsBtn}
                    ${cancelBtn}
                </div>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
};

window.cancelarReserva = async (id) => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            showMisReservas();
        } else {
            alert('No se pudo cancelar la reserva. Inténtalo de nuevo.');
        }
    } catch (_) {
        alert('Error de conexión al cancelar.');
    }
};

// ── GESTIÓN ROOM SERVICE DESDE MIS RESERVAS ───────────────────────────────────

window.abrirGestionRS = async (reservaId) => {
    var items, pedidosActuales;
    try {
        var [resItems, resPedidos] = await Promise.all([
            fetch('/api/room-service/items'),
            fetch('/api/room-service/pedidos/' + reservaId),
        ]);
        items          = resItems.ok  ? await resItems.json()  : [];
        pedidosActuales = resPedidos.ok ? await resPedidos.json() : [];
    } catch (_) {
        alert('Error al cargar la carta.'); return;
    }

    // Mapa pedidoId → cantidad actual para ítems ya pedidos
    var pedidoMap = {};
    pedidosActuales.forEach(p => { pedidoMap[p.itemId] = { pedidoId: p.pedidoId, cantidad: p.cantidad }; });

    var categorias = ['DESAYUNO','ALMUERZO','CENA','SNACKS','BEBIDAS'];
    var catLabels  = { DESAYUNO:'Desayuno', ALMUERZO:'Almuerzo', CENA:'Cena', SNACKS:'Snacks', BEBIDAS:'Bebidas' };
    var disponibles = items.filter(i => i.disponible);

    var cartaRows = categorias.map(cat => {
        var catItems = disponibles.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.65rem;letter-spacing:2px;color:var(--text-muted-custom);margin:14px 0 8px;text-transform:uppercase;">${catLabels[cat]}</p>
            ${catItems.map(item => {
                var qtyActual = pedidoMap[item.id] ? pedidoMap[item.id].cantidad : 0;
                return `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <span style="flex:1;font-size:0.83rem;color:var(--cream);">${item.nombre}</span>
                    <span style="color:var(--gold);font-size:0.83rem;flex-shrink:0;">${parseFloat(item.precio).toFixed(2)} €</span>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        <button type="button" onclick="grsAjustar(${item.id},-1)"
                            style="background:rgba(255,255,255,0.07);border:1px solid rgba(185,149,77,0.3);color:var(--cream);width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:1rem;line-height:1;padding:0;">−</button>
                        <span id="grs-qty-${item.id}" style="min-width:18px;text-align:center;font-size:0.85rem;color:var(--cream);">${qtyActual}</span>
                        <button type="button" onclick="grsAjustar(${item.id},1)"
                            style="background:rgba(255,255,255,0.07);border:1px solid rgba(185,149,77,0.3);color:var(--cream);width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:1rem;line-height:1;padding:0;">+</button>
                    </div>
                </div>`;
            }).join('')}`;
    }).join('');

    // Crear modal
    var modalEl = document.createElement('div');
    modalEl.id  = 'modal-gestion-rs';
    modalEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modalEl.innerHTML = `
        <div style="background:#141414;border:1px solid rgba(185,149,77,0.35);border-radius:14px;padding:28px;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;">
            <p style="font-size:0.65rem;letter-spacing:3px;color:var(--text-muted-custom);margin-bottom:4px;">ROOM SERVICE</p>
            <h3 class="serif" style="color:var(--cream);font-size:1.4rem;margin-bottom:4px;">Carta del Room Service</h3>
            <div class="gold-line mb-4" style="width:60px;"></div>
            ${cartaRows || '<p style="color:var(--text-muted-custom);font-size:0.8rem;">No hay ítems disponibles.</p>'}
            <p id="grs-subtotal" style="color:var(--gold);font-size:0.88rem;font-weight:600;margin-top:14px;letter-spacing:1px;"></p>
            <div id="grs-msg" style="display:none;font-size:0.8rem;margin-top:8px;"></div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button class="btn-room" style="flex:1;padding:12px;" onclick="guardarPedidoRS(${reservaId})">Guardar cambios</button>
                <button class="admin-btn admin-btn--ghost" style="flex:1;" onclick="cerrarGestionRS()">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modalEl);

    // Guardar referencia a pedidoMap para guardarPedidoRS
    window._grsPedidoMap    = pedidoMap;
    window._grsItems        = items;
    window._grsReservaId    = reservaId;

    grsActualizarSubtotal();
};

window.grsAjustar = (itemId, delta) => {
    var el = document.getElementById('grs-qty-' + itemId);
    if (!el) return;
    el.textContent = Math.max(0, (parseInt(el.textContent) || 0) + delta);
    grsActualizarSubtotal();
};

function grsActualizarSubtotal() {
    var subtotal = 0;
    document.querySelectorAll('[id^="grs-qty-"]').forEach(el => {
        var qty = parseInt(el.textContent) || 0;
        if (qty > 0) {
            var itemId = parseInt(el.id.replace('grs-qty-', ''));
            var item = (window._grsItems || []).find(i => i.id === itemId);
            if (item) subtotal += parseFloat(item.precio) * qty;
        }
    });
    var el = document.getElementById('grs-subtotal');
    if (el) el.textContent = subtotal > 0 ? 'Subtotal: ' + subtotal.toFixed(2) + ' €' : '';
}

window.cerrarGestionRS = () => {
    var m = document.getElementById('modal-gestion-rs');
    if (m) m.remove();
};

window.guardarPedidoRS = async (reservaId) => {
    var pedidoMap = window._grsPedidoMap || {};
    var calls = [];

    document.querySelectorAll('[id^="grs-qty-"]').forEach(el => {
        var itemId    = parseInt(el.id.replace('grs-qty-', ''));
        var nuevaQty  = parseInt(el.textContent) || 0;
        var existente = pedidoMap[itemId];

        if (existente && nuevaQty === 0) {
            // Eliminar línea
            calls.push(fetch('/api/room-service/pedidos/' + existente.pedidoId, { method: 'DELETE' }));
        } else if (existente && nuevaQty !== existente.cantidad) {
            // Actualizar cantidad
            calls.push(fetch('/api/room-service/pedidos/' + existente.pedidoId, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cantidad: nuevaQty }),
            }));
        } else if (!existente && nuevaQty > 0) {
            // Nueva línea
            calls.push(fetch('/api/room-service/pedidos/' + reservaId, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, cantidad: nuevaQty }),
            }));
        }
    });

    var msgEl = document.getElementById('grs-msg');
    try {
        await Promise.all(calls);
        cerrarGestionRS();
        showMisReservas(); // refresca toda la vista para reflejar cambios
    } catch (_) {
        msgEl.style.display = 'block';
        msgEl.style.color   = '#c0392b';
        msgEl.textContent   = 'Error al guardar. Inténtalo de nuevo.';
    }
};

