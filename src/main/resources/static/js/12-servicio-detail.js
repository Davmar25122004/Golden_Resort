// ── SERVICIO DETAIL PAGE ─────────────────────────────────────────────────────

window.openServicioDetail = async function(id) {
    var servicios = await fetchServicios();
    var servicio  = servicios.find(s => s.id === id || s.id === parseInt(id));
    var data      = SERVICIO_DATA[id] || SERVICIO_DATA[parseInt(id)];

    if (!servicio) return;

    var nombre = servicio.nombre;
    var precio = parseFloat(servicio.precio).toFixed(2);
    var slug   = slugify(nombre);

    if (!_suppressHistoryPush) {
        history.pushState({ view: 'servicio', id, slug }, '', '/servicio/' + slug);
    }

    var slidesHtml = '';
    if (data && data.images && data.images.length > 0) {
        slidesHtml = data.images.map((src, i) =>
            `<div class="swiper-slide servicio-detail-slide"><img src="${src}" alt="${nombre}" ${i === 0 ? '' : 'loading="lazy"'}></div>`
        ).join('');
    } else {
        slidesHtml = `<div class="swiper-slide servicio-detail-slide"><img src="/images/servicio-fallback.jpg" alt="${nombre}"></div>`;
    }

    var descripcion     = data ? data.descripcion    : '';
    var horario         = data ? data.horario        : '–';
    var capacidad       = data ? data.capacidad      : '–';
    var caracteristicas = data && data.caracteristicas
        ? data.caracteristicas.map(c => `<li>✦ ${c}</li>`).join('')
        : '';

    showDynamic(`
        <div class="servicio-detail-page">

            <button class="btn-volver" onclick="backToServicios()">← Volver a Servicios</button>

            <div class="servicio-detail-header">
                <div>
                    <p class="section-label mb-0">Hotel DAW · Nuestros Servicios</p>
                    <h2 class="servicio-detail-titulo serif">${nombre}</h2>
                </div>
                <div class="servicio-detail-precio-badge">
                    <span class="servicio-detail-precio">${precio} €</span>
                    <span class="servicio-detail-precio-label">/ servicio</span>
                </div>
            </div>

            <div class="gold-line mb-4"></div>

            <div class="swiper servicioDetailSwiper servicio-detail-carousel mb-5">
                <div class="swiper-wrapper">${slidesHtml}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>

            <div class="servicio-detail-body">

                <p class="servicio-detail-description">${descripcion}</p>

                <div class="servicio-info-cards">
                    <div class="servicio-info-card">
                        <p class="servicio-info-card-label">HORARIO</p>
                        <p class="servicio-info-card-value">${horario}</p>
                    </div>
                    <div class="servicio-info-card">
                        <p class="servicio-info-card-label">CONDICIONES</p>
                        <p class="servicio-info-card-value">${capacidad}</p>
                    </div>
                </div>

                ${caracteristicas ? `
                <div class="servicio-caracteristicas-section">
                    <p class="servicio-section-label">INCLUYE</p>
                    <ul class="servicio-caracteristicas">${caracteristicas}</ul>
                </div>` : ''}

            </div>
        </div>
    `);

    if (detailSwiper) { detailSwiper.destroy(true, true); detailSwiper = null; }
    detailSwiper = new Swiper('.servicioDetailSwiper', {
        slidesPerView: 1,
        spaceBetween:  0,
        loop: (data && data.images && data.images.length > 1),
        autoplay: { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination:  { el: '.servicioDetailSwiper .swiper-pagination', clickable: true },
        navigation:  { nextEl: '.servicioDetailSwiper .swiper-button-next', prevEl: '.servicioDetailSwiper .swiper-button-prev' },
    });
};

window.backToServicios = function() {
    history.pushState({ view: 'home' }, '', '/');
    showLanding();
    setTimeout(() => {
        var el = document.getElementById('servicios');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
};

