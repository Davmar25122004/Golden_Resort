// ── NAV FAVORITES ─────────────────────────────────────────────────────────────
// Sistema de favoritos para los dropdowns del navbar.
// - Detecta el rol activo desde data-* del navbar
// - Añade una estrella ★ a cada item con [data-fav-id]
// - Persiste en localStorage como nav_favs_<rol>
// - Renderiza el dropdown FAVORITOS desde la lista guardada
(function () {

    function detectRole() {
        var nav = document.getElementById('navbar');
        if (!nav) return 'guest';
        if (nav.dataset.admin       === 'true') return 'admin';
        if (nav.dataset.recepcion   === 'true') return 'recepcion';
        if (nav.dataset.limpieza    === 'true') return 'limpieza';
        if (nav.dataset.gimnasio    === 'true') return 'gimnasio';
        if (nav.dataset.spa         === 'true') return 'spa';
        if (nav.dataset.coche       === 'true') return 'coche';
        if (nav.dataset.hosteleria  === 'true') return 'hosteleria';
        if (nav.dataset.roomservice === 'true') return 'roomservice';
        if (nav.dataset.cliente     === 'true') return 'cliente';
        return 'guest';
    }

    var ROLE = detectRole();
    var STORAGE_KEY = 'nav_favs_' + ROLE;

    function getFavs() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
    }
    function setFavs(favs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    }

    function escAttr(s) { return String(s == null ? '' : s).replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
    function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    // ── Estrella en cada item ─────────────────────────────────────────────────
    function addStarsToItems() {
        document.querySelectorAll('.nav-dropdown-item[data-fav-id]').forEach(function (item) {
            // No duplicar
            if (item.querySelector('.nav-fav-star')) return;
            // No añadir estrella a items que están dentro del propio dropdown FAVORITOS
            if (item.closest('[data-favs-dropdown]')) return;

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nav-fav-star';
            btn.title = 'Añadir a favoritos';
            btn.textContent = '★';
            btn.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                toggleFav(item, btn);
            });
            item.appendChild(btn);
        });
        refreshActiveStars();
    }

    function refreshActiveStars() {
        var ids = new Set(getFavs().map(function (f) { return f.id; }));
        document.querySelectorAll('.nav-dropdown-item[data-fav-id]:not([data-favs-dropdown] *)').forEach(function (item) {
            var star = item.querySelector('.nav-fav-star');
            if (!star) return;
            if (ids.has(item.dataset.favId)) star.classList.add('active');
            else                              star.classList.remove('active');
        });
    }

    function toggleFav(item, star) {
        var favs = getFavs();
        var id   = item.dataset.favId;
        var idx  = favs.findIndex(function (f) { return f.id === id; });
        if (idx >= 0) {
            favs.splice(idx, 1);
            star.classList.remove('active');
        } else {
            // Capturar info del item: label, href, onclick (si existe), icono
            var labelEl = item.querySelector('.nav-fav-label, span:not(.nav-fav-star)');
            var label = (labelEl ? labelEl.textContent : item.textContent).trim();
            var href = item.getAttribute('href') || null;
            var onclick = item.getAttribute('onclick') || null;
            var iconHtml = '';
            var iconEl = item.querySelector('svg.nav-item-icon');
            if (iconEl) iconHtml = iconEl.outerHTML;
            favs.push({ id: id, label: label, href: href, onclick: onclick, icon: iconHtml });
            star.classList.add('active');
        }
        setFavs(favs);
        renderFavsDropdown();
    }

    // ── Dropdown FAVORITOS ────────────────────────────────────────────────────
    function renderFavsDropdown() {
        var menu = document.querySelector('[data-favs-dropdown]');
        if (!menu) return;
        var favs = getFavs();
        if (favs.length === 0) {
            menu.innerHTML = '<div class="nav-dropdown-empty">Sin favoritos aún. Pulsa la ★ junto a cualquier opción para añadirla aquí.</div>';
            return;
        }
        menu.innerHTML = favs.map(function (f) {
            var attrs = [
                'class="nav-dropdown-item"',
                'data-fav-id="' + escHtml(f.id) + '"',
                f.href ? 'href="' + escHtml(f.href) + '"' : 'href="javascript:void(0)"',
                f.onclick ? 'onclick="' + f.onclick.replace(/"/g, '&quot;') + '"' : ''
            ].filter(Boolean).join(' ');
            return '<a ' + attrs + '>'
                +    (f.icon || '')
                +    '<span class="nav-fav-label">' + escHtml(f.label) + '</span>'
                +    '<button type="button" class="nav-fav-star active" title="Quitar de favoritos" '
                +        'onclick="event.preventDefault();event.stopPropagation();window.__navFavsRemove(\'' + escAttr(f.id) + '\');">★</button>'
                + '</a>';
        }).join('');
    }

    window.__navFavsRemove = function (id) {
        var favs = getFavs().filter(function (f) { return f.id !== id; });
        setFavs(favs);
        renderFavsDropdown();
        refreshActiveStars();
    };

    // ── Init ──────────────────────────────────────────────────────────────────
    function init() {
        addStarsToItems();
        renderFavsDropdown();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
