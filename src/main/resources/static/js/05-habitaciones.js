// ── HABITACIONES ─────────────────────────────────────────────────────────────

async function loadRooms() {
    var wrapper = document.getElementById('rooms-wrapper');
    if (!wrapper) return;

    var tipoLabels = { NORMAL: t('tipo_normal'), DOBLE: t('tipo_doble'), SUITE: t('tipo_suite'), LUJO: t('tipo_lujo') };

    // Fetch datos reales de la API
    var habitacionesRaw = [];
    try {
        var res = await fetch('/api/habitaciones');
        if (res.ok) habitacionesRaw = await res.json();
    } catch (_) {}

    // Agrupar por tipo
    var grupos = habitacionesRaw.reduce((acc, h) => {
        if (!acc[h.tipo]) acc[h.tipo] = [];
        acc[h.tipo].push(h);
        return acc;
    }, {});

    // Disponibilidad real por tipo (solo cuando hay fechas de búsqueda)
    var disponibilidadReal = null;
    if (state.searchDates && state.searchDates.inDate && state.searchDates.outDate) {
        try {
            var dRes = await fetch(
                '/api/habitaciones/disponibles?fechaEntrada=' + state.searchDates.inDate +
                '&fechaSalida=' + state.searchDates.outDate
            );
            if (dRes.ok) disponibilidadReal = await dRes.json();
        } catch (_) {}
    }

    // Orden fijo de tipos
    var tipoOrder = ['NORMAL', 'DOBLE', 'SUITE', 'LUJO'];
    var habitaciones = tipoOrder
        .filter(t => grupos[t] && grupos[t].length > 0)
        .map(t => ({
            tipo:        t,
            precio:      grupos[t][0].precioNoche,
            descripcion: grupos[t][0].descripcion || '',
            count:       grupos[t].length,
        }));

    wrapper.innerHTML = '';

    habitaciones.forEach(h => {
        var imgs  = TIPO_IMAGES[h.tipo] || [];
        var thumb = imgs[0] || '';
        var label = tipoLabels[h.tipo] || h.tipo;

        // Badge de disponibilidad
        var badgeStyle = 'background:rgba(185,149,77,0.15); color:var(--gold);';
        var badgeText  = t('room_available');
        var disponible = true;

        if (disponibilidadReal !== null) {
            var libres = disponibilidadReal[h.tipo] !== undefined ? disponibilidadReal[h.tipo] : 0;
            if (libres > 0) {
                badgeText = t('room_left') + libres;
            } else {
                badgeStyle = 'background:rgba(139,26,26,0.2); color:#c0392b;';
                badgeText  = t('room_no_avail');
                disponible = false;
            }
        }

        var slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="room-card">
                <div class="room-card-img" onclick="openRoomLightbox('${label}', '${h.tipo}', ${h.precio})">
                    <img src="${thumb}" alt="${label}" loading="lazy">
                    <div class="room-img-overlay"><span class="room-img-overlay-text">${t('room_see_photos')}</span></div>
                </div>
                <div class="room-card-body">
                    <p class="room-type-badge">${h.tipo}</p>
                    <h3 class="room-name serif">${label}</h3>
                    <p class="room-price">${h.precio}€ <small>${t('room_per_night')}</small></p>
                    <p style="font-size:0.72rem; color:var(--text-muted); margin:4px 0 0; letter-spacing:0.5px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px; opacity:0.6;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>${TIPO_CAPACIDAD[h.tipo] || ''}
                    </p>
                    <p style="font-size:0.72rem; color:var(--text-muted); margin:2px 0 0; letter-spacing:0.5px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px; opacity:0.6;"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>${TIPO_CAMAS[h.tipo] || ''}
                    </p>
                    <div style="margin-bottom:12px;">
                        <span style="font-size:0.7rem; letter-spacing:1px; padding:4px 12px; border-radius:20px; ${badgeStyle}">
                            ${badgeText}
                        </span>
                    </div>
                    ${disponible
                        ? `<button class="btn-room" onclick="navigateToRoom('${h.tipo}')">${t('room_book')}</button>`
                        : `<button class="btn-room" disabled style="opacity:0.4; cursor:not-allowed;">${t('room_no_avail')}</button>`
                    }
                </div>
            </div>
        `;
        wrapper.appendChild(slide);
    });

    if (roomSwiper) { roomSwiper.destroy(true, true); roomSwiper = null; }
    roomSwiper = new Swiper('.roomSwiper', {
        slidesPerView: 'auto',
        spaceBetween: 24,
        centeredSlides: false,
        loop: false,
        pagination:  { el: '.swiper-pagination', clickable: true },
        navigation:  { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    });
}

function navigateToRoom(tipo) {
    if (!state.token) {
        sessionStorage.setItem('loginRedirect', '/habitacion/' + tipo.toLowerCase());
        if (state.searchDates) sessionStorage.setItem('searchDates', JSON.stringify(state.searchDates));
        abrirModalAuth();
        return;
    }
    var STAFF_ROLES = ['ADMIN','RECEPCION','LIMPIEZA','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE'];
    if (state.user && state.user.rol && STAFF_ROLES.indexOf(String(state.user.rol).replace(/^ROLE_/, '').toUpperCase()) !== -1) {
        alert('Las cuentas de personal del hotel no pueden hacer reservas.');
        return;
    }
    if (state.searchDates) sessionStorage.setItem('searchDates', JSON.stringify(state.searchDates));
    window.location.href = '/habitacion/' + tipo.toLowerCase();
}

