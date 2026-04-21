// ── HELPERS MIS RESERVAS ──────────────────────────────────────────────────────

// (Date helpers moved to 04-ui-core.js for global availability)


// ── MIS RESERVAS ──────────────────────────────────────────────────────────────

window.showMisReservas = async () => {
    console.log("🟢 EVENTO: MIS RESERVAS CARGADO");
    var _mc = document.getElementById('main-content');
    var _dv = document.getElementById('dynamic-view');
    if (_mc) _mc.style.display = 'block';
    if (_dv) _dv.innerHTML = `
        <p class="section-label">${t('mr_label')}</p>
        <h2 class="serif mb-2" style="color:var(--cream); font-size:2.5rem;">${t('mr_title')}</h2>
        <div class="gold-line mb-5"></div>
        <div id="reservas-container" style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">
            ${t('mr_loading')}
        </div>
    `;

    await fetchRoomServiceItems();

    var res;
    try {
        res = await fetch('/api/reservas/mis-reservas');
    } catch (_) {
        document.getElementById('reservas-container').textContent = t('mr_error_conn');
        return;
    }

    if (res.status === 401) { openAuthModal(); return; }
    if (!res.ok) {
        document.getElementById('reservas-container').textContent = t('mr_error_load');
        return;
    }

    var reservas = await res.json();
    var container = document.getElementById('reservas-container');

    if (!reservas || reservas.length === 0) {
        container.innerHTML = `
            <div class="reserva-empty">
                <div class="reserva-empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
                        <rect x="8" y="28" width="48" height="26" rx="3" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 38h48" stroke="currentColor" stroke-width="2"/>
                        <rect x="16" y="38" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
                        <rect x="38" y="38" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M20 28v-6a12 12 0 0 1 24 0v6" stroke="currentColor" stroke-width="2"/>
                        <circle cx="32" cy="33" r="2" fill="currentColor"/>
                    </svg>
                </div>
                <div class="reserva-empty-deco">
                    <span></span><span class="reserva-empty-diamond">◆</span><span></span>
                </div>
                <p class="reserva-empty-title">${t('mr_empty_title')}</p>
                <p class="reserva-empty-sub">${t('mr_empty_sub')}</p>
                <button class="btn-reserva-empty" onclick="goHome(); setTimeout(()=>scrollToSection('habitaciones'),300)">
                    ${t('mr_empty_btn')}
                </button>
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

        var tipoLabels = { NORMAL: t('tipo_normal'), DOBLE: t('tipo_doble'), SUITE: t('tipo_suite'), LUJO: t('tipo_lujo') };

    var html = '<div class="reservas-list">';
    reservas.forEach(r => {
        var estado  = calcularEstado(r.fechaEntrada, r.fechaSalida);
        var noches  = Math.max(1, Math.round(
            (new Date(r.fechaSalida + 'T00:00:00') - new Date(r.fechaEntrada + 'T00:00:00')) / 86400000
        ));
        
        var totalHabitacion = (parseFloat(r.precioNoche) * noches).toFixed(2);
        var precioTotal       = r.total ? parseFloat(r.total).toFixed(2) : totalHabitacion;
        
        var img     = (TIPO_IMAGES[r.habitacionTipo] || [])[0] || '';
        var label   = tipoLabels[r.habitacionTipo] || r.habitacionTipo;
        
        var serviciosHtml = '';
        if (r.servicios && r.servicios.length > 0) {
            var totalServicios = 0;
            r.servicios.forEach(s => {
                totalServicios += parseFloat(s.precio) * s.cantidad;
            });
            serviciosHtml = `
               <div style="margin-top:12px;">
                   <p class="reserva-meta" style="font-size:0.75rem;">
                       ${t('mr_services_extra')}${r.servicios.map(s => { var nombreMostrar = s.nombre; if (typeof LANG !== 'undefined' && LANG === 'en' && typeof _serviciosCache !== 'undefined' && _serviciosCache) { var cached = _serviciosCache.find(c => c.nombre === s.nombre); if (cached && typeof SERVICIO_NOMBRES_EN !== 'undefined' && SERVICIO_NOMBRES_EN[cached.id]) nombreMostrar = SERVICIO_NOMBRES_EN[cached.id]; } return `${nombreMostrar} ×${s.cantidad}`; }).join(' · ')}
                   </p>
                   <p class="reserva-meta" style="font-size:0.75rem; margin-top:4px;">
                       ${t('mr_services_total')}<strong style="color:var(--gold);">${totalServicios.toFixed(2)} €</strong>
                   </p>
               </div>`;
        }

        var badgeStyle, badgeText;
        if (estado === 'EN_CURSO') {
            badgeStyle = 'background:rgba(39,174,96,0.15); color:#27ae60;';
            badgeText  = t('mr_badge_active');
        } else if (estado === 'PROXIMA') {
            badgeStyle = 'background:rgba(185,149,77,0.15); color:var(--gold);';
            badgeText  = t('mr_badge_upcoming');
        } else {
            badgeStyle = 'background:rgba(154,154,154,0.1); color:var(--text-muted-custom);';
            badgeText  = t('mr_badge_past');
        }

        var cancelBtn = estado === 'PROXIMA'
            ? `<button class="btn-cancelar" onclick="cancelarReserva(${r.id})">${t('mr_cancel')}</button>`
            : '';

        var gestionRsBtn = (estado === 'PROXIMA' || estado === 'EN_CURSO')
            ? `<button class="admin-btn" style="margin-top:8px; font-size:0.75rem; padding:6px 14px;" onclick="abrirGestionRS(${r.id})">${t('mr_manage_rs')}</button>`
            : '';

        var rsSubtotalStr;
        if (r.pedidosRoomService && r.pedidosRoomService.length > 0) {
            var itemsHtml = r.pedidosRoomService.map(p =>
                `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:6px;margin-bottom:4px;
                              background:rgba(185,149,77,0.1);border:1px solid rgba(185,149,77,0.25);
                              border-radius:20px;padding:2px 10px;font-size:0.72rem;color:var(--cream);">
                    ${(() => { if (typeof LANG !== 'undefined' && LANG === 'en' && typeof _rsItemsCache !== 'undefined' && _rsItemsCache) { var ci = _rsItemsCache.find(c => c.nombre === p.nombre); if (ci && typeof RS_ITEMS_EN !== 'undefined' && RS_ITEMS_EN[ci.id]) return RS_ITEMS_EN[ci.id]; } return p.nombre; })()}&nbsp;<strong style="color:var(--gold);">×${p.cantidad}</strong>
                    <span style="color:var(--text-muted-custom);margin-left:2px;">${parseFloat(p.subtotal).toFixed(2)} €</span>
                </span>`
            ).join('');
            rsSubtotalStr = `<div id="rs-info-${r.id}" style="margin-top:12px;">
                <p class="reserva-meta" style="font-size:0.7rem;letter-spacing:1px;color:var(--text-muted-custom);margin-bottom:6px;">${t('mr_rs_label')}</p>
                <div style="display:flex;flex-wrap:wrap;gap:2px;">${itemsHtml}</div>
                <p class="reserva-meta" style="font-size:0.75rem;margin-top:6px;">
                    ${t('mr_rs_total')}<strong style="color:var(--gold);">${parseFloat(r.subtotalRoomService).toFixed(2)} €</strong>
                </p>
            </div>`;
        } else {
            rsSubtotalStr = `<div id="rs-info-${r.id}" style="margin-top:12px;"><p class="reserva-meta" style="font-size:0.75rem;color:var(--text-muted-custom);">${t('mr_rs_none')}</p></div>`;
        }

        var peticionHtml = '';
        if (r.peticionEspecial || estado === 'PROXIMA') {
            peticionHtml = `
                <div id="peticion-section-${r.id}" style="margin-top:14px; padding:12px 14px; background:rgba(185,149,77,0.06); border-left:2px solid rgba(185,149,77,0.35); border-radius:0 8px 8px 0;">
                    <p style="font-size:0.65rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:6px;">${t('mr_special_request_label')}</p>
                    <div id="peticion-display-${r.id}">
                        <p style="font-size:0.83rem; color:var(--cream); margin:0;">${
                            r.peticionEspecial
                                ? r.peticionEspecial.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                                : `<span style="color:var(--text-muted-custom); font-style:italic;">${t('mr_special_request_none')}</span>`
                        }</p>
                        ${estado === 'PROXIMA' ? `<button class="admin-btn" style="margin-top:8px; font-size:0.73rem; padding:5px 12px;" onclick="editarPeticion(${r.id}, this)">${t('mr_special_request_edit')}</button>` : ''}
                    </div>
                    <div id="peticion-edit-${r.id}" style="display:none;">
                        <textarea id="peticion-textarea-${r.id}" rows="3"
                            style="width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(185,149,77,0.3); color:var(--cream);
                                   padding:8px 12px; border-radius:6px; font-size:0.83rem; resize:vertical;
                                   font-family:inherit; box-sizing:border-box; margin-bottom:8px;"
                        >${r.peticionEspecial ? r.peticionEspecial.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}</textarea>
                        <div style="display:flex; gap:8px;">
                            <button class="btn-room" style="padding:7px 16px; font-size:0.75rem;" onclick="guardarPeticion(${r.id})">${t('mr_special_request_save')}</button>
                            <button class="admin-btn admin-btn--ghost" style="padding:7px 16px; font-size:0.75rem;" onclick="cancelarEditarPeticion(${r.id})">${t('mr_special_request_cancel')}</button>
                        </div>
                        <p id="peticion-msg-${r.id}" style="display:none; font-size:0.78rem; margin-top:6px;"></p>
                    </div>
                </div>`;
        }

        html += `
            <div class="reserva-card-luxury${estado === 'PASADA' ? ' reserva-card--pasada' : ''}">
                <div class="card-image-side">
                    ${img ? `<img class="card-img-luxury" src="${img}" alt="${label}">` : ''}
                    <div class="card-img-overlay"></div>
                    <span class="card-status-badge" style="${badgeStyle}">${badgeText}</span>
                </div>
                
                <div class="card-content-side">
                    <div class="card-title-row">
                        <div>
                            <p class="room-type-tag">${label}</p>
                            <p class="room-id-tag">${t('mr_room_num')}${r.habitacionNumero}</p>
                        </div>
                    </div>
                    
                    <div class="ticket-dates">
                        <div class="date-block">
                            <span class="d-label">${t('hero_checkin')}</span>
                            <span class="d-value">${formatFecha(r.fechaEntrada)}</span>
                        </div>
                        <div class="date-arrow">→</div>
                        <div class="date-block">
                            <span class="d-label">${t('hero_checkout')}</span>
                            <span class="d-value">${formatFecha(r.fechaSalida)}</span>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-col">
                            <p class="info-section-title">${t('mr_room_total')}</p>
                            <div class="service-item-mini">
                                <span>${noches} ${noches > 1 ? t('mr_nights') : t('mr_night')}</span>
                                <span>${totalHabitacion} €</span>
                            </div>
                        </div>
                        
                        <div class="info-col">
                            <p class="info-section-title">Servicios & Extras</p>
                            ${r.servicios && r.servicios.length > 0 ? r.servicios.map(s => `
                                <div class="service-item-mini">
                                    <span>${s.nombre} x${s.cantidad}</span>
                                    <span>${(s.precio * s.cantidad).toFixed(2)} €</span>
                                </div>`).join('') : '<p style="font-size:0.7rem; opacity:0.5;">—</p>'}
                        </div>
                    </div>

                    ${r.pedidosRoomService && r.pedidosRoomService.length > 0 ? `
                        <p class="info-section-title">Room Service</p>
                        <div style="margin-bottom:20px;">
                            ${r.pedidosRoomService.map(p => `
                                <div class="service-item-mini">
                                    <span>${p.nombre} x${p.cantidad}</span>
                                    <span>${parseFloat(p.subtotal).toFixed(2)} €</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${peticionHtml}
                    
                    <div class="ticket-separator"></div>

                    <div class="total-row-luxury">
                        <span class="total-label">${t('mr_total_price')}</span>
                        <span class="total-value">${precioTotal} €</span>
                    </div>

                    <div class="card-actions">
                        ${(estado === 'PROXIMA' || estado === 'EN_CURSO') ? `
                            <button class="btn-manage-rs" onclick="abrirGestionRS(${r.id})">
                                <i class="fas fa-utensils"></i> ${t('mr_manage_rs')}
                            </button>` : ''}
                        
                        ${estado === 'PROXIMA' ? `
                            <button class="btn-cancel-luxury" onclick="cancelarReserva(${r.id})">
                                ${t('mr_cancel')}
                            </button>` : ''}
                    </div>
                </div>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
};

// ── EDICIÓN PETICIÓN ESPECIAL ─────────────────────────────────────────────────

window.editarPeticion = (id, btn) => {
    document.getElementById('peticion-display-' + id).style.display = 'none';
    document.getElementById('peticion-edit-' + id).style.display = 'block';
    document.getElementById('peticion-textarea-' + id).focus();
};

window.cancelarEditarPeticion = (id) => {
    document.getElementById('peticion-display-' + id).style.display = 'block';
    document.getElementById('peticion-edit-' + id).style.display = 'none';
};

window.guardarPeticion = async (id) => {
    var textarea = document.getElementById('peticion-textarea-' + id);
    var msgEl    = document.getElementById('peticion-msg-' + id);
    var valor    = textarea ? textarea.value.trim() : '';

    try {
        var res = await fetch('/api/reservas/' + id + '/peticion', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peticionEspecial: valor || null }),
        });
        if (res.ok) {
            showMisReservas(); // Refresca toda la vista
        } else {
            msgEl.style.display = 'block';
            msgEl.style.color   = '#c0392b';
            msgEl.textContent   = t('mr_special_request_error');
        }
    } catch (_) {
        msgEl.style.display = 'block';
        msgEl.style.color   = '#c0392b';
        msgEl.textContent   = t('mr_special_request_error');
    }
};

window.cancelarReserva = async (id) => {
    if (!confirm(t('mr_cancel_confirm'))) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            showMisReservas();
        } else {
            alert(t('mr_cancel_error'));
        }
    } catch (_) {
        alert(t('mr_cancel_error_conn'));
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
        alert(t('grs_error_load')); return;
    }

    // Mapa pedidoId → cantidad actual para ítems ya pedidos
    var pedidoMap = {};
    pedidosActuales.forEach(p => { pedidoMap[p.itemId] = { pedidoId: p.pedidoId, cantidad: p.cantidad }; });

    var categorias = ['DESAYUNO','ALMUERZO','CENA','SNACKS','BEBIDAS'];
    var catLabels  = { DESAYUNO: t('cat_DESAYUNO'), ALMUERZO: t('cat_ALMUERZO'), CENA: t('cat_CENA'), SNACKS: t('cat_SNACKS'), BEBIDAS: t('cat_BEBIDAS') };
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
                    <span style="flex:1;font-size:0.83rem;color:var(--cream);">${(typeof LANG !== 'undefined' && LANG === 'en' && typeof RS_ITEMS_EN !== 'undefined' && RS_ITEMS_EN[item.id]) ? RS_ITEMS_EN[item.id] : item.nombre}</span>
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
            <p style="font-size:0.65rem;letter-spacing:3px;color:var(--text-muted-custom);margin-bottom:4px;">${t('mr_rs_label')}</p>
            <h3 class="serif" style="color:var(--cream);font-size:1.4rem;margin-bottom:4px;">${t('grs_title')}</h3>
            <div class="gold-line mb-4" style="width:60px;"></div>
            ${cartaRows || '<p style="color:var(--text-muted-custom);font-size:0.8rem;">' + t('grs_no_items') + '</p>'}
            <p id="grs-subtotal" style="color:var(--gold);font-size:0.88rem;font-weight:600;margin-top:14px;letter-spacing:1px;"></p>
            <div id="grs-msg" style="display:none;font-size:0.8rem;margin-top:8px;"></div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button class="btn-room" style="flex:1;padding:12px;" onclick="guardarPedidoRS(${reservaId})">${t('grs_save')}</button>
                <button class="admin-btn admin-btn--ghost" style="flex:1;" onclick="cerrarGestionRS()">${t('grs_cancel')}</button>
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
    if (el) el.textContent = subtotal > 0 ? t('grs_subtotal') + subtotal.toFixed(2) + ' €' : '';
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
        msgEl.textContent   = t('grs_error_save');
    }
};

