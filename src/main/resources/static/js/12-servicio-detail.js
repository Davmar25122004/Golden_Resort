// ── SERVICIO DETAIL PAGE ─────────────────────────────────────────────────────

window.openServicioDetail = async function(id) {
    var servicios = await fetchServicios();
    var servicio  = servicios.find(s => s.id === id || s.id === parseInt(id));
    var data      = SERVICIO_DATA[id] || SERVICIO_DATA[parseInt(id)];

    if (!servicio) return;

    var nombre = (typeof LANG !== 'undefined' && LANG === 'en' && typeof SERVICIO_NOMBRES_EN !== 'undefined' && SERVICIO_NOMBRES_EN[id])
        ? SERVICIO_NOMBRES_EN[id] : servicio.nombre;
    var precioStr = nombre.toLowerCase().includes('room service') ? t('srv_a_la_carte') : `${parseFloat(servicio.precio).toFixed(2)} €`;
    var precioLabelHtml = nombre.toLowerCase().includes('room service') ? '' : `<span class="servicio-detail-precio-label">${t('srv_per_service')}</span>`;
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

    var isEn = (typeof LANG !== 'undefined' && LANG === 'en');
    var descripcion     = data ? (isEn && data.descripcion_en  ? data.descripcion_en  : data.descripcion)  : '';
    var horario         = data ? (isEn && data.horario_en ? data.horario_en : data.horario) : '–';
    var capacidad       = data ? (isEn && data.capacidad_en    ? data.capacidad_en    : data.capacidad)    : '–';
    var caracList       = data ? (isEn && data.caracteristicas_en ? data.caracteristicas_en : data.caracteristicas) : null;
    var caracteristicas = caracList ? caracList.map(c => `<li>✦ ${c}</li>`).join('') : '';
        
    var pdfButtonHtml = '';
    if (nombre.toLowerCase().includes('room service')) {
        pdfButtonHtml = `
            <div style="margin: 30px 0; text-align: center;">
                <a href="/docs/room-service-menu.html" target="_blank" class="admin-btn" style="display:inline-block; padding: 14px 28px; text-decoration: none; font-size: 0.9rem; letter-spacing: 2px; border: 1px solid var(--gold);">
                    ${t('srv_pdf_btn')}
                </a>
            </div>
        `;
    }

    showDynamic(`
        <div class="servicio-detail-page">

            <button class="btn-volver" onclick="backToServicios()">${t('srv_back')}</button>

            <div class="servicio-detail-header">
                <div>
                    <p class="section-label mb-0">${t('srv_label')}</p>
                    <h2 class="servicio-detail-titulo serif">${nombre}</h2>
                </div>
                <div class="servicio-detail-precio-badge">
                    <span class="servicio-detail-precio">${precioStr}</span>
                    ${precioLabelHtml}
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

                ${pdfButtonHtml}

                <div class="servicio-info-cards">
                    <div class="servicio-info-card">
                        <p class="servicio-info-card-label">${t('srv_schedule')}</p>
                        <p class="servicio-info-card-value">${horario}</p>
                    </div>
                    <div class="servicio-info-card">
                        <p class="servicio-info-card-label">${t('srv_conditions')}</p>
                        <p class="servicio-info-card-value">${capacidad}</p>
                    </div>
                </div>

                ${caracteristicas ? `
                <div class="servicio-caracteristicas-section">
                    <p class="servicio-section-label">${t('srv_includes')}</p>
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

