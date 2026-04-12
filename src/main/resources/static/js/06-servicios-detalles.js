// ── SERVICIOS — cargados desde backend ───────────────────────────────────────

var _serviciosCache = null;

async function fetchServicios() {
    if (_serviciosCache) return _serviciosCache;
    try {
        var res = await fetch('/api/servicios');
        if (res.ok) _serviciosCache = await res.json();
    } catch (_) {}
    return _serviciosCache || [];
}

// ── ROOM SERVICE ITEMS — cargados desde backend ───────────────────────────────

var _rsItemsCache = null;

async function fetchRoomServiceItems() {
    if (_rsItemsCache) return _rsItemsCache;
    try {
        var res = await fetch('/api/room-service/items');
        if (res.ok) _rsItemsCache = await res.json();
    } catch (_) {}
    return _rsItemsCache || [];
}

// Genera HTML de la carta del Room Service para el modal de reserva
function buildCartaHtml(items) {
    var categorias = ['DESAYUNO', 'ALMUERZO', 'CENA', 'SNACKS', 'BEBIDAS'];
    var catLabels  = { DESAYUNO: t('cat_DESAYUNO'), ALMUERZO: t('cat_ALMUERZO'), CENA: t('cat_CENA'), SNACKS: t('cat_SNACKS'), BEBIDAS: t('cat_BEBIDAS') };
    var disponibles = items.filter(i => i.disponible);
    if (disponibles.length === 0) return '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px;">' + t('grs_no_items') + '</p>';

    return categorias.map(cat => {
        var catItems = disponibles.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.65rem; letter-spacing:2px; color:var(--text-muted-custom); margin:14px 0 8px; text-transform:uppercase;">${catLabels[cat]}</p>
            ${catItems.map(item => {
                var itemNombre = (typeof LANG !== 'undefined' && LANG === 'en' && typeof RS_ITEMS_EN !== 'undefined' && RS_ITEMS_EN[item.id]) ? RS_ITEMS_EN[item.id] : item.nombre;
                return `
                <div class="rs-item-row" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <span style="flex:1; font-size:0.83rem; color:var(--cream);">${itemNombre}</span>
                    <span style="color:var(--gold); font-size:0.83rem; flex-shrink:0;">${parseFloat(item.precio).toFixed(2)} €</span>
                    <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                        <button type="button" onclick="rsAjustarCantidad(${item.id}, -1)"
                            style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream); width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:1rem; line-height:1; padding:0;">−</button>
                        <span id="rs-qty-${item.id}" style="min-width:18px; text-align:center; font-size:0.85rem; color:var(--cream);">0</span>
                        <button type="button" onclick="rsAjustarCantidad(${item.id}, 1)"
                            style="background:rgba(255,255,255,0.07); border:1px solid rgba(185,149,77,0.3); color:var(--cream); width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:1rem; line-height:1; padding:0;">+</button>
                    </div>
                </div>`;
            }).join('')}`;
    }).join('');
}

window.toggleCartaRoomService = (checked) => {
    var carta = document.getElementById('carta-room-service');
    if (!carta) return;
    if (checked) {
        carta.style.display = 'block';
    } else {
        carta.style.display = 'none';
        rsResetearCantidades();
        if (window.recalcularTotalReserva) window.recalcularTotalReserva();
    }
};

window.rsAjustarCantidad = (itemId, delta) => {
    var el = document.getElementById('rs-qty-' + itemId);
    if (!el) return;
    var actual = parseInt(el.textContent) || 0;
    var nuevo  = Math.max(0, actual + delta);
    el.textContent = nuevo;
    recalcularTotalReserva();
};

function rsObtenerSeleccionados() {
    var seleccionados = [];
    document.querySelectorAll('[id^="rs-qty-"]').forEach(el => {
        var qty = parseInt(el.textContent) || 0;
        if (qty > 0) {
            var itemId = parseInt(el.id.replace('rs-qty-', ''));
            seleccionados.push({ itemId, cantidad: qty });
        }
    });
    return seleccionados;
}

function rsResetearCantidades() {
    document.querySelectorAll('[id^="rs-qty-"]').forEach(el => { el.textContent = '0'; });
}

// Función global para recalcular (usada tanto por servicios como por room service)
window.recalcularTotalReserva = null; // se asigna dentro de selectRoom

async function loadServicios() {
    var grid = document.getElementById('servicios-grid');
    if (!grid) return;

    var servicios = await fetchServicios();

    if (servicios.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted-custom); text-align:center; letter-spacing:1px; grid-column:1/-1;">' + t('srv_no_services') + '</p>';
        AOS.refresh();
        return;
    }

    grid.innerHTML = servicios.map((s, i) => {
        var data  = SERVICIO_DATA[s.id];
        var bgImg = data && data.images && data.images[0] ? data.images[0] : '';
        var bgStyle = bgImg ? `style="background-image:url('${bgImg}')"` : '';
        var nombreMostrar = (typeof LANG !== 'undefined' && LANG === 'en' && typeof SERVICIO_NOMBRES_EN !== 'undefined' && SERVICIO_NOMBRES_EN[s.id])
            ? SERVICIO_NOMBRES_EN[s.id] : s.nombre;
            
        var slug = typeof slugify !== 'undefined' ? slugify(nombreMostrar) : encodeURIComponent(nombreMostrar.toLowerCase().replace(/ /g, '-'));
        
        return `
        <div class="col-md-4 col-sm-6" data-aos="fade-up" data-aos-delay="${i * 80}">
            <div class="servicio-card servicio-card--clickable servicio-card--img" onclick="navigateToServicio('${slug}')" ${bgStyle}>
                <div class="servicio-card-overlay"></div>
                <div class="servicio-card-content">
                    <h4 class="servicio-name serif">${nombreMostrar}</h4>
                    <p class="servicio-price">${s.nombre.toLowerCase().includes('room service') ? t('srv_a_la_carte') : parseFloat(s.precio).toFixed(2) + ' €'}</p>
                    <p class="servicio-card-hint">${t('srv_hint')}</p>
                </div>
            </div>
        </div>`;
    }).join('');
    AOS.refresh();
}

window.navigateToServicio = function(slug) {
    window.location.href = '/servicio/' + slug;
};
