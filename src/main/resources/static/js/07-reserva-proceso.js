// ── VISTA DE DETALLE POR TIPO ─────────────────────────────────────────────────

window.selectRoom = async (tipo, precio, descripcion) => {
    if (!state.token) { openAuthModal(); return; }
    if (state.user && state.user.rol === 'ADMIN') return; // Los admins no reservan

    if (!_suppressHistoryPush) {
        history.pushState({ view: 'habitacion', tipo }, '', '/habitacion/' + tipo.toLowerCase());
    }

    var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };
    var label = tipoLabels[tipo] || tipo;
    var imgs  = TIPO_IMAGES[tipo] || [];

    var servicios       = await fetchServicios();
    var rsItems         = await fetchRoomServiceItems();

    var slidesHtml = imgs.map((src, i) =>
        `<div class="swiper-slide detail-swiper-slide"><img src="${src}" alt="${label}" ${i === 0 ? '' : 'loading="lazy"'}></div>`
    ).join('');

    // Si ya hay fechas de búsqueda, mostrarlas directamente; si no, mostrar selector
    var fechaEntrada = state.searchDates ? state.searchDates.inDate : '';
    var fechaSalida  = state.searchDates ? state.searchDates.outDate : '';

    var fechasHtml = state.searchDates
        ? `<div style="margin-bottom:16px; color:var(--text-muted-custom); font-size:0.85rem; letter-spacing:1px;">
               Fechas seleccionadas: <strong style="color:var(--cream);">${fechaEntrada}</strong> → <strong style="color:var(--cream);">${fechaSalida}</strong>
           </div>`
        : `<div style="margin-bottom:16px;">
               <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                   <div>
                       <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">LLEGADA</label>
                       <input id="detail-in-date" type="text" placeholder="dd/mm/aaaa"
                           style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream);
                                  padding:8px 14px; border-radius:6px; font-size:0.85rem; cursor:pointer; width:150px;">
                   </div>
                   <div>
                       <label style="display:block; font-size:0.7rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:4px;">SALIDA</label>
                       <input id="detail-out-date" type="text" placeholder="dd/mm/aaaa"
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
        ? '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">No hay servicios adicionales disponibles.</p>'
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
            return `
            <label style="display:flex; align-items:center; gap:10px; margin-bottom:10px; cursor:pointer; font-size:0.85rem; color:var(--cream);">
                <input type="checkbox" class="servicio-check"
                    data-id="${s.id}" data-precio="${s.precio}"
                    style="accent-color:var(--gold); width:16px; height:16px; cursor:pointer;">
                <span>${s.nombre}</span>
                <span style="color:var(--gold); margin-left:auto; flex-shrink:0;">${parseFloat(s.precio).toFixed(2)} €</span>
            </label>`;
        }).join('');

    showDynamic(`
        <div class="detail-view-container" data-aos="fade-up">
            <p class="section-label mb-1">Hotel DAW · Nuestras Suites</p>
            <h2 class="serif mb-2" style="color:var(--cream); font-size:2.2rem;">${label}</h2>
            <div class="gold-line mb-5"></div>

            <div class="swiper detailSwiper mb-5">
                <div class="swiper-wrapper">${slidesHtml}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>

            <p class="detail-price">${precio}€ <small style="font-size:1rem; color:var(--text-muted-custom);">/ noche</small></p>
            <p class="detail-description">${descripcion}</p>

            ${fechasHtml}

            <div style="margin-bottom:20px;">
                <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:12px;">SERVICIOS ADICIONALES</p>
                ${serviciosHtml}
                <p id="reserva-total-estimado" style="color:var(--gold); font-size:0.9rem; font-weight:600; margin-top:14px; letter-spacing:1px;"></p>
            </div>

            <div id="reserva-msg" style="display:none; margin-bottom:14px; font-size:0.85rem; letter-spacing:1px;"></div>

            <button class="btn-room" id="btn-confirmar-reserva"
                onclick="confirmarReserva('${tipo}')">
                Confirmar Reserva
            </button>
        </div>
    `);

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
        var inDate  = state.searchDates ? state.searchDates.inDate  : (document.getElementById('detail-in-date')?.value  || '');
        var outDate = state.searchDates ? state.searchDates.outDate : (document.getElementById('detail-out-date')?.value || '');
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
            if (subtotalLinea) subtotalLinea.textContent = 'Subtotal room service: ' + subtotalRS.toFixed(2) + ' €';
        } else {
            if (subtotalLabel) subtotalLabel.textContent = '';
            if (subtotalLinea) subtotalLinea.textContent = '';
        }

        totalEl.textContent = `Total estimado: ${(parseFloat(precio) * noches + totalServicios + subtotalRS).toFixed(2)} €`;
    }

    // Asignar como función global para que rsAjustarCantidad la pueda llamar
    window.recalcularTotalReserva = recalcularTotal;

    document.querySelectorAll('.servicio-check').forEach(cb => cb.addEventListener('change', recalcularTotal));

    if (!state.searchDates) {
        flatpickr('#detail-in-date',  { ...FP_CONFIG, minDate: 'today', onChange: recalcularTotal });
        flatpickr('#detail-out-date', { ...FP_CONFIG, minDate: 'today', onChange: recalcularTotal });
    } else {
        recalcularTotal();
    }
};

window.confirmarReserva = async (tipo) => {
    var btn = document.getElementById('btn-confirmar-reserva');
    var msg = document.getElementById('reserva-msg');

    var fechaEntrada, fechaSalida;
    if (state.searchDates) {
        fechaEntrada = state.searchDates.inDate;
        fechaSalida  = state.searchDates.outDate;
    } else {
        fechaEntrada = document.getElementById('detail-in-date').value;
        fechaSalida  = document.getElementById('detail-out-date').value;
    }

    if (!fechaEntrada || !fechaSalida) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = 'Por favor selecciona las fechas de entrada y salida.';
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'Reservando...';
    msg.style.display = 'none';

    try {
        // Excluir Room Service por clase, no por ID hardcodeado
        var serviciosSeleccionados = [];
        document.querySelectorAll('.servicio-check:checked').forEach(cb => {
            if (!cb.classList.contains('rs-toggle')) { // rs-toggle marca el checkbox de Room Service
                serviciosSeleccionados.push({ servicioId: parseInt(cb.dataset.id), cantidad: 1 });
            }
        });

        var res = await fetch('/api/reservas/por-tipo', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ tipo, fechaEntrada, fechaSalida, servicios: serviciosSeleccionados }),
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
            msg.textContent   = '¡Reserva confirmada! Tu habitación ha sido reservada.';
            btn.textContent   = 'Reservado';
            // Refrescar disponibilidad en la sección principal
            loadRooms();
        } else if (res.status === 409) {
            msg.style.display  = 'block';
            msg.style.color    = '#c0392b';
            msg.textContent    = 'No hay habitaciones disponibles de ese tipo para las fechas seleccionadas.';
            btn.disabled       = false;
            btn.textContent    = 'Confirmar Reserva';
        } else if (res.status === 401) {
            openAuthModal();
        } else {
            msg.style.display  = 'block';
            msg.style.color    = '#c0392b';
            msg.textContent    = 'Error al procesar la reserva. Inténtalo de nuevo.';
            btn.disabled       = false;
            btn.textContent    = 'Confirmar Reserva';
        }
    } catch (_) {
        msg.style.display  = 'block';
        msg.style.color    = '#c0392b';
        msg.textContent    = 'Error de conexión. Inténtalo de nuevo.';
        btn.disabled       = false;
        btn.textContent    = 'Confirmar Reserva';
    }
};

window.backFromDetail = () => {
    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    history.pushState({ view: 'home' }, '', '/');
    showLanding();
    loadRooms();
};

