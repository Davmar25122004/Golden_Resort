// ── VISTA DE DETALLE POR TIPO ─────────────────────────────────────────────────

window.selectRoom = async (tipo, precio, descripcion) => {
    if (!state.token) { abrirModalAuth(); return; }
    // Solo los clientes pueden reservar; cualquier rol staff queda bloqueado
    var STAFF_ROLES = ['ADMIN','RECEPCION','LIMPIEZA','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE'];
    if (state.user && state.user.rol && STAFF_ROLES.indexOf(String(state.user.rol).replace(/^ROLE_/, '').toUpperCase()) !== -1) {
        alert('Las cuentas de personal del hotel no pueden hacer reservas.');
        return;
    }

    var tipoLabels = { NORMAL: t('tipo_normal'), DOBLE: t('tipo_doble'), SUITE: t('tipo_suite'), LUJO: t('tipo_lujo') };
    var label = tipoLabels[tipo] || tipo;
    var imgs  = TIPO_IMAGES[tipo] || [];

    var servicios       = await fetchServicios();
    var rsItems         = await fetchRoomServiceItems();

    var slidesHtml = imgs.map((src, i) =>
        `<div class="swiper-slide detail-swiper-slide"><img src="${src}" alt="${label}" ${i === 0 ? '' : 'loading="lazy"'}></div>`
    ).join('');

    // Siempre mostrar el selector de fechas, pre-rellenado si ya existen
    var fechaEntrada = state.searchDates ? state.searchDates.inDate : '';
    var fechaSalida  = state.searchDates ? state.searchDates.outDate : '';

    var fechasHtml = `<div style="margin-bottom:16px;">
               <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                   <div>
                       <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">${t('detail_arrival')}</label>
                       <input id="detail-in-date" type="text" placeholder="dd/mm/aaaa" value="${fechaEntrada}"
                           style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream);
                                  padding:8px 14px; border-radius:6px; font-size:0.85rem; cursor:pointer; width:150px;">
                   </div>
                   <div>
                       <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">${t('detail_departure')}</label>
                       <input id="detail-out-date" type="text" placeholder="dd/mm/aaaa" value="${fechaSalida}"
                           style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream);
                                  padding:8px 14px; border-radius:6px; font-size:0.85rem; cursor:pointer; width:150px;">
                   </div>
               </div>
           </div>`;

    // Identificar Room Service por nombre, no por ID hardcodeado
    var rsServicio = servicios.find(s => s.nombre.toLowerCase().includes('room service'));
    var RS_SERVICIO_ID = rsServicio ? rsServicio.id : null;
    var cartaHtml = buildCartaHtml(rsItems);

    var serviciosHtml = servicios.length === 0
        ? '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">' + t('detail_no_services') + '</p>'
        : servicios.map(s => {
            if (RS_SERVICIO_ID !== null && s.id === RS_SERVICIO_ID) {
                // Room Service: checkbox + carta desplegable
                return `
                <div style="margin-bottom:10px;">
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.85rem; color:var(--cream);">
                        <input type="checkbox" class="servicio-check rs-toggle"
                            data-id="${s.id}" data-precio="0"
                            onchange="toggleCartaRoomService(this.checked)"
                            style="accent-color:var(--gold); width:16px; height:16px; cursor:pointer;">
                        <span>${s.nombre}</span>
                        <span style="color:var(--gold); margin-left:auto; flex-shrink:0;" id="rs-subtotal-label"></span>
                    </label>
                    <div id="carta-room-service" style="display:none; margin-top:10px; padding:12px 14px; background:rgba(255,255,255,0.04); border-left:2px solid rgba(185,149,77,0.4); border-radius:0 8px 8px 0;">
                        ${cartaHtml}
                        <p id="rs-subtotal-linea" style="color:var(--gold); font-size:0.82rem; font-weight:600; margin-top:10px; letter-spacing:1px;"></p>
                    </div>
                </div>`;
            }
            var nombreLower = (s.nombre || '').toLowerCase();
            var requiereHora = nombreLower.includes('spa') || nombreLower.includes('coche') ||
                               nombreLower.includes('desayuno') || nombreLower.includes('cena');
            var esCoche = nombreLower.includes('coche');
            var horaDefault = nombreLower.includes('desayuno') ? '08:30'
                            : nombreLower.includes('cena')     ? '21:00'
                            : nombreLower.includes('spa')      ? '17:00'
                            : esCoche                          ? '10:00' : '';
            var horaMin = nombreLower.includes('desayuno') ? '07:00'
                        : nombreLower.includes('cena')     ? '19:30'
                        : nombreLower.includes('spa')      ? '09:00' : '';
            var horaMax = nombreLower.includes('desayuno') ? '11:00'
                        : nombreLower.includes('cena')     ? '23:00'
                        : nombreLower.includes('spa')      ? '21:00' : '';
            var horaOptions = '';
            if (horaMin && horaMax) {
                var [hMin, mMin] = horaMin.split(':').map(Number);
                var [hMax, mMax] = horaMax.split(':').map(Number);
                for (var hh = hMin; hh <= hMax; hh++) {
                    for (var mm = (hh === hMin ? mMin : 0); mm < 60; mm += 30) {
                        if (hh === hMax && mm > mMax) break;
                        var val = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
                        horaOptions += '<option value="' + val + '" style="background:#1a1a1a; color:#e8d5a3;"' + (val === horaDefault ? ' selected' : '') + '>' + val + '</option>';
                    }
                }
            }
            var horaInputHtml = requiereHora
                ? esCoche
                    ? `<div id="hora-wrap-${s.id}" style="display:none; margin:6px 0 14px 26px; padding:10px 14px; background:rgba(255,255,255,0.04); border-left:2px solid rgba(185,149,77,0.4); border-radius:0 8px 8px 0;">
                           <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:6px;">Lugar de recogida</label>
                           <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
                               <label style="display:flex; align-items:center; gap:8px; font-size:0.83rem; color:var(--cream); cursor:pointer;">
                                   <input type="radio" name="coche-ubicacion-${s.id}" class="servicio-ubicacion" data-id="${s.id}" value="AEROPUERTO_VALENCIA" data-precio-extra="120"
                                          style="accent-color:var(--gold); cursor:pointer;">
                                   <span>Aeropuerto de Valencia</span>
                                   <span style="color:var(--gold); margin-left:auto; flex-shrink:0;">120 €</span>
                               </label>
                               <label style="display:flex; align-items:center; gap:8px; font-size:0.83rem; color:var(--cream); cursor:pointer;">
                                   <input type="radio" name="coche-ubicacion-${s.id}" class="servicio-ubicacion" data-id="${s.id}" value="RENFE_JOAQUIN_SOROLLA" data-precio-extra="80"
                                          style="accent-color:var(--gold); cursor:pointer;">
                                   <span>Estación Renfe Joaquín Sorolla</span>
                                   <span style="color:var(--gold); margin-left:auto; flex-shrink:0;">80 €</span>
                               </label>
                               <label style="display:flex; align-items:center; gap:8px; font-size:0.83rem; color:var(--cream); cursor:pointer;">
                                   <input type="radio" name="coche-ubicacion-${s.id}" class="servicio-ubicacion" data-id="${s.id}" value="RENFE_CULLERA" data-precio-extra="40"
                                          style="accent-color:var(--gold); cursor:pointer;">
                                   <span>Estación Renfe Cullera</span>
                                   <span style="color:var(--gold); margin-left:auto; flex-shrink:0;">40 €</span>
                               </label>
                           </div>
                           <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">Hora de recogida</label>
                           <input type="time" class="servicio-hora" data-id="${s.id}" value="${horaDefault}"
                                  style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream); padding:6px 10px; border-radius:6px; font-size:0.85rem; width:130px;">
                       </div>`
                    : `<div id="hora-wrap-${s.id}" style="display:none; margin:6px 0 14px 26px; padding:10px 14px; background:rgba(255,255,255,0.04); border-left:2px solid rgba(185,149,77,0.4); border-radius:0 8px 8px 0;">
                           <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">Hora del servicio${horaMin && horaMax ? ' (' + horaMin + ' – ' + horaMax + ')' : ''}</label>
                           ${horaOptions
                               ? `<select class="servicio-hora" data-id="${s.id}"
                                      style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream); padding:6px 10px; border-radius:6px; font-size:0.85rem; width:130px;">${horaOptions}</select>`
                               : `<input type="time" class="servicio-hora" data-id="${s.id}" value="${horaDefault}"
                                      style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream); padding:6px 10px; border-radius:6px; font-size:0.85rem; width:130px;">`
                           }
                       </div>`
                : '';
            var precioInicialCb = esCoche ? '0' : s.precio;
            var precioLabel     = esCoche
                ? '<span style="color:var(--gold); margin-left:auto; flex-shrink:0;">Seleccionar ubicación</span>'
                : `<span style="color:var(--gold); margin-left:auto; flex-shrink:0;">${parseFloat(s.precio).toFixed(2)} €</span>`;
            return `
            <label style="display:flex; align-items:center; gap:10px; margin-bottom:6px; cursor:pointer; font-size:0.85rem; color:var(--cream);">
                <input type="checkbox" class="servicio-check"
                    data-id="${s.id}" data-precio="${precioInicialCb}" data-requiere-hora="${requiereHora}"
                    style="accent-color:var(--gold); width:16px; height:16px; cursor:pointer;">
                <span>${s.nombre}</span>
                ${precioLabel}
            </label>
            ${horaInputHtml}`;
        }).join('');

    var _mc = document.getElementById('main-content');
    if (_mc) _mc.style.display = 'block';
    var _dv = document.getElementById('dynamic-view');
    if (_dv) _dv.innerHTML = `
        <div class="detail-view-container" data-aos="fade-up">
            <p class="section-label mb-1">${t('detail_label')}</p>
            <h2 class="serif mb-2" style="color:var(--cream); font-size:2.2rem;">${label}</h2>
            <div class="gold-line mb-5"></div>

            <div class="swiper detailSwiper mb-5">
                <div class="swiper-wrapper">${slidesHtml}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>

            <p class="detail-price">${precio}€ <small style="font-size:1rem; color:var(--text-muted-custom);">${t('room_per_night')}</small></p>
            <p style="font-size:0.82rem; color:var(--text-muted); margin:8px 0 16px; letter-spacing:0.5px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:5px; opacity:0.6;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>${TIPO_CAPACIDAD[tipo] || ''}
            </p>
            <p class="detail-description">${descripcion}</p>

            ${fechasHtml}

            <div style="margin-bottom:20px;">
                <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:12px;">${t('detail_add_services')}</p>
                ${serviciosHtml}
                <p id="reserva-total-estimado" style="color:var(--gold); font-size:0.9rem; font-weight:600; margin-top:14px; letter-spacing:1px;"></p>
            </div>

            <div id="reserva-msg" style="display:none; margin-bottom:14px; font-size:0.85rem; letter-spacing:1px;"></div>

            <div style="margin-bottom:20px;">
                <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:8px;">${t('detail_special_request_label')}</p>
                <textarea id="peticion-especial-input" placeholder="${t('detail_special_request_placeholder')}" rows="3"
                    style="width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(185,149,77,0.3);
                           color:var(--cream); padding:10px 14px; border-radius:8px; font-size:0.85rem;
                           resize:vertical; font-family:inherit; letter-spacing:0.5px; box-sizing:border-box;
                           transition: border-color 0.2s;"
                    onfocus="this.style.borderColor='rgba(185,149,77,0.7)'"
                    onblur="this.style.borderColor='rgba(185,149,77,0.3)'"></textarea>
            </div>

            <button class="btn-room" id="btn-confirmar-reserva"
                onclick="confirmarReserva('${tipo}')">
                ${t('detail_confirm')}
            </button>

            <button id="btn-guardar-habitacion" onclick="toggleGuardarHabitacion('${tipo}')"
                style="display:flex; align-items:center; justify-content:center; gap:9px;
                       background:transparent; border:1px solid rgba(185,149,77,0.35);
                       color:var(--text-muted-custom); padding:13px 24px; border-radius:8px;
                       font-size:0.78rem; letter-spacing:2px; cursor:pointer; margin-top:12px;
                       width:100%; transition: border-color 0.2s, color 0.2s; font-family:inherit;">
                <svg id="icon-guardar" xmlns="http://www.w3.org/2000/svg" width="17" height="17"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <span id="label-guardar">Guardar habitaci\u00f3n</span>
            </button>
            <p id="msg-guardada" style="display:none; font-size:0.78rem; letter-spacing:1.5px;
               color:var(--gold); margin-top:10px; text-align:center;">
                La habitaci\u00f3n est\u00e1 guardada
            </p>
        </div>
    `;

    // Guardar precio/noche globalmente para usarlo en confirmarReserva
    window._currentRoomPrecioNoche = parseFloat(precio);

    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    detailSwiper = new Swiper('.detailSwiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: imgs.length > 1,
        autoplay: { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination:  { el: '.detailSwiper .swiper-pagination', clickable: true },
        navigation:  { nextEl: '.detailSwiper .swiper-button-next', prevEl: '.detailSwiper .swiper-button-prev' },
    });

    // Recalcula el total estimado en tiempo real (servicios + room service items)
    function recalcularTotal() {
        var inDate  = document.getElementById('detail-in-date')?.value  || '';
        var outDate = document.getElementById('detail-out-date')?.value || '';
        var totalEl = document.getElementById('reserva-total-estimado');
        if (!totalEl || !inDate || !outDate) return;
        var noches = Math.round((new Date(outDate + 'T00:00:00') - new Date(inDate + 'T00:00:00')) / 86400000);
        if (noches <= 0) { totalEl.textContent = ''; return; }

        var totalServicios = 0;
        document.querySelectorAll('.servicio-check:checked').forEach(cb => {
            totalServicios += parseFloat(cb.dataset.precio);
        });

        // Subtotal room service
        var subtotalRS = 0;
        document.querySelectorAll('[id^="rs-qty-"]').forEach(el => {
            var qty = parseInt(el.textContent) || 0;
            if (qty > 0) {
                var itemId = parseInt(el.id.replace('rs-qty-', ''));
                var item = rsItems.find(i => i.id === itemId);
                if (item) subtotalRS += parseFloat(item.precio) * qty;
            }
        });

        var subtotalLabel = document.getElementById('rs-subtotal-label');
        var subtotalLinea = document.getElementById('rs-subtotal-linea');
        if (subtotalRS > 0) {
            if (subtotalLabel) subtotalLabel.textContent = subtotalRS.toFixed(2) + ' €';
            if (subtotalLinea) subtotalLinea.textContent = t('detail_rs_subtotal') + subtotalRS.toFixed(2) + ' €';
        } else {
            if (subtotalLabel) subtotalLabel.textContent = '';
            if (subtotalLinea) subtotalLinea.textContent = '';
        }

        totalEl.textContent = t('detail_total_estimate') + (parseFloat(precio) * noches + totalServicios + subtotalRS).toFixed(2) + ' €';
    }

    // Asignar como función global para que rsAjustarCantidad la pueda llamar
    window.recalcularTotalReserva = recalcularTotal;

    document.querySelectorAll('.servicio-check').forEach(cb => {
        cb.addEventListener('change', function() {
            recalcularTotal();
            if (cb.dataset.requiereHora === 'true') {
                var wrap = document.getElementById('hora-wrap-' + cb.dataset.id);
                if (wrap) wrap.style.display = cb.checked ? 'block' : 'none';
                // Reset precio to 0 when unchecked (coche pricing comes from ubicacion)
                if (!cb.checked) {
                    var firstRadio = document.querySelector('.servicio-ubicacion[data-id="' + cb.dataset.id + '"]');
                    if (firstRadio) cb.dataset.precio = '0';
                }
            }
        });
    });

    document.querySelectorAll('.servicio-ubicacion').forEach(rb => {
        rb.addEventListener('change', function() {
            var cb = document.querySelector('.servicio-check[data-id="' + rb.dataset.id + '"]');
            if (cb) {
                cb.dataset.precio = rb.dataset.precioExtra;
                recalcularTotal();
            }
        });
    });

    // ── Disponibilidad en tiempo real ──────────────────────────────────────────
    async function actualizarDisponibilidad() {
        var inDate  = document.getElementById('detail-in-date')?.value  || '';
        var outDate = document.getElementById('detail-out-date')?.value || '';
        var btnConf = document.getElementById('btn-confirmar-reserva');
        if (!inDate || !outDate) return;
        try {
            var dRes = await fetch('/api/habitaciones/disponibles?fechaEntrada=' + inDate + '&fechaSalida=' + outDate);
            if (!dRes.ok) return;
            var disp = await dRes.json();
            var libres = disp[tipo] !== undefined ? disp[tipo] : 0;
            var msgEl = document.getElementById('reserva-msg');
            if (libres > 0) {
                if (btnConf) { btnConf.disabled = false; btnConf.style.opacity = '1'; btnConf.style.cursor = 'pointer'; }
                if (msgEl && msgEl.dataset.noDisp) { msgEl.style.display = 'none'; msgEl.dataset.noDisp = ''; }
            } else {
                if (btnConf) { btnConf.disabled = true; btnConf.style.opacity = '0.45'; btnConf.style.cursor = 'not-allowed'; }
                if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = '#c0392b'; msgEl.textContent = 'No hay habitaciones disponibles para las fechas seleccionadas.'; msgEl.dataset.noDisp = '1'; }
            }
        } catch (_) {}
    }

    flatpickr('#detail-in-date',  { ...FP_CONFIG, minDate: 'today', onChange: () => { recalcularTotal(); actualizarDisponibilidad(); } });
    flatpickr('#detail-out-date', { ...FP_CONFIG, minDate: 'today', onChange: () => { recalcularTotal(); actualizarDisponibilidad(); } });
    recalcularTotal();
    actualizarDisponibilidad();

    // Estado inicial del botón guardar (solo si hay sesión)
    if (state.token) {
        (async () => {
            try {
                var gr = await fetch('/api/guardadas/' + tipo + '/estado');
                if (gr.ok) { var gd = await gr.json(); _actualizarBtnGuardar(gd.guardada); }
            } catch (_) {}
        })();
    }
};

function _actualizarBtnGuardar(guardada) {
    var btn   = document.getElementById('btn-guardar-habitacion');
    var icon  = document.getElementById('icon-guardar');
    var label = document.getElementById('label-guardar');
    var msg   = document.getElementById('msg-guardada');
    if (!btn) return;
    if (guardada) {
        btn.style.borderColor = 'rgba(185,149,77,0.7)';
        btn.style.color       = 'var(--gold)';
        if (icon)  icon.setAttribute('fill', 'currentColor');
        if (label) label.textContent = 'Habitaci\u00f3n guardada';
        if (msg)   msg.style.display = 'block';
    } else {
        btn.style.borderColor = 'rgba(185,149,77,0.35)';
        btn.style.color       = 'var(--text-muted-custom)';
        if (icon)  icon.setAttribute('fill', 'none');
        if (label) label.textContent = 'Guardar habitaci\u00f3n';
        if (msg)   msg.style.display = 'none';
    }
}

window.toggleGuardarHabitacion = async (tipo) => {
    if (!state.token) { abrirModalAuth(); return; }
    var btn   = document.getElementById('btn-guardar-habitacion');
    var icon  = document.getElementById('icon-guardar');
    var guardadaActual = icon && icon.getAttribute('fill') === 'currentColor';
    if (btn) btn.disabled = true;
    try {
        var method = guardadaActual ? 'DELETE' : 'POST';
        var r = await fetch('/api/guardadas/' + tipo, { method });
        if (r.status === 401 || r.status === 403) { abrirModalAuth(); if (btn) btn.disabled = false; return; }
        if (r.ok) { _actualizarBtnGuardar(!guardadaActual); }
    } catch (_) {}
    if (btn) btn.disabled = false;
};

window.confirmarReserva = (tipo) => {
    var btn = document.getElementById('btn-confirmar-reserva');
    var msg = document.getElementById('reserva-msg');

    var fechaEntrada = document.getElementById('detail-in-date').value;
    var fechaSalida  = document.getElementById('detail-out-date').value;

    if (!fechaEntrada || !fechaSalida) {
        msg.style.display = 'block'; msg.style.color = '#c0392b';
        msg.textContent = t('detail_select_dates'); return;
    }
    var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fechaEntrada) || !dateRegex.test(fechaSalida)) {
        msg.style.display = 'block'; msg.style.color = '#c0392b';
        msg.textContent = 'Formato de fecha inválido (AAAA-MM-DD).'; return;
    }
    var hoy = new Date(); hoy.setHours(0,0,0,0);
    var dIn  = new Date(fechaEntrada + 'T00:00:00');
    var dOut = new Date(fechaSalida  + 'T00:00:00');
    if (dIn < hoy) {
        msg.style.display = 'block'; msg.style.color = '#c0392b';
        msg.textContent = 'La reserva debe ser posterior a hoy.'; return;
    }
    if (dIn >= dOut) {
        msg.style.display = 'block'; msg.style.color = '#c0392b';
        msg.textContent = 'La fecha de entrada no puede ser posterior a la de salida.'; return;
    }

    btn.disabled    = true;
    btn.textContent = t('detail_booking');
    msg.style.display = 'none';

    // Recopilar servicios seleccionados (sin room service)
    var serviciosSeleccionados = [];
    document.querySelectorAll('.servicio-check:checked').forEach(cb => {
        if (!cb.classList.contains('rs-toggle')) {
            var horaInput = document.querySelector('.servicio-hora[data-id="' + cb.dataset.id + '"]');
            var ubicInput = document.querySelector('.servicio-ubicacion[data-id="' + cb.dataset.id + '"]:checked');
            serviciosSeleccionados.push({
                servicioId: parseInt(cb.dataset.id), cantidad: 1,
                hora: horaInput && horaInput.value ? horaInput.value : null,
                ubicacion: ubicInput ? ubicInput.value : null
            });
        }
    });

    var rsSeleccionados = rsObtenerSeleccionados();

    // Construir resumen preview (sin llamar al servidor)
    var precioNoche = window._currentRoomPrecioNoche || 0;
    var noches = Math.round((dOut - dIn) / 86400000);
    var subtotalHab = precioNoche * noches;

    var totalServicios = 0;
    var serviciosPreview = [];
    document.querySelectorAll('.servicio-check:checked').forEach(cb => {
        if (!cb.classList.contains('rs-toggle')) {
            var precio = parseFloat(cb.dataset.precio) || 0;
            totalServicios += precio;
            var svc = (_serviciosCache || []).find(s => s.id === parseInt(cb.dataset.id));
            serviciosPreview.push({ nombre: svc ? svc.nombre : 'Servicio', precio: precio, cantidad: 1, subtotal: precio });
        }
    });

    var subtotalRS = 0;
    rsSeleccionados.forEach(sel => {
        var item = (_rsItemsCache || []).find(i => i.id === sel.itemId);
        var precio = item ? parseFloat(item.precio) : 0;
        subtotalRS += precio * sel.cantidad;
        if (item) serviciosPreview.push({ nombre: item.nombre, precio: precio, cantidad: sel.cantidad, subtotal: precio * sel.cantidad });
    });

    var subtotalTotal = subtotalHab + totalServicios + subtotalRS;

    var reservaDatos = {
        tipo,
        fechaEntrada,
        fechaSalida,
        servicios:        serviciosSeleccionados,
        peticionEspecial: (document.getElementById('peticion-especial-input')?.value || '').trim() || null,
        roomServiceItems: rsSeleccionados,
        resumenPreview: {
            habitacionTipo:   tipo,
            habitacionNumero: null,
            fechaEntrada,
            fechaSalida,
            subtotal:    subtotalTotal,
            descuento:   0,
            total:       subtotalTotal,
            servicios:   serviciosPreview,
            horaCheckin:  '15:00',
            horaCheckout: '11:00',
            codigoValido:  false,
            codigoMensaje: ''
        }
    };
    mostrarSelectorHabitaciones(tipo, fechaEntrada, fechaSalida, reservaDatos);
};

async function mostrarSelectorHabitaciones(tipo, fechaEntrada, fechaSalida, reservaDatos) {
    // Remove old overlay if any
    var old = document.getElementById('selector-hab-overlay');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var tipoLabels = { NORMAL: t('tipo_normal'), DOBLE: t('tipo_doble'), SUITE: t('tipo_suite'), LUJO: t('tipo_lujo') };
    var label = tipoLabels[tipo] || tipo;

    var overlay = document.createElement('div');
    overlay.className = 'pago-overlay';
    overlay.id = 'selector-hab-overlay';
    overlay.onclick = (e) => { if (e.target.id === 'selector-hab-overlay') cerrarSelectorHabitaciones(); };
    overlay.innerHTML = `
        <div class="pago-modal" style="max-width:420px;">
            <button class="pago-modal-close" onclick="cerrarSelectorHabitaciones()">&times;</button>
            <h3 class="pago-titulo">Elige tu habitación</h3>
            <p class="pago-subtitulo">${label} · ${fechaEntrada} → ${fechaSalida}</p>
            <div id="selector-hab-list">
                <div style="padding:2.5rem 0;text-align:center;">
                    <div style="width:36px;height:36px;border:3px solid rgba(201,168,76,0.2);border-top-color:var(--gold);border-radius:50%;animation:pago-spin 0.8s linear infinite;margin:0 auto;"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    // Force reflow then open
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    window._selectorReservaDatos = reservaDatos;

    try {
        var r = await fetch('/api/habitaciones/tipo/' + tipo + '/con-disponibilidad?fechaEntrada=' + fechaEntrada + '&fechaSalida=' + fechaSalida);
        if (!r.ok) throw new Error();
        var habitaciones = await r.json();

        var listEl = document.getElementById('selector-hab-list');
        if (!listEl) return;

        if (habitaciones.length === 0) {
            listEl.innerHTML = '<p style="color:var(--text-muted-custom);text-align:center;padding:1rem 0;">No hay habitaciones de este tipo.</p>';
            return;
        }

        listEl.innerHTML = habitaciones.map(h => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;
                        padding:12px 14px;background:rgba(255,255,255,${h.disponible ? '0.05' : '0.02'});
                        border:1px solid rgba(201,168,76,${h.disponible ? '0.2' : '0.07'});
                        border-radius:8px;margin-bottom:8px;opacity:${h.disponible ? '1' : '0.4'};">
                <div>
                    <div style="color:var(--cream);font-size:0.88rem;font-weight:600;">Habitación ${h.numero}</div>
                    <div style="color:var(--text-muted-custom);font-size:0.74rem;letter-spacing:1px;margin-top:2px;">${parseFloat(h.precioNoche).toFixed(2)} €/noche</div>
                </div>
                ${h.disponible
                    ? `<button onclick="seleccionarHabitacion(${h.id}, '${h.numero}')"
                               style="background:var(--gold);color:var(--dark);border:none;
                                      padding:8px 18px;border-radius:6px;font-size:0.77rem;
                                      letter-spacing:1.5px;cursor:pointer;font-family:inherit;font-weight:600;flex-shrink:0;">
                           Seleccionar
                       </button>`
                    : `<span style="color:#e74c3c;font-size:0.74rem;letter-spacing:1px;flex-shrink:0;">No disponible</span>`
                }
            </div>
        `).join('');
    } catch (_) {
        var listEl = document.getElementById('selector-hab-list');
        if (listEl) listEl.innerHTML = '<div class="pago-alert pago-alert--err" style="display:block;margin-top:0;">Error al cargar habitaciones.</div>';
    }
}

window.cerrarSelectorHabitaciones = () => {
    var el = document.getElementById('selector-hab-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    var btnConf = document.getElementById('btn-confirmar-reserva');
    if (btnConf) {
        btnConf.disabled    = false;
        btnConf.textContent = typeof t === 'function' ? t('detail_confirm') : 'Confirmar Reserva';
    }
};

window.seleccionarHabitacion = (habitacionId, habitacionNumero) => {
    var el = document.getElementById('selector-hab-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    var datos = window._selectorReservaDatos;
    if (!datos) return;
    datos.habitacionId = habitacionId;
    datos.resumenPreview.habitacionNumero = habitacionNumero;
    abrirPagoNuevo(datos);
};

window.backFromDetail = () => {
    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    window.location.href = '/';
};

window.loadAndShowRoom = async (tipo) => {
    try {
        // Lanzar los 3 fetches en paralelo para minimizar tiempo de espera
        var [rooms, serviciosPrefetch, rsItemsPrefetch] = await Promise.all([
            fetch('/api/habitaciones').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/servicios').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/room-service/items').then(r => r.ok ? r.json() : []).catch(() => [])
        ]);
        // Pre-poblar caches para que selectRoom los use sin espera adicional
        _serviciosCache = serviciosPrefetch;
        _rsItemsCache   = rsItemsPrefetch;
        var room = rooms.find(r => r.tipo === tipo.toUpperCase());
        if (!room) { window.location.href = '/'; return; }
        await selectRoom(room.tipo, room.precioNoche, room.descripcion || '');
    } catch (_) { window.location.href = '/'; }
};

