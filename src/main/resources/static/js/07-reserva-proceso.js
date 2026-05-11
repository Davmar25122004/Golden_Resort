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

            <div id="disponibilidad-badge" style="margin-bottom:16px;"></div>

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
        </div>
    `;

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
        var badge   = document.getElementById('disponibilidad-badge');
        var btnConf = document.getElementById('btn-confirmar-reserva');
        if (!badge) return;
        if (!inDate || !outDate) { badge.innerHTML = ''; return; }
        try {
            var dRes = await fetch('/api/habitaciones/disponibles?fechaEntrada=' + inDate + '&fechaSalida=' + outDate);
            if (!dRes.ok) return;
            var disp = await dRes.json();
            var libres = disp[tipo] !== undefined ? disp[tipo] : 0;
            if (libres > 0) {
                badge.innerHTML = `<span style="
                    display:inline-block; font-size:0.72rem; letter-spacing:1px;
                    padding:6px 16px; border-radius:20px;
                    background:rgba(185,149,77,0.15); color:var(--gold);
                    border:1px solid rgba(185,149,77,0.3);
                ">
                    🏨 ${libres} ${libres === 1 ? 'habitación disponible' : 'habitaciones disponibles'} para estas fechas
                </span>`;
                if (btnConf) { btnConf.disabled = false; btnConf.style.opacity = '1'; btnConf.style.cursor = 'pointer'; }
            } else {
                badge.innerHTML = `<span style="
                    display:inline-block; font-size:0.72rem; letter-spacing:1px;
                    padding:6px 16px; border-radius:20px;
                    background:rgba(139,26,26,0.2); color:#e74c3c;
                    border:1px solid rgba(192,57,43,0.4);
                ">
                    ❌ Sin disponibilidad para estas fechas
                </span>`;
                if (btnConf) { btnConf.disabled = true; btnConf.style.opacity = '0.45'; btnConf.style.cursor = 'not-allowed'; }
            }
        } catch (_) {}
    }

    flatpickr('#detail-in-date',  { ...FP_CONFIG, minDate: 'today', onChange: () => { recalcularTotal(); actualizarDisponibilidad(); } });
    flatpickr('#detail-out-date', { ...FP_CONFIG, minDate: 'today', onChange: () => { recalcularTotal(); actualizarDisponibilidad(); } });
    recalcularTotal();
    actualizarDisponibilidad();
};

window.confirmarReserva = async (tipo) => {
    var btn = document.getElementById('btn-confirmar-reserva');
    var msg = document.getElementById('reserva-msg');

    var fechaEntrada = document.getElementById('detail-in-date').value;
    var fechaSalida  = document.getElementById('detail-out-date').value;

    if (!fechaEntrada || !fechaSalida) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = t('detail_select_dates');
        return;
    }

    var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fechaEntrada) || !dateRegex.test(fechaSalida)) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = 'Formato de fecha inválido (AAAA-MM-DD).';
        return;
    }

    var hoy = new Date();
    hoy.setHours(0,0,0,0);
    var dIn = new Date(fechaEntrada + 'T00:00:00');
    var dOut = new Date(fechaSalida + 'T00:00:00');

    if (dIn < hoy) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = 'La reserva debe ser posterior a hoy.';
        return;
    }

    if (dIn >= dOut) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = 'La fecha de entrada no puede ser posterior a la de salida.';
        return;
    }

    btn.disabled    = true;
    btn.textContent = t('detail_booking');
    msg.style.display = 'none';

    try {
        // Excluir Room Service por clase, no por ID hardcodeado
        var serviciosSeleccionados = [];
        document.querySelectorAll('.servicio-check:checked').forEach(cb => {
            if (!cb.classList.contains('rs-toggle')) { // rs-toggle marca el checkbox de Room Service
                var horaInput    = document.querySelector('.servicio-hora[data-id="' + cb.dataset.id + '"]');
                var ubicInput    = document.querySelector('.servicio-ubicacion[data-id="' + cb.dataset.id + '"]:checked');
                var hora     = horaInput  && horaInput.value  ? horaInput.value  : null;
                var ubicacion = ubicInput ? ubicInput.value : null;
                serviciosSeleccionados.push({ servicioId: parseInt(cb.dataset.id), cantidad: 1, hora: hora, ubicacion: ubicacion });
            }
        });

        var res = await fetch('/api/reservas/por-tipo', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                tipo,
                fechaEntrada,
                fechaSalida,
                servicios: serviciosSeleccionados,
                peticionEspecial: (document.getElementById('peticion-especial-input')?.value || '').trim() || null
            }),
        });

        if (res.ok) {
            var reservaCreada = await res.json();

            // Enviar ítems de room service si hay alguno seleccionado
            var rsSeleccionados = rsObtenerSeleccionados();
            if (reservaCreada && reservaCreada.id && rsSeleccionados.length > 0) {
                await Promise.all(rsSeleccionados.map(sel =>
                    fetch('/api/room-service/pedidos/' + reservaCreada.id, {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ itemId: sel.itemId, cantidad: sel.cantidad }),
                    })
                ));
            }

            msg.style.display = 'block';
            msg.style.color   = 'var(--gold)';
            msg.textContent   = t('detail_confirmed_msg');
            btn.textContent   = t('detail_booked');
            // Refrescar disponibilidad en la sección principal
            loadRooms();
            // Abrir modal de pago con la reserva recién creada
            if (reservaCreada && reservaCreada.id && typeof abrirPago === 'function') {
                setTimeout(() => abrirPago(reservaCreada.id), 400);
            }
        } else if (res.status === 409) {
            msg.style.display  = 'block';
            msg.style.color    = '#c0392b';
            msg.textContent    = t('detail_no_rooms_dates');
            btn.disabled       = false;
            btn.textContent    = t('detail_confirm');
        } else if (res.status === 401) {
            abrirModalAuth();
        } else {
            msg.style.display  = 'block';
            msg.style.color    = '#c0392b';
            msg.textContent    = t('detail_error_reserva');
            btn.disabled       = false;
            btn.textContent    = t('detail_confirm');
        }
    } catch (_) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = t('detail_error_conn');
        btn.disabled       = false;
        btn.textContent    = t('detail_confirm');
    }
};

window.backFromDetail = () => {
    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    window.location.href = '/';
};

window.loadAndShowRoom = async (tipo) => {
    try {
        var res = await fetch('/api/habitaciones');
        var rooms = res.ok ? await res.json() : [];
        var room = rooms.find(r => r.tipo === tipo.toUpperCase());
        if (!room) { window.location.href = '/'; return; }
        await selectRoom(room.tipo, room.precioNoche, room.descripcion || '');
    } catch (_) { window.location.href = '/'; }
};

