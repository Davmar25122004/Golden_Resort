// ── ADMIN SIDEBAR ─────────────────────────────────────────────────────────────
(function () {
    var KEY_GROUPS = 'asb_groups';
    var KEY_FAVS   = 'asb_favs';
    var _initDone  = false;

    // Auto-inject CSS on public pages (admin.html ya lo carga via <link>)
    if (!document.querySelector('link[href$="admin-sidebar.css"]')) {
        var _cssLink = document.createElement('link');
        _cssLink.rel  = 'stylesheet';
        _cssLink.href = '/css/admin-sidebar.css';
        document.head.appendChild(_cssLink);
    }

    // ── Definición de grupos (para favoritos de grupo) ────────────────────────
    var GROUP_DEFS = {
        hotel: {
            label: 'HOTEL',
            items: [
                { id: 'hotel-hab', label: 'Habitaciones', type: 'public',   action: 'habitaciones' },
                { id: 'hotel-srv', label: 'Servicios',    type: 'public',   action: 'servicios'    },
                { id: 'hotel-cto', label: 'Contacto',     type: 'public',   action: 'contacto'     }
            ]
        },
        admin: {
            label: 'ADMIN',
            items: [
                { id: 'adm-dashboard',    label: 'Dashboard',    type: 'tab', action: 'dashboard'    },
                { id: 'adm-reservas',     label: 'Reservas',     type: 'tab', action: 'reservas'     },
                { id: 'adm-habitaciones', label: 'Habitaciones', type: 'tab', action: 'habitaciones' },
                { id: 'adm-servicios',    label: 'Servicios',    type: 'tab', action: 'servicios'    },
                { id: 'adm-roomservice',  label: 'Room Service', type: 'tab', action: 'roomservice'  },
                { id: 'adm-usuarios',     label: 'Usuarios',     type: 'tab', action: 'usuarios'     }
            ]
        },
        personal: {
            label: 'PERSONAL',
            items: [
                { id: 'pers-horarios',   label: 'Horarios',        type: 'personal', action: 'horarios'   },
                { id: 'pers-perfiles',   label: 'Tipos de jornada',type: 'personal', action: 'perfiles'   },
                { id: 'pers-planes',     label: 'Cuadrantes',      type: 'personal', action: 'planes'     },
                { id: 'pers-asignacion', label: 'Asignación',      type: 'personal', action: 'asignacion' }
            ]
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getGroups() {
        try { return JSON.parse(localStorage.getItem(KEY_GROUPS)) || {}; } catch (e) { return {}; }
    }

    function getFavs() {
        try { return JSON.parse(localStorage.getItem(KEY_FAVS)) || []; } catch (e) { return []; }
    }

    var CHEVRON = '<svg class="asb-chevron" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

    function groupHdr(id, label) {
        return '<div class="asb-group-hdr" onclick="asbToggle(\'' + id + '\')">' +
                    '<span>' + label + '</span>' +
                    '<div class="asb-group-hdr-right">' +
                        '<button class="asb-star asb-group-star" data-fav-id="grp-' + id + '" ' +
                                'onclick="asbToggleGroupFav(event,\'' + id + '\')" title="Añadir grupo a favoritos">★</button>' +
                        CHEVRON +
                    '</div>' +
               '</div>';
    }

    function sidebarHTML() {
        return (
            '<ul class="asb-menu" style="margin-top:10px;">' +
                '<li class="asb-item" id="asb-inicio" onclick="asbGoHome()">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
                    '<span>Inicio</span>' +
                '</li>' +
            '</ul>' +
            '<div class="asb-divider"></div>' +
            '<div class="asb-section-label">FAVORITOS</div>' +
            '<ul class="asb-menu" id="asb-favs-list"><li class="asb-empty-favs">Sin favoritos aún</li></ul>' +
            '<div class="asb-divider"></div>' +

            // HOTEL
            groupHdr('hotel', 'HOTEL') +
            '<ul class="asb-submenu" id="asb-group-hotel">' +
                '<li class="asb-subitem" id="asb-hotel-hab" onclick="asbGoPublic(\'habitaciones\')">' +
                    '<span>Habitaciones</span>' +
                    '<button class="asb-star" data-fav-id="hotel-hab" onclick="asbToggleFav(event,\'Habitaciones\',\'hotel-hab\',\'public\',\'habitaciones\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-hotel-srv" onclick="asbGoPublic(\'servicios\')">' +
                    '<span>Servicios</span>' +
                    '<button class="asb-star" data-fav-id="hotel-srv" onclick="asbToggleFav(event,\'Servicios\',\'hotel-srv\',\'public\',\'servicios\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-hotel-cto" onclick="asbGoPublic(\'contacto\')">' +
                    '<span>Contacto</span>' +
                    '<button class="asb-star" data-fav-id="hotel-cto" onclick="asbToggleFav(event,\'Contacto\',\'hotel-cto\',\'public\',\'contacto\')" title="Favorito">★</button>' +
                '</li>' +
            '</ul>' +

            // ADMIN
            groupHdr('admin', 'ADMIN') +
            '<ul class="asb-submenu" id="asb-group-admin">' +
                '<li class="asb-subitem" id="asb-adm-dashboard" onclick="asbGoTab(\'dashboard\')">' +
                    '<span>Dashboard</span>' +
                    '<button class="asb-star" data-fav-id="adm-dashboard" onclick="asbToggleFav(event,\'Dashboard\',\'adm-dashboard\',\'tab\',\'dashboard\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-adm-reservas" onclick="asbGoTab(\'reservas\')">' +
                    '<span>Reservas</span>' +
                    '<button class="asb-star" data-fav-id="adm-reservas" onclick="asbToggleFav(event,\'Reservas\',\'adm-reservas\',\'tab\',\'reservas\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-adm-habitaciones" onclick="asbGoTab(\'habitaciones\')">' +
                    '<span>Habitaciones</span>' +
                    '<button class="asb-star" data-fav-id="adm-habitaciones" onclick="asbToggleFav(event,\'Habitaciones (Admin)\',\'adm-habitaciones\',\'tab\',\'habitaciones\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-adm-servicios" onclick="asbGoTab(\'servicios\')">' +
                    '<span>Servicios</span>' +
                    '<button class="asb-star" data-fav-id="adm-servicios" onclick="asbToggleFav(event,\'Servicios (Admin)\',\'adm-servicios\',\'tab\',\'servicios\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-adm-roomservice" onclick="asbGoTab(\'roomservice\')">' +
                    '<span>Room Service</span>' +
                    '<button class="asb-star" data-fav-id="adm-roomservice" onclick="asbToggleFav(event,\'Room Service\',\'adm-roomservice\',\'tab\',\'roomservice\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-adm-usuarios" onclick="asbGoTab(\'usuarios\')">' +
                    '<span>Usuarios</span>' +
                    '<button class="asb-star" data-fav-id="adm-usuarios" onclick="asbToggleFav(event,\'Usuarios\',\'adm-usuarios\',\'tab\',\'usuarios\')" title="Favorito">★</button>' +
                '</li>' +
            '</ul>' +

            // PERSONAL
            groupHdr('personal', 'PERSONAL') +
            '<ul class="asb-submenu" id="asb-group-personal">' +
                '<li class="asb-subitem" id="asb-pers-horarios" onclick="asbGoPersonal(\'horarios\')">' +
                    '<span>Horarios</span>' +
                    '<button class="asb-star" data-fav-id="pers-horarios" onclick="asbToggleFav(event,\'Horarios\',\'pers-horarios\',\'personal\',\'horarios\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-pers-perfiles" onclick="asbGoPersonal(\'perfiles\')">' +
                    '<span>Tipos de jornada</span>' +
                    '<button class="asb-star" data-fav-id="pers-perfiles" onclick="asbToggleFav(event,\'Tipos de jornada\',\'pers-perfiles\',\'personal\',\'perfiles\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-pers-planes" onclick="asbGoPersonal(\'planes\')">' +
                    '<span>Cuadrantes</span>' +
                    '<button class="asb-star" data-fav-id="pers-planes" onclick="asbToggleFav(event,\'Cuadrantes\',\'pers-planes\',\'personal\',\'planes\')" title="Favorito">★</button>' +
                '</li>' +
                '<li class="asb-subitem" id="asb-pers-asignacion" onclick="asbGoPersonal(\'asignacion\')">' +
                    '<span>Asignación</span>' +
                    '<button class="asb-star" data-fav-id="pers-asignacion" onclick="asbToggleFav(event,\'Asignación\',\'pers-asignacion\',\'personal\',\'asignacion\')" title="Favorito">★</button>' +
                '</li>' +
            '</ul>' +

            '<div class="asb-spacer"></div>' +
            '<div class="asb-divider"></div>'
        );
    }

    // ── Toggle group open / closed ────────────────────────────────────────────
    window.asbToggle = function (groupId) {
        var el  = document.getElementById('asb-group-' + groupId);
        var hdr = el && el.previousElementSibling;
        if (!el) return;
        var isOpen = !el.classList.contains('asb-collapsed');
        el.classList.toggle('asb-collapsed', isOpen);
        if (hdr) hdr.classList.toggle('asb-group-closed', isOpen);
        var state = getGroups();
        state[groupId] = !isOpen;
        localStorage.setItem(KEY_GROUPS, JSON.stringify(state));
    };

    // ── Set active item ───────────────────────────────────────────────────────
    function setActive(id) {
        document.querySelectorAll('#admin-sidebar .asb-subitem, #admin-sidebar .asb-item')
            .forEach(function (el) { el.classList.remove('asb-active'); });
        var el = document.getElementById(id);
        if (el) el.classList.add('asb-active');
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    window.asbGoHome = function () {
        window.location.href = '/';
    };

    window.asbGoPublic = function (section) {
        var path = window.location.pathname;
        if (path === '/' || path === '') {
            if (typeof scrollToSection === 'function') {
                scrollToSection(section);
            } else {
                var target = document.getElementById(section);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.location.href = '/#' + section;
        }
    };

    window.asbGoTab = function (tab) {
        if (typeof switchAdminTab === 'function') {
            setActive('asb-adm-' + tab);
            switchAdminTab(tab);
        } else {
            sessionStorage.setItem('asb_initTab', tab);
            window.location.href = '/admin';
        }
    };

    window.asbGoPersonal = function (subtab) {
        if (typeof switchAdminTab === 'function') {
            setActive('asb-pers-' + subtab);
            window._asbPersonalSubtab = subtab;
            switchAdminTab('personal');
        } else {
            sessionStorage.setItem('asb_initTab', 'personal');
            sessionStorage.setItem('asb_initSubtab', subtab);
            window.location.href = '/admin';
        }
    };

    // ── Favorites (item individual) ───────────────────────────────────────────
    window.asbToggleFav = function (e, label, id, type, action) {
        e.stopPropagation();
        var favs = getFavs();
        var idx  = favs.findIndex(function (f) { return f.id === id; });
        var btn  = e.currentTarget;
        if (idx >= 0) {
            favs.splice(idx, 1);
            btn.classList.remove('asb-star--active');
            var orig = document.querySelector('#admin-sidebar .asb-star[data-fav-id="' + id + '"]');
            if (orig) orig.classList.remove('asb-star--active');
        } else {
            favs.push({ id: id, label: label, type: type, action: action });
            btn.classList.add('asb-star--active');
            var orig2 = document.querySelector('#admin-sidebar .asb-star[data-fav-id="' + id + '"]');
            if (orig2) orig2.classList.add('asb-star--active');
        }
        localStorage.setItem(KEY_FAVS, JSON.stringify(favs));
        asbRenderFavs();
    };

    // ── Favorites (grupo completo) ────────────────────────────────────────────
    window.asbToggleGroupFav = function (e, groupId) {
        e.stopPropagation();
        var id   = 'grp-' + groupId;
        var favs = getFavs();
        var idx  = favs.findIndex(function (f) { return f.id === id; });
        var btn  = e.currentTarget;
        if (idx >= 0) {
            favs.splice(idx, 1);
            btn.classList.remove('asb-star--active');
            var orig = document.querySelector('#admin-sidebar .asb-group-star[data-fav-id="' + id + '"]');
            if (orig) orig.classList.remove('asb-star--active');
        } else {
            favs.push({ id: id, label: GROUP_DEFS[groupId].label, type: 'group', action: groupId });
            btn.classList.add('asb-star--active');
            var orig2 = document.querySelector('#admin-sidebar .asb-group-star[data-fav-id="' + id + '"]');
            if (orig2) orig2.classList.add('asb-star--active');
        }
        localStorage.setItem(KEY_FAVS, JSON.stringify(favs));
        asbRenderFavs();
    };

    window.asbRenderFavs = function () {
        var list = document.getElementById('asb-favs-list');
        if (!list) return;
        var favs = getFavs();
        if (favs.length === 0) {
            list.innerHTML = '<li class="asb-empty-favs">Sin favoritos aún</li>';
            return;
        }
        var html = '';
        favs.forEach(function (f) {
            if (f.type === 'group') {
                var def = GROUP_DEFS[f.action];
                if (!def) return;
                html += '<li class="asb-fav-group-hdr">' +
                            '<span>' + def.label + '</span>' +
                            '<button class="asb-star asb-star--active" ' +
                                    'onclick="asbToggleGroupFav(event,\'' + f.action + '\')" ' +
                                    'title="Quitar grupo de favoritos">★</button>' +
                        '</li>';
                def.items.forEach(function (item) {
                    html += '<li class="asb-subitem asb-fav-item" onclick="asbRunFav(\'' + item.type + '\',\'' + item.action + '\')">' +
                                '<span>' + item.label + '</span>' +
                            '</li>';
                });
            } else {
                html += '<li class="asb-subitem" onclick="asbRunFav(\'' + f.type + '\',\'' + f.action + '\')">' +
                            '<span>' + f.label + '</span>' +
                            '<button class="asb-star asb-star--active" ' +
                                    'onclick="asbToggleFav(event,\'' + f.label.replace(/'/g, "\\'") + '\',\'' + f.id + '\',\'' + f.type + '\',\'' + f.action + '\')" ' +
                                    'title="Quitar favorito">★</button>' +
                        '</li>';
            }
        });
        list.innerHTML = html;
    };

    window.asbRunFav = function (type, action) {
        if      (type === 'tab')      asbGoTab(action);
        else if (type === 'personal') asbGoPersonal(action);
        else if (type === 'public')   asbGoPublic(action);
    };

    // ── Init ──────────────────────────────────────────────────────────────────
    window.asbInit = function () {
        if (_initDone) return;
        _initDone = true;

        var state = getGroups();
        ['hotel', 'admin', 'personal'].forEach(function (g) {
            var el  = document.getElementById('asb-group-' + g);
            var hdr = el && el.previousElementSibling;
            if (el && state[g] === false) {
                el.classList.add('asb-collapsed');
                if (hdr) hdr.classList.add('asb-group-closed');
            }
        });

        var favIds = new Set(getFavs().map(function (f) { return f.id; }));
        document.querySelectorAll('#admin-sidebar .asb-star[data-fav-id]').forEach(function (btn) {
            if (favIds.has(btn.dataset.favId)) btn.classList.add('asb-star--active');
        });

        asbRenderFavs();
    };

    // ── Inject sidebar into any page ─────────────────────────────────────────
    window.asbInjectOnPage = function () {
        if (document.getElementById('admin-sidebar')) {
            asbInit();
            return;
        }

        var isAdminPage = !!document.getElementById('admin-nav');
        var publicNav   = document.getElementById('navbar');

        if (!isAdminPage && (!publicNav || publicNav.dataset.admin !== 'true')) return;

        var sidebar = document.createElement('aside');
        sidebar.id = 'admin-sidebar';
        sidebar.innerHTML = sidebarHTML();

        if (isAdminPage) {
            var shell = document.getElementById('admin-shell');
            var main  = document.getElementById('admin-main');
            if (shell && main) shell.insertBefore(sidebar, main);
            function setSidebarHeight() {
                var nav = document.getElementById('admin-nav');
                sidebar.style.height = (window.innerHeight - (nav ? nav.offsetHeight : 62)) + 'px';
            }
            setSidebarHeight();
            window.addEventListener('resize', setSidebarHeight);
        } else {
            publicNav.parentNode.insertBefore(sidebar, publicNav.nextSibling);

            function positionSidebar() {
                var navH = publicNav.offsetHeight;
                sidebar.style.top    = navH + 'px';
                sidebar.style.height = 'calc(100vh - ' + navH + 'px)';
            }
            positionSidebar();
            window.addEventListener('resize', positionSidebar);

            document.body.classList.add('has-admin-sidebar');

            var navLinks = document.getElementById('nav-links');
            if (navLinks) navLinks.style.display = 'none';
            document.querySelectorAll('#btn-reservar-nav').forEach(function(b) { b.style.display = 'none'; });
        }

        asbInit();
    };
})();
