// ── HABITACIONES ─────────────────────────────────────────────────────────────

async function loadRooms() {
    var wrapper = document.getElementById('rooms-wrapper');
    if (!wrapper) return;

    var tipoLabels = { NORMAL: 'Habitación Normal', DOBLE: 'Habitación Doble', SUITE: 'Suite', LUJO: 'Suite de Lujo' };

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
        var badgeText  = '● Disponible';
        var disponible = true;

        if (disponibilidadReal !== null) {
            var libres = disponibilidadReal[h.tipo] !== undefined ? disponibilidadReal[h.tipo] : 0;
            if (libres > 0) {
                badgeText = '● Quedan ' + libres;
            } else {
                badgeStyle = 'background:rgba(139,26,26,0.2); color:#c0392b;';
                badgeText  = '● Sin disponibilidad';
                disponible = false;
            }
        }

        var descEscaped = h.descripcion.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        var slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="room-card">
                <div class="room-card-img" onclick="openRoomLightbox('${label}', '${h.tipo}', ${h.precio})">
                    <img src="${thumb}" alt="${label}" loading="lazy">
                    <div class="room-img-overlay"><span class="room-img-overlay-text">Ver fotos</span></div>
                </div>
                <div class="room-card-body">
                    <p class="room-type-badge">${h.tipo}</p>
                    <h3 class="room-name serif">${label}</h3>
                    <p class="room-price">${h.precio}€ <small>/ noche</small></p>
                    <div style="margin-bottom:12px;">
                        <span style="font-size:0.7rem; letter-spacing:1px; padding:4px 12px; border-radius:20px; ${badgeStyle}">
                            ${badgeText}
                        </span>
                    </div>
                    ${disponible
                        ? `<button class="btn-room" onclick="selectRoom('${h.tipo}', ${h.precio}, '${descEscaped}')">Reservar</button>`
                        : `<button class="btn-room" disabled style="opacity:0.4; cursor:not-allowed;">Sin disponibilidad</button>`
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

