// ── PANEL ADMIN ───────────────────────────────────────────────────────────────

window.showAdmin = async () => {
    if (typeof asbInjectOnPage === 'function') asbInjectOnPage();
    else if (typeof asbInit === 'function') asbInit();

    var initTab    = sessionStorage.getItem('asb_initTab')    || 'home';
    var initSubtab = sessionStorage.getItem('asb_initSubtab') || null;
    sessionStorage.removeItem('asb_initTab');
    sessionStorage.removeItem('asb_initSubtab');

    if (initSubtab) window._asbPersonalSubtab = initSubtab;

    switchAdminTab(initTab);

    var activeId = (initTab === 'personal' && initSubtab)
        ? 'asb-pers-' + initSubtab
        : 'asb-adm-' + initTab;
    var el = document.getElementById(activeId);
    if (el) el.classList.add('asb-active');
};

window.switchAdminTab = (tab) => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    var btn = document.getElementById('atab-' + tab);
    if (btn) btn.classList.add('active');
    var body = document.getElementById('admin-tab-body');
    if (!body) return;
    body.innerHTML = '<div style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; padding:20px 0;">' + t('admin_loading') + '</div>';

    if (tab === 'home')         loadAdminHome();
    if (tab === 'dashboard')    loadAdminDashboard();
    if (tab === 'reservas')     loadAdminReservas();
    if (tab === 'habitaciones') loadAdminHabitaciones();
    if (tab === 'servicios')    loadAdminServicios();
    if (tab === 'roomservice')  loadAdminRoomService();
    if (tab === 'usuarios')     loadAdminUsuarios();
    if (tab === 'personal')          loadAdminPersonal();
    if (tab === 'mensajes-staff')    loadAdminMensajesStaff();
    if (tab === 'clientes')          loadAdminClientes();
    if (tab === 'reservas-manuales') loadAdminReservasManuales();
};

// ── ADMIN: HOME ──────────────────────────────────────────────────────────────

function loadAdminHome() {
    var body = document.getElementById('admin-tab-body');
    if (!body) return;

    var _ico = function(d) { return '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
    var widgets = [
        // ── ADMIN ──
        { section: 'ADMIN' },
        { tab: 'dashboard',         icon: _ico('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'), title: 'Dashboard', desc: 'Estadísticas, gráficos e ingresos' },
        { tab: 'reservas',          icon: _ico('<path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'), title: 'Reservas', desc: 'Gestión de reservas activas' },
        { tab: 'habitaciones',      icon: _ico('<path d="M3 21V11l9-6 9 6v10"/><path d="M9 21v-6h6v6"/>'), title: 'Habitaciones', desc: 'Tipos, precios y disponibilidad' },
        { tab: 'servicios',         icon: _ico('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>'), title: 'Servicios', desc: 'Servicios del hotel' },
        { tab: 'roomservice',       icon: _ico('<path d="M2 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2H2v2Z"/><path d="M20 16a8 8 0 1 0-16 0"/>'), title: 'Room Service', desc: 'Carta y pedidos a habitación' },
        // ── CLIENTES ──
        { section: 'CLIENTES' },
        { tab: 'clientes',          icon: _ico('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'), title: 'Gestión de clientes', desc: 'Clientes registrados' },
        { tab: 'reservas-manuales', icon: _ico('<path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>'), title: 'Reservas manuales', desc: 'Crear reservas para clientes' },
        // ── PERSONAL ──
        { section: 'PERSONAL' },
        { tab: 'personal',          icon: _ico('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'), title: 'Horarios', desc: 'Gestión de horarios del equipo', subtab: 'horarios' },
        { tab: 'personal',          icon: _ico('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'), title: 'Tipos de jornada', desc: 'Perfiles y jornadas laborales', subtab: 'perfiles' },
        { tab: 'personal',          icon: _ico('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>'), title: 'Cuadrantes', desc: 'Planificación de turnos', subtab: 'planes' },
        { tab: 'personal',          icon: _ico('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>'), title: 'Asignación', desc: 'Asignación de personal', subtab: 'asignacion' },
        { tab: 'usuarios',          icon: _ico('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'), title: 'Usuarios', desc: 'Empleados y roles del sistema' },
        { tab: 'mensajes-staff',    icon: _ico('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'), title: 'Mensajes staff', desc: 'Comunicación con el equipo' },
        // ── MI PERFIL ──
        { section: 'MI PERFIL' },
        { href: '/perfil#info',      icon: _ico('<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>'), title: 'Información', desc: 'Datos personales' },
        { href: '/perfil#horario',   icon: _ico('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'), title: 'Mi horario', desc: 'Horario personal asignado' },
        { href: '/perfil#seguridad', icon: _ico('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'), title: 'Seguridad', desc: 'Contraseña y acceso' },
    ];

    body.innerHTML = `
        <div class="admin-home-header">
            <p class="admin-home-label">PANEL DE ADMINISTRACIÓN</p>
            <h2 class="admin-home-title">Bienvenido de vuelta</h2>
            <div class="gold-line" style="margin: 12px 0 0;"></div>
        </div>
        ${widgets.map(function(w) {
            if (w.section) {
                return '</div><p class="admin-home-section-label">' + w.section + '</p><div class="admin-home-grid">';
            }
            if (w.href) {
                return '<a href="' + w.href + '" class="admin-home-widget">' +
                    '<div class="admin-home-widget-icon">' + w.icon + '</div>' +
                    '<h3 class="admin-home-widget-title">' + w.title + '</h3>' +
                    '<p class="admin-home-widget-desc">' + w.desc + '</p>' +
                '</a>';
            }
            var onclick = w.subtab
                ? "window._asbPersonalSubtab='" + w.subtab + "';switchAdminTab('" + w.tab + "')"
                : "switchAdminTab('" + w.tab + "')";
            return '<div class="admin-home-widget" onclick="' + onclick + '">' +
                '<div class="admin-home-widget-icon">' + w.icon + '</div>' +
                '<h3 class="admin-home-widget-title">' + w.title + '</h3>' +
                '<p class="admin-home-widget-desc">' + w.desc + '</p>' +
            '</div>';
        }).join('')}
        </div>`;
}

// ── ADMIN: DASHBOARD ──────────────────────────────────────────────────────────

async function loadAdminDashboard() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/admin/stats'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_stats') + '</p>'; return; }
    var s = await res.json();

    var ocupPct = s.totalHabitaciones > 0
        ? Math.round((s.ocupadasHoy / s.totalHabitaciones) * 100) : 0;

    var proximasHtml = s.proximasLlegadas && s.proximasLlegadas.length > 0
        ? `<table class="admin-table mt-3">
               <thead><tr><th>${t('adm_col_client')}</th><th>${t('adm_col_room')}</th><th>${t('adm_col_type')}</th><th>${t('adm_col_arrival')}</th><th>${t('adm_col_departure')}</th></tr></thead>
               <tbody>
                   ${s.proximasLlegadas.map(p => `
                       <tr>
                           <td>${p.clienteNombre}</td>
                           <td>${p.habitacionNumero}</td>
                           <td><span class="admin-badge">${p.habitacionTipo}</span></td>
                           <td>${formatFecha(p.fechaEntrada)}</td>
                           <td>${formatFecha(p.fechaSalida)}</td>
                       </tr>`).join('')}
               </tbody>
           </table>`
        : '<p style="color:var(--text-muted-custom); font-size:0.8rem; margin-top:12px; letter-spacing:1px;">' + t('adm_no_arrivals') + '</p>';

    var anyoActual = new Date().getFullYear();
    body.innerHTML = `
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_today')}</p>
                <p class="admin-stat-value">${s.reservasHoy}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_month')}</p>
                <p class="admin-stat-value">${s.reservasMes}</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_revenue')}</p>
                <p class="admin-stat-value">${parseFloat(s.ingresosMes).toFixed(2)} €</p>
            </div>
            <div class="admin-stat-card">
                <p class="admin-stat-label">${t('adm_stat_occupancy')}</p>
                <p class="admin-stat-value">${s.ocupadasHoy} / ${s.totalHabitaciones} <small style="font-size:1rem;">(${ocupPct}%)</small></p>
            </div>
        </div>

        <!-- ── GRÁFICOS ──────────────────────────────────────────────────────── -->
        <div class="admin-charts-toolbar">
            <div class="admin-charts-tabs">
                <button class="admin-chart-tab active" data-period="monthly" onclick="adminChartsSetPeriod('monthly')">Por mes</button>
                <button class="admin-chart-tab" data-period="yearly" onclick="adminChartsSetPeriod('yearly')">Por año</button>
            </div>
            <div class="admin-charts-year" id="admin-charts-year-wrap">
                <button class="admin-chart-nav" onclick="adminChartsChangeYear(-1)" aria-label="Año anterior">‹</button>
                <span id="admin-charts-year-label">${anyoActual}</span>
                <button class="admin-chart-nav" onclick="adminChartsChangeYear(1)" aria-label="Año siguiente">›</button>
            </div>
        </div>
        <div class="admin-charts-grid">
            <div class="admin-chart-card">
                <p class="admin-chart-title">Reservas</p>
                <div class="admin-chart-canvas-wrap">
                    <canvas id="admin-chart-reservas"></canvas>
                </div>
            </div>
            <div class="admin-chart-card">
                <p class="admin-chart-title">Ingresos (€)</p>
                <div class="admin-chart-canvas-wrap">
                    <canvas id="admin-chart-ingresos"></canvas>
                </div>
            </div>
        </div>

        <div class="mt-5">
            <p style="font-size:0.75rem; letter-spacing:2px; color:var(--text-muted-custom); margin-bottom:4px;">${t('adm_upcoming')}</p>
            <div class="gold-line" style="width:60px; margin-bottom:0;"></div>
            ${proximasHtml}
        </div>`;

    // Inicializa state y carga gráficos
    window._adminChartsState = window._adminChartsState || { period: 'monthly', year: anyoActual };
    adminChartsLoad();
}

// ── GRÁFICOS DEL DASHBOARD ──────────────────────────────────────────────────

window._adminCharts = { reservas: null, ingresos: null };

window.adminChartsSetPeriod = (period) => {
    window._adminChartsState.period = period;
    document.querySelectorAll('.admin-chart-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.period === period);
    });
    var yWrap = document.getElementById('admin-charts-year-wrap');
    if (yWrap) yWrap.style.visibility = (period === 'monthly') ? 'visible' : 'hidden';
    adminChartsLoad();
};

window.adminChartsChangeYear = (delta) => {
    window._adminChartsState.year += delta;
    var lbl = document.getElementById('admin-charts-year-label');
    if (lbl) lbl.textContent = window._adminChartsState.year;
    adminChartsLoad();
};

async function adminChartsLoad() {
    var st = window._adminChartsState;
    if (!st || typeof Chart === 'undefined') return;
    var url = '/api/admin/stats/series?type=' + encodeURIComponent(st.period);
    if (st.period === 'monthly') url += '&year=' + st.year;
    var data;
    try {
        var r = await fetch(url);
        if (!r.ok) return;
        data = await r.json();
    } catch (_) { return; }

    adminChartsRender('admin-chart-reservas', 'reservas', data.labels, data.reservas, '#C9A84C', false);
    adminChartsRender('admin-chart-ingresos', 'ingresos', data.labels, data.ingresos, '#4dabf7', true);
}

function adminChartsRender(canvasId, key, labels, values, color, esEuros) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (window._adminCharts[key]) { window._adminCharts[key].destroy(); window._adminCharts[key] = null; }

    var ctx = canvas.getContext('2d');
    // Gradiente vertical sobre el color base (usa altura del wrapper)
    var h = canvas.parentElement ? canvas.parentElement.clientHeight : 240;
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(1, color + '22');

    // Grosor máximo de barra: muchas barras → finas, pocas → gordas
    var n = (labels || []).length;
    var maxBar = n >= 12 ? 28 : n >= 6 ? 50 : n >= 2 ? 90 : 140;

    window._adminCharts[key] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels || [],
            datasets: [{
                data: (values || []).map(v => parseFloat(v) || 0),
                backgroundColor: grad,
                borderColor: color,
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: maxBar,
                minBarLength: 4   // garantiza que valores muy pequeños sigan siendo visibles
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    borderColor: 'rgba(201,168,76,0.4)',
                    borderWidth: 1,
                    titleColor: '#C9A84C',
                    bodyColor: '#f5f0e8',
                    padding: 10,
                    callbacks: {
                        label: (item) => esEuros
                            ? ' ' + item.parsed.y.toFixed(2) + ' €'
                            : ' ' + item.parsed.y + ' reserva' + (item.parsed.y === 1 ? '' : 's')
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9a9a9a', font: { size: 11 } },
                    grid:  { color: 'rgba(255,255,255,0.04)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9a9a9a',
                        font: { size: 11 },
                        callback: (v) => esEuros ? v + ' €' : v
                    },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                }
            }
        }
    });
}

// ── ADMIN: RESERVAS ───────────────────────────────────────────────────────────

var _cachedReservasAdmin = [];

// ── CALENDARIO ADMIN (replica recepción + acciones modificar/eliminar) ──────

var _adminCalMeses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                      'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
var _adminCalDIAS  = ['L','M','X','J','V','S','D'];

var _adminCalState = {
    vista: 'anual',                      // 'anual' | 'mensual' | 'semanal'
    anyo:  new Date().getFullYear(),
    mes:   new Date().getMonth(),         // 0-11
    semana: 0,
    cacheRango: null,
    diaActual: null
};

async function loadAdminReservas() {
    var body = document.getElementById('admin-tab-body');
    try {
        var rRes = await fetch('/api/reservas');
        if (rRes.ok) _cachedReservasAdmin = await rRes.json();
    } catch (_) {}
    // Importante: invalidar la caché de conteos del calendario al recargar
    if (typeof adminCalInvalidarCache === 'function') adminCalInvalidarCache();

    body.innerHTML = `
        <div id="cal-page">
            <div class="cal-container" style="padding:0; max-width:none;">
                <header class="cal-header" id="admin-cal-header">
                    <h1 class="cal-title">PLAN HABITACIONES</h1>
                    <div class="cal-view-tabs" role="tablist">
                        <button type="button" class="cal-tab cal-tab--active" data-view="anual"   onclick="adminCalCambiarVista('anual')">CALENDARIO</button>
                        <button type="button" class="cal-tab"                 data-view="mensual" onclick="adminCalCambiarVista('mensual')">MENSUAL</button>
                        <button type="button" class="cal-tab"                 data-view="semanal" onclick="adminCalCambiarVista('semanal')">SEMANAL</button>
                    </div>
                    <div class="cal-context-selector">
                        <button type="button" class="cal-nav-btn" onclick="adminCalNavegar(-1)" aria-label="Anterior">‹</button>
                        <span id="admin-cal-context-label">${_adminCalState.anyo}</span>
                        <button type="button" class="cal-nav-btn" onclick="adminCalNavegar(1)" aria-label="Siguiente">›</button>
                    </div>
                </header>
                <main id="admin-cal-content" class="cal-content">
                    <div class="cal-loading">Cargando…</div>
                </main>
            </div>

            <div class="modal fade cal-modal" id="adminCalDiaModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="adminCalDiaTitulo">Reservas</h5>
                            <button type="button" class="btn-volver-cal" data-bs-dismiss="modal" aria-label="Volver al calendario">
                                ← Volver al calendario
                            </button>
                        </div>
                        <div class="modal-body" id="adminCalDiaBody">
                            <div class="text-center py-4 text-muted">Cargando…</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    adminCalRender();
}

window.adminCalCambiarVista = (v) => {
    _adminCalState.vista = v;
    document.querySelectorAll('#admin-cal-header .cal-tab').forEach(b => {
        b.classList.toggle('cal-tab--active', b.dataset.view === v);
    });
    if (v === 'semanal') _adminCalState.semana = adminCalSemanaActualDelMes(_adminCalState.anyo, _adminCalState.mes);
    adminCalRender();
};

window.adminCalNavegar = (delta) => {
    var s = _adminCalState;
    if (s.vista === 'anual') {
        s.anyo += delta;
    } else if (s.vista === 'mensual') {
        s.mes += delta;
        if (s.mes < 0)  { s.mes = 11; s.anyo--; }
        if (s.mes > 11) { s.mes = 0;  s.anyo++; }
    } else if (s.vista === 'semanal') {
        var totalSemanas = adminCalSemanasDelMes(s.anyo, s.mes);
        s.semana += delta;
        if (s.semana < 0) {
            s.mes--;
            if (s.mes < 0) { s.mes = 11; s.anyo--; }
            s.semana = adminCalSemanasDelMes(s.anyo, s.mes) - 1;
        } else if (s.semana >= totalSemanas) {
            s.mes++;
            if (s.mes > 11) { s.mes = 0; s.anyo++; }
            s.semana = 0;
        }
    }
    adminCalRender();
};

function adminCalRender() {
    adminCalActualizarLabel();
    var content = document.getElementById('admin-cal-content');
    if (!content) return;
    content.innerHTML = '<div class="cal-loading">Cargando…</div>';

    if (_adminCalState.vista === 'anual')   return adminCalRenderAnual(content);
    if (_adminCalState.vista === 'mensual') return adminCalRenderMensual(content);
    if (_adminCalState.vista === 'semanal') return adminCalRenderSemanal(content);
}

function adminCalActualizarLabel() {
    var label = document.getElementById('admin-cal-context-label');
    if (!label) return;
    var s = _adminCalState;
    if (s.vista === 'anual') label.textContent = s.anyo;
    else if (s.vista === 'mensual') label.textContent = adminCalCap(_adminCalMeses[s.mes].toLowerCase()) + ' ' + s.anyo;
    else {
        var rango = adminCalRangoSemanaDelMes(s.anyo, s.mes, s.semana);
        label.textContent = 'Sem. ' + (s.semana + 1) + ' · ' + adminCalFechaCorta(rango.desde) + ' → ' + adminCalFechaCorta(rango.hasta);
    }
}

function adminCalRenderAnual(content) {
    var anyo = _adminCalState.anyo;
    var desde = adminCalYmd(anyo, 0, 1);
    var hasta = adminCalYmd(anyo, 11, 31);
    adminCalCargarRango(desde, hasta).then(conteos => {
        var html = '<div class="cal-anual-grid">';
        for (var m = 0; m < 12; m++) {
            html += '<div class="cal-mes-card">';
            html += '<div class="cal-mes-header">' + _adminCalMeses[m] + '</div>';
            html += adminCalRenderGridMes(anyo, m, conteos, false);
            html += '</div>';
        }
        html += '</div>';
        content.innerHTML = html;
        adminCalAttachDayHandlers(content);
    });
}

function adminCalRenderMensual(content) {
    var s = _adminCalState;
    var dias = adminCalDiasEnMes(s.anyo, s.mes);
    var desde = adminCalYmd(s.anyo, s.mes, 1);
    var hasta = adminCalYmd(s.anyo, s.mes, dias);
    adminCalCargarRango(desde, hasta).then(conteos => {
        var html = '<div class="cal-mensual-card">';
        html += '<div class="cal-mensual-header">' + adminCalCap(_adminCalMeses[s.mes].toLowerCase()) + ' ' + s.anyo + '</div>';
        html += adminCalRenderGridMes(s.anyo, s.mes, conteos, true);
        html += '</div>';
        content.innerHTML = html;
        adminCalAttachDayHandlers(content);
    });
}

function adminCalRenderSemanal(content) {
    var s = _adminCalState;
    var rango = adminCalRangoSemanaDelMes(s.anyo, s.mes, s.semana);
    adminCalCargarRango(rango.desde, rango.hasta).then(conteos => {
        var fechas = [];
        var d = adminCalParseYmd(rango.desde);
        var f = adminCalParseYmd(rango.hasta);
        while (d <= f) {
            fechas.push(adminCalToYmd(d));
            d = new Date(d.getTime() + 86400000);
        }
        Promise.all(fechas.map(fecha =>
            fetch('/api/recepcion/calendario/dia?fecha=' + fecha)
                .then(r => r.ok ? r.json() : [])
                .then(j => ({ fecha: fecha, reservas: j }))
        )).then(resultados => {
            var html = '<div class="cal-semanal-card">';
            html += '<div class="cal-mensual-header">Semana ' + (s.semana + 1) + ' · ' + adminCalCap(_adminCalMeses[s.mes].toLowerCase()) + ' ' + s.anyo + '</div>';
            html += '<div class="cal-semanal-list">';
            var nombres = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
            resultados.forEach(item => {
                var fechaObj = adminCalParseYmd(item.fecha);
                var dow = (fechaObj.getDay() + 6) % 7;
                var num = conteos[item.fecha] || 0;
                var reservasHtml = item.reservas.length === 0
                    ? '<div class="cal-sem-empty">Sin reservas</div>'
                    : item.reservas.map(r => {
                        var pill = r.estadoDia === 'ENTRA' ? '<span class="cal-pill cal-pill--in">Entra</span>'
                                 : r.estadoDia === 'SALE'  ? '<span class="cal-pill cal-pill--out">Sale</span>'
                                 : '<span class="cal-pill cal-pill--stay">En curso</span>';
                        return '<div class="cal-sem-reserva">'
                             + '<span class="cal-sem-hab">Hab. ' + adminCalEsc(r.habitacionNumero || '—') + '</span>'
                             + '<span class="cal-sem-tipo">' + adminCalEsc(r.habitacionTipo || '') + '</span>'
                             + '<span class="cal-sem-cliente">' + adminCalEsc(r.clienteNombre || r.clienteEmail || '—') + '</span>'
                             + pill + '</div>';
                    }).join('');
                html += '<div class="cal-sem-dia" data-day="' + item.fecha + '">'
                      + '<div class="cal-sem-cabecera">'
                      + '<span class="cal-sem-num">' + fechaObj.getDate() + '</span>'
                      + '<span class="cal-sem-nombre">' + nombres[dow] + '</span>'
                      + '<span class="cal-sem-count">' + num + ' reserva' + (num === 1 ? '' : 's') + '</span>'
                      + '</div>'
                      + '<div class="cal-sem-reservas">' + reservasHtml + '</div>'
                      + '</div>';
            });
            html += '</div></div>';
            content.innerHTML = html;
            adminCalAttachDayHandlers(content);
        });
    });
}

function adminCalRenderGridMes(anyo, mes, conteos, ampliado) {
    var primerDia = (new Date(anyo, mes, 1).getDay() + 6) % 7;
    var dias = adminCalDiasEnMes(anyo, mes);
    var hoy = new Date();
    var html = '<div class="cal-grid' + (ampliado ? ' cal-grid--lg' : '') + '">';
    _adminCalDIAS.forEach(d => { html += '<div class="cal-cabecera">' + d + '</div>'; });
    for (var i = 0; i < primerDia; i++) html += '<div class="cal-celda cal-celda--vacia"></div>';
    for (var d = 1; d <= dias; d++) {
        var fecha = adminCalYmd(anyo, mes, d);
        var n = conteos[fecha] || 0;
        var clase = 'cal-celda';
        if (n > 0) clase += ' cal-celda--con-reservas';
        if (anyo === hoy.getFullYear() && mes === hoy.getMonth() && d === hoy.getDate()) clase += ' cal-celda--hoy';
        html += '<button type="button" class="' + clase + '" data-day="' + fecha + '">'
              + '<span class="cal-celda-num">' + d + '</span>'
              + (n > 0 ? '<span class="cal-celda-badge">' + n + '</span>' : '')
              + '</button>';
    }
    html += '</div>';
    return html;
}

function adminCalAttachDayHandlers(root) {
    root.querySelectorAll('[data-day]').forEach(el => {
        el.addEventListener('click', ev => {
            ev.stopPropagation();
            adminCalAbrirDia(el.dataset.day);
        });
    });
}

window.adminCalAbrirDia = async (fecha) => {
    _adminCalState.diaActual = fecha;
    var titulo = document.getElementById('adminCalDiaTitulo');
    var body = document.getElementById('adminCalDiaBody');
    if (!titulo || !body) return;
    titulo.textContent = 'Reservas del ' + adminCalFechaLarga(adminCalParseYmd(fecha));
    body.innerHTML = '<div class="text-center py-4 text-muted">Cargando…</div>';

    var modalEl = document.getElementById('adminCalDiaModal');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    try {
        var r = await fetch('/api/recepcion/calendario/dia?fecha=' + fecha);
        if (!r.ok) throw new Error();
        var reservas = await r.json();
        if (reservas.length === 0) {
            body.innerHTML = '<div class="text-center py-5 cal-empty-day">Sin reservas para este día.</div>';
            return;
        }
        body.innerHTML = '<div class="cal-dia-list">' + reservas.map(adminCalRenderReservaCard).join('') + '</div>';
    } catch (_) {
        body.innerHTML = '<div class="alert alert-danger">No se pudieron cargar las reservas.</div>';
    }
};

function adminCalRenderReservaCard(r) {
    var imgs = (typeof TIPO_IMAGES !== 'undefined' && TIPO_IMAGES[r.habitacionTipo]) || [];
    var img = imgs[0] || '/images/normal-1.jpg';
    var pill = adminCalPillReserva(r);

    var emailHtml = (r.clienteEmail && r.clienteEmail !== r.clienteNombre)
        ? '<div class="cal-dia-extra-line cal-dia-extra-line--email">' + adminCalEsc(r.clienteEmail) + '</div>'
        : '';

    var serviciosHtml = '';
    if (r.servicios && r.servicios.length > 0) {
        serviciosHtml = '<div class="cal-dia-extra-line"><span class="cal-dia-extra-key">Servicios:</span> '
            + r.servicios.map(s => adminCalEsc(s.nombre) + (s.cantidad > 1 ? ' ×' + s.cantidad : '')).join(', ')
            + '</div>';
    }

    var rsHtml = '';
    if (r.pedidosRoomService && r.pedidosRoomService.length > 0) {
        rsHtml = '<div class="cal-dia-extra-line"><span class="cal-dia-extra-key">Room service:</span> '
            + r.pedidosRoomService.map(p => adminCalEsc(p.nombre) + ' ×' + (p.cantidad || 1)).join(', ')
            + '</div>';
    }

    var peticionHtml = r.peticionEspecial
        ? '<div class="cal-dia-peticion">'
            + '<svg class="cal-dia-peticion-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
            + '<span class="cal-dia-peticion-key">Petición:</span> '
            + adminCalEsc(r.peticionEspecial)
          + '</div>'
        : '';

    return '<div class="cal-dia-card">'
         + '<div class="cal-dia-img" style="background-image:url(\'' + img + '\')"></div>'
         + '<div class="cal-dia-info">'
         +   '<div class="cal-dia-row">'
         +     '<span class="cal-dia-hab">Hab. ' + adminCalEsc(r.habitacionNumero || '—') + '</span>'
         +     '<span class="cal-dia-tipo">' + adminCalEsc(r.habitacionTipo || '') + '</span>'
         +     pill
         +   '</div>'
         +   '<div class="cal-dia-cliente">' + adminCalEsc(r.clienteNombre || r.clienteEmail || '—') + '</div>'
         +   emailHtml
         +   '<div class="cal-dia-fechas">'
         +     adminCalFechaCortaStr(r.fechaEntrada) + ' <span class="cal-dia-hora">' + ((window.HOTEL_INFO && window.HOTEL_INFO.checkinTime) || '15:00') + 'h</span>'
         +     ' → '
         +     adminCalFechaCortaStr(r.fechaSalida)  + ' <span class="cal-dia-hora">' + ((window.HOTEL_INFO && window.HOTEL_INFO.checkoutTime) || '11:00') + 'h</span>'
         +   '</div>'
         +   serviciosHtml
         +   rsHtml
         +   peticionHtml
         +   '<div class="cal-dia-actions">'
         +     '<button class="admin-btn" style="background:rgba(255,255,255,0.05); color:var(--gold); border:1px solid rgba(185,149,77,0.4);" onclick="adminCalEditarReserva(' + r.id + ')">' + t('adm_res_modify') + '</button>'
         +     '<button class="admin-btn admin-btn--danger" onclick="adminCalEliminarReserva(' + r.id + ')">' + t('adm_res_cancel') + '</button>'
         +   '</div>'
         + '</div>'
         + '</div>';
}

// ── Cache + helpers ──────────────────────────────────────────────────────────

function adminCalCargarRango(desde, hasta) {
    if (_adminCalState.cacheRango && _adminCalState.cacheRango.key === desde + '|' + hasta) {
        return Promise.resolve(_adminCalState.cacheRango.data);
    }
    return fetch('/api/recepcion/calendario?desde=' + desde + '&hasta=' + hasta)
        .then(r => r.ok ? r.json() : {})
        .then(data => {
            _adminCalState.cacheRango = { key: desde + '|' + hasta, data: data };
            return data;
        });
}

function adminCalInvalidarCache() { _adminCalState.cacheRango = null; }

function adminCalDiaEsPasado(ymdStr) {
    if (!ymdStr) return false;
    var d = adminCalParseYmd(ymdStr);
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return d.getTime() < hoy.getTime();
}

// Calcula la pill según la reserva real respecto a HOY (no respecto al día clicado)
function adminCalPillReserva(r) {
    if (!r || !r.fechaEntrada || !r.fechaSalida)
        return '<span class="cal-pill cal-pill--stay">—</span>';
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var entrada = adminCalParseYmd(r.fechaEntrada);
    var salida  = adminCalParseYmd(r.fechaSalida);
    var hT = hoy.getTime(), eT = entrada.getTime(), sT = salida.getTime();

    if (sT < hT) return '<span class="cal-pill cal-pill--past">Pasada</span>';
    if (eT > hT) return '<span class="cal-pill cal-pill--future">Próxima</span>';
    return '<span class="cal-pill cal-pill--stay">En estancia</span>';
}

function adminCalDiasEnMes(a, m) { return new Date(a, m + 1, 0).getDate(); }
function adminCalPad(n) { return n < 10 ? '0' + n : '' + n; }
function adminCalYmd(a, m, d) { return a + '-' + adminCalPad(m + 1) + '-' + adminCalPad(d); }
function adminCalToYmd(d) { return d.getFullYear() + '-' + adminCalPad(d.getMonth() + 1) + '-' + adminCalPad(d.getDate()); }
function adminCalParseYmd(s) { var p = s.split('-'); return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])); }
function adminCalSemanasDelMes(a, m) {
    var primer = (new Date(a, m, 1).getDay() + 6) % 7;
    return Math.ceil((primer + adminCalDiasEnMes(a, m)) / 7);
}
function adminCalSemanaActualDelMes(a, m) {
    var hoy = new Date();
    if (hoy.getFullYear() !== a || hoy.getMonth() !== m) return 0;
    var primer = (new Date(a, m, 1).getDay() + 6) % 7;
    return Math.floor((primer + hoy.getDate() - 1) / 7);
}
function adminCalRangoSemanaDelMes(a, m, semana) {
    var primer = (new Date(a, m, 1).getDay() + 6) % 7;
    var inicio = new Date(a, m, 1 + (semana * 7) - primer);
    var fin = new Date(inicio.getTime() + 6 * 86400000);
    return { desde: adminCalToYmd(inicio), hasta: adminCalToYmd(fin) };
}
function adminCalFechaCorta(ymdStr) {
    var d = adminCalParseYmd(ymdStr);
    return d.getDate() + ' ' + ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];
}
function adminCalFechaCortaStr(ymd) { return ymd ? adminCalFechaCorta(ymd) : '—'; }
function adminCalFechaLarga(d) {
    var dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' ' + d.getFullYear();
}
function adminCalCap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function adminCalEsc(s) {
    return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Acciones desde el modal del día ──────────────────────────────────────────

window.adminCalEditarReserva = async (id) => {
    try {
        var r = (_cachedReservasAdmin || []).find(x => x.id === id);
        if (!r) {
            var rr = await fetch('/api/reservas');
            if (rr.ok) {
                _cachedReservasAdmin = await rr.json();
                r = _cachedReservasAdmin.find(x => x.id === id);
            }
        }
        if (!r) { alert('No se pudo cargar la reserva ' + id + '.'); return; }

        // Cierra el modal del día con Bootstrap y limpia restos de backdrop
        var modalEl = document.getElementById('adminCalDiaModal');
        if (modalEl) {
            var inst = bootstrap.Modal.getInstance(modalEl);
            if (inst) {
                // Espera al cierre antes de abrir el siguiente modal para evitar conflictos de backdrop
                modalEl.addEventListener('hidden.bs.modal', function once() {
                    modalEl.removeEventListener('hidden.bs.modal', once);
                    document.body.classList.remove('modal-open');
                    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                    try { adminModificarReserva(r); }
                    catch (e) { console.error('adminModificarReserva fallo:', e); alert('Error al abrir el modal: ' + e.message); }
                });
                inst.hide();
                // Fallback: si por algún motivo no dispara hidden en 400ms, abrimos igual
                setTimeout(() => {
                    if (!document.getElementById('modal-mod-reserva')) {
                        document.body.classList.remove('modal-open');
                        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                        try { adminModificarReserva(r); }
                        catch (e) { console.error(e); alert('Error: ' + e.message); }
                    }
                }, 400);
                return;
            }
        }
        adminModificarReserva(r);
    } catch (e) {
        console.error('adminCalEditarReserva fallo:', e);
        alert('No se pudo abrir el modal de modificar: ' + e.message);
    }
};

window.adminCalEliminarReserva = async (id) => {
    if (!confirm(t('adm_res_confirm_cancel'))) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            try {
                var rr = await fetch('/api/reservas');
                if (rr.ok) _cachedReservasAdmin = await rr.json();
            } catch (_) {}
            adminCalInvalidarCache();
            adminCalRender();
            if (_adminCalState.diaActual) adminCalAbrirDia(_adminCalState.diaActual);
        } else {
            alert(t('adm_res_cancel_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

window.filtrarReservasMes = () => {
    var month = document.getElementById('admin-res-month-filter').value;
    if (month === 'ALL') {
        renderReservasTable(_cachedReservasAdmin);
        return;
    }
    
    var targetMonthZeroIndexed = parseInt(month) - 1;
    var filtered = _cachedReservasAdmin.filter(r => {
        var dIn = new Date(r.fechaEntrada);
        var dOut = new Date(r.fechaSalida);
        var current = new Date(dIn);
        while(current <= dOut) {
            if(current.getMonth() === targetMonthZeroIndexed) return true;
            current.setDate(current.getDate() + 1);
        }
        return false;
    });

    renderReservasTable(filtered);
};

window.renderReservasTable = (reservas) => {
    var container = document.getElementById('admin-res-table-container');
    if (!reservas || reservas.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">No hay reservas que coincidan con este mes.</p>';
        return;
    }

    var tipoLabels = { NORMAL: 'Normal', DOBLE: 'Doble', SUITE: 'Suite', LUJO: 'Lujo' };

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th><th>${t('adm_col_client')}</th><th>${t('adm_col_room')}</th><th>ESTADO</th><th>${t('adm_col_arrival')}</th><th>${t('adm_col_departure')}</th>
                    <th>${t('adm_res_services')}</th><th>${t('adm_res_total')}</th><th></th>
                </tr>
            </thead>
            <tbody>
                ${reservas.map(r => {
                    var estado = calcularEstado(r.fechaEntrada, r.fechaSalida);
                    var badgeStyle, badgeText;
                    if (estado === 'EN_CURSO') {
                        badgeStyle = 'background:rgba(39,174,96,0.15); color:#27ae60;';
                        badgeText  = 'EN CURSO';
                    } else if (estado === 'PROXIMA') {
                        badgeStyle = 'background:rgba(185,149,77,0.15); color:var(--gold);';
                        badgeText  = 'PRÓXIMA';
                    } else {
                        badgeStyle = 'background:rgba(154,154,154,0.1); color:var(--text-muted-custom);';
                        badgeText  = 'PASADA';
                    }

                    var serviciosStr = r.servicios && r.servicios.length > 0
                        ? r.servicios.map(s => s.nombre).join(', ')
                        : '';

                    if (r.pedidosRoomService && r.pedidosRoomService.length > 0) {
                        window._rsData = window._rsData || {};
                        window._rsData[r.id] = { items: r.pedidosRoomService, total: r.subtotalRoomService };
                    }

                    var rsBadge = (r.pedidosRoomService && r.pedidosRoomService.length > 0)
                        ? `<button onclick="toggleRSPopover(event,${r.id})" style="display:inline-flex;align-items:center;gap:5px;margin-top:${serviciosStr ? 6 : 0}px;background:rgba(185,149,77,0.1);border:1px solid rgba(185,149,77,0.35);color:var(--gold);font-size:0.7rem;letter-spacing:1px;padding:4px 10px;border-radius:20px;cursor:pointer;transition:background 0.2s;font-family:inherit;" onmouseover="this.style.background='rgba(185,149,77,0.22)'" onmouseout="this.style.background='rgba(185,149,77,0.1)'"> Room Service <span style="background:rgba(185,149,77,0.28);border-radius:10px;padding:1px 6px;font-size:0.62rem;margin-left:2px;">${r.pedidosRoomService.length}</span></button>`
                        : '';

                    if (!serviciosStr && !rsBadge) serviciosStr = '—';
                    return `<tr>
                        <td>${r.id}</td>
                        <td><span style="color:var(--cream);">${r.clienteNombre || '—'}</span><br><small style="color:var(--text-muted-custom);">${r.clienteEmail || ''}</small></td>
                        <td>
                            <span class="admin-badge">${tipoLabels[r.habitacionTipo] || r.habitacionTipo}</span><br>
                            <small style="color:var(--text-muted-custom); margin-top:4px; display:inline-block;">nº ${r.habitacionNumero}</small>
                        </td>
                        <td><span style="font-size:0.65rem; font-weight:bold; padding:4px 8px; border-radius:4px; letter-spacing:1px; ${badgeStyle}">${badgeText}</span></td>
                        <td>${formatFecha(r.fechaEntrada)}</td>
                        <td>${formatFecha(r.fechaSalida)}</td>
                        <td style="font-size:0.75rem;">${serviciosStr}${rsBadge ? (serviciosStr ? '<br>' : '') + rsBadge : ''}</td>
                        <td style="color:var(--gold); white-space:nowrap;">${parseFloat(r.total).toFixed(2)} €</td>
                        <td>
                            <div style="display:flex; gap:8px; justify-content:flex-end;">
                                <button class="admin-btn" style="background:rgba(255,255,255,0.05); color:var(--gold); border:1px solid rgba(185,149,77,0.4);" onclick='adminModificarReserva(${JSON.stringify(r).replace(/'/g, "&#39;")})'>${t('adm_res_modify')}</button>
                                <button class="admin-btn admin-btn--danger" onclick="adminCancelarReserva(${r.id})">${t('adm_res_cancel')}</button>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// ── POPOVER ROOM SERVICE ─────────────────────────────────────────────────────

window.toggleRSPopover = (evt, reservaId) => {
    evt.stopPropagation();
    var existing = document.getElementById('rs-pop-global');
    var sameBtn  = window._rsPopBtn === evt.currentTarget;
    if (existing) { existing.remove(); window._rsPopBtn = null; }
    if (sameBtn) return;

    window._rsPopBtn = evt.currentTarget;
    var data = (window._rsData || {})[reservaId];
    if (!data) return;

    var rect = evt.currentTarget.getBoundingClientRect();

    var itemsHtml = data.items.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(185,149,77,0.1);">
            <div>
                <span style="color:var(--cream);font-size:0.82rem;">${p.nombre}</span>
                <span style="color:var(--text-muted-custom);font-size:0.7rem;margin-left:4px;">×${p.cantidad}</span>
            </div>
            <span style="color:var(--gold);font-size:0.82rem;font-weight:600;white-space:nowrap;margin-left:12px;">
                ${p.precio ? (parseFloat(p.precio) * p.cantidad).toFixed(2) + ' €' : ''}
            </span>
        </div>`).join('');

    var total = data.total ? parseFloat(data.total).toFixed(2) + ' €' : '—';

    var pop = document.createElement('div');
    pop.id = 'rs-pop-global';
    pop.innerHTML = `
        <p style="font-size:0.6rem;letter-spacing:2.5px;color:var(--text-muted-custom);margin-bottom:12px;text-transform:uppercase;"> Pedido Room Service</p>
        ${itemsHtml}
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(185,149,77,0.25);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.68rem;letter-spacing:1px;color:var(--text-muted-custom);">SUBTOTAL</span>
            <span style="color:var(--gold);font-weight:700;font-size:0.95rem;">${total}</span>
        </div>`;

    Object.assign(pop.style, {
        position:    'fixed',
        zIndex:      '99999',
        background:  'linear-gradient(145deg,#1c1507,#181810)',
        border:      '1px solid rgba(185,149,77,0.45)',
        borderRadius:'10px',
        padding:     '16px 18px',
        minWidth:    '250px',
        maxWidth:    '320px',
        boxShadow:   '0 16px 48px rgba(0,0,0,0.75),0 0 0 1px rgba(185,149,77,0.08)',
        top:         (rect.bottom + 8) + 'px',
        left:        Math.min(rect.left, window.innerWidth - 340) + 'px',
    });

    document.body.appendChild(pop);

    // Animación de entrada
    pop.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:140,easing:'ease-out',fill:'forwards'});

    // Cerrar al click fuera
    setTimeout(() => {
        document.addEventListener('click', function closeRS(e) {
            if (!pop.contains(e.target)) {
                pop.animate([{opacity:1},{opacity:0,transform:'translateY(-4px)'}],{duration:100,easing:'ease-in',fill:'forwards'}).onfinish = () => pop.remove();
                window._rsPopBtn = null;
                document.removeEventListener('click', closeRS);
            }
        });
    }, 10);
};

window.adminCancelarReserva = async (id) => {
    if (!confirm(t('adm_res_confirm_cancel'))) return;
    try {
        var res = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminReservas();
        } else {
            alert(t('adm_res_cancel_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

window.adminModificarReserva = async (r) => {
    var todosServicios = await fetchServicios();
    var dIn = r.fechaEntrada;
    var dOut = r.fechaSalida;
    
    var servHtml = todosServicios.map(s => {
        if(s.nombre.toLowerCase().includes('room service')) return '';
        var isChecked = r.servicios && r.servicios.some(rs => rs.nombre === s.nombre) ? 'checked' : '';
        return `
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:0.85rem; color:var(--cream); cursor:pointer;">
                <input type="checkbox" class="mod-serv-check" value="${s.id}" ${isChecked} style="accent-color:var(--gold); width:16px; height:16px;">
                ${s.nombre} (+${parseFloat(s.precio).toFixed(2)} €)
            </label>
        `;
    }).join('');

    var modalHtml = `
        <div id="modal-mod-reserva" style="display:flex; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:460px; margin:16px;">
                <h3 class="serif mb-1" style="color:var(--cream); font-size:1.4rem;">${t('adm_mod_title')}${r.id}</h3>
                <p style="font-size:0.75rem; color:var(--text-muted-custom); margin-bottom:20px;">
                    ${r.clienteNombre} (${r.habitacionTipo} nº ${r.habitacionNumero})
                </p>

                <div class="mb-3 d-flex gap-2">
                    <div style="flex:1;">
                        <label class="admin-form-label">${t('adm_mod_arrival')}</label>
                        <input type="date" id="mod-llegada" class="admin-form-input" value="${dIn}" required>
                    </div>
                    <div style="flex:1;">
                        <label class="admin-form-label">${t('adm_mod_departure')}</label>
                        <input type="date" id="mod-salida" class="admin-form-input" value="${dOut}" required>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="admin-form-label mb-2">${t('adm_mod_add_services')}</label>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(185,149,77,0.2); border-radius:8px; padding:16px; max-height:180px; overflow-y:auto;">
                        ${servHtml || '<p style="color:var(--text-muted-custom);font-size:0.8rem;margin:0;">' + t('adm_mod_no_services') + '</p>'}
                    </div>
                </div>

                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarModificacionReserva(${r.id})">${t('adm_mod_save')}</button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalModRe()">${t('adm_mod_cancel')}</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Inicializar Flatpickr en los nuevos inputs del modal
    flatpickr('#mod-llegada', FP_CONFIG);
    flatpickr('#mod-salida', FP_CONFIG);
};

window.cerrarModalModRe = () => {
    var el = document.getElementById('modal-mod-reserva');
    if (el) el.remove();
};

window.guardarModificacionReserva = async (id) => {
    var inDate = document.getElementById('mod-llegada').value;
    var outDate = document.getElementById('mod-salida').value;
    
    var checks = document.querySelectorAll('.mod-serv-check:checked');
    var serviciosArr = Array.from(checks).map(c => ({ servicioId: parseInt(c.value), cantidad: 1 }));

    try {
        var res = await fetch('/api/reservas/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fechaEntrada: inDate,
                fechaSalida: outDate,
                servicios: serviciosArr
            })
        });

        if (res.ok) {
            cerrarModalModRe();
            // Refresca la caché completa del calendario y los datos
            if (typeof adminCalInvalidarCache === 'function') adminCalInvalidarCache();
            // Determina la pestaña activa para refrescar la vista correcta
            var activa = document.querySelector('.admin-tab-btn.active');
            var tab = activa && activa.id ? activa.id.replace(/^atab-/, '') : 'reservas';
            if (tab === 'dashboard')      loadAdminDashboard();
            else if (tab === 'reservas')  loadAdminReservas();
            else                          loadAdminReservas();   // por defecto, refresca calendario
            // Recarga gráficos del dashboard si están abiertos
            if (typeof adminChartsLoad === 'function') adminChartsLoad();
        } else {
            var msg = await res.text();
            alert(t('adm_mod_error') + msg);
        }
    } catch(e) {
        alert(t('adm_mod_error_conn'));
    }
};

// ── ADMIN: HABITACIONES (por tipo) ───────────────────────────────────────────

var TIPO_LABELS_ADMIN = {
    NORMAL: { label: 'tipo_normal' },
    DOBLE:  { label: 'tipo_doble'  },
    SUITE:  { label: 'tipo_suite'  },
    LUJO:   { label: 'tipo_lujo'   },
};

async function loadAdminHabitaciones() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/habitaciones'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_hab_error') + '</p>'; return; }
    var habitaciones = await res.json();

    // Agrupa por tipo
    var tipos = { NORMAL: [], DOBLE: [], SUITE: [], LUJO: [] };
    habitaciones.forEach(h => {
        if (tipos[h.tipo]) tipos[h.tipo].push(h);
    });

    var tipoOrder = ['NORMAL', 'DOBLE', 'SUITE', 'LUJO'];

    var cardsHtml = tipoOrder.map(tipo => {
        var lista = tipos[tipo];
        var _rawInfo = TIPO_LABELS_ADMIN[tipo] || { label: tipo };
        var info  = { label: t(_rawInfo.label) };
        var precio    = lista.length > 0 ? parseFloat(lista[0].precioNoche).toFixed(2) : '—';
        var desc      = lista.length > 0 ? (lista[0].descripcion || '') : '';
        var count     = lista.length;
        var descEsc   = desc.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        var precioVal = lista.length > 0 ? parseFloat(lista[0].precioNoche) : 0;
        var bgImg     = (TIPO_IMAGES[tipo] || [])[0] || '';
        var bgStyle   = bgImg ? `background-image:url('${bgImg}'); background-size:cover; background-position:center;` : '';

        return `
        <div style="position:relative; border-radius:14px; overflow:hidden; min-height:260px; display:flex; flex-direction:column; justify-content:flex-end; ${bgStyle} box-shadow:0 4px 24px rgba(0,0,0,0.35);">
            <!-- Overlay degradado oscuro -->
            <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.92) 100%); border-radius:14px;"></div>
            <!-- Badge cantidad -->
            <div style="position:absolute; top:14px; right:14px; font-size:0.68rem; background:rgba(185,149,77,0.85); color:#0a0a0a; padding:4px 12px; border-radius:20px; letter-spacing:1px; font-weight:700;">
                ${count}${t('adm_hab_count')}
            </div>
            <!-- Contenido inferior -->
            <div style="position:relative; padding:20px 22px 22px;">
                <p style="margin:0 0 2px; font-size:0.6rem; letter-spacing:3px; color:rgba(255,255,255,0.5); text-transform:uppercase;">${tipo}</p>
                <p style="margin:0 0 6px; font-size:1.1rem; color:var(--cream); font-family:'Playfair Display',serif; font-weight:700;">${info.label}</p>
                <p style="margin:0 0 4px; font-size:1.6rem; color:var(--gold); font-weight:700; line-height:1;">${precio} <small style="font-size:0.85rem; color:rgba(255,255,255,0.5); font-weight:400;">€/noche</small></p>
                <p style="margin:0 0 16px; font-size:0.75rem; color:rgba(255,255,255,0.55); min-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${desc || t('adm_hab_no_desc')}</p>
                <button class="admin-btn" onclick="abrirModalTipo('${tipo}', ${precioVal}, '${descEsc}')" style="width:100%;">${t('adm_hab_edit')}</button>
            </div>
        </div>`;
    }).join('');

    body.innerHTML = `
        <div class="admin-stats-grid">${cardsHtml}</div>

        <!-- Modal editar tipo -->
        <div id="modal-tipo-hab" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:460px; margin:16px;">
                <h3 class="serif mb-1" id="modal-tipo-title" style="color:var(--cream); font-size:1.4rem;"></h3>
                <p style="font-size:0.72rem; letter-spacing:1px; color:var(--text-muted-custom); margin-bottom:24px;" id="modal-tipo-note"></p>
                <div class="mb-3">
                    <label class="admin-form-label" id="modal-tipo-price-lbl"></label>
                    <input type="number" id="tipo-precio" class="admin-form-input" step="0.01" min="0">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label" id="modal-tipo-desc-lbl"></label>
                    <input type="text" id="tipo-descripcion" class="admin-form-input">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label">Gestión de Imágenes (click para cambiar)</label>
                    <div id="modal-tipo-images" style="display:flex; gap:10px; margin-top:8px;"></div>
                </div>
                <div id="modal-tipo-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" id="btn-guardar-tipo" onclick="guardarTipoHabitacion()"></button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalTipo()"></button>
                </div>
            </div>
        </div>`;
}

var _editTipoActual = null;

window.abrirModalTipo = (tipo, precio, descripcion) => {
    _editTipoActual = tipo;
    var _rawInfo = TIPO_LABELS_ADMIN[tipo] || { label: tipo };
    document.getElementById('modal-tipo-title').textContent = t(_rawInfo.label);
    document.getElementById('modal-tipo-note').innerHTML    = t('adm_hab_modal_note');
    document.getElementById('modal-tipo-price-lbl').textContent = t('adm_hab_price_label');
    document.getElementById('modal-tipo-desc-lbl').textContent  = t('adm_hab_desc_label');
    document.getElementById('tipo-precio').placeholder      = t('adm_hab_price_placeholder');
    document.getElementById('tipo-descripcion').placeholder = t('adm_hab_desc_placeholder');
    document.getElementById('tipo-precio').value      = precio || '';
    document.getElementById('tipo-descripcion').value = descripcion || '';

    // Cargar imagenes actuales
    var imgsContainer = document.getElementById('modal-tipo-images');
    imgsContainer.innerHTML = '';
    var images = typeof TIPO_IMAGES !== 'undefined' ? (TIPO_IMAGES[tipo] || []) : [];
    images.forEach((imgUrl) => {
        imgsContainer.innerHTML += `
            <div style="position:relative; width:80px; height:60px; border-radius:6px; overflow:hidden; border:1px solid rgba(185,149,77,0.3);">
                <img src="${imgUrl}?t=${Date.now()}" style="width:100%; height:100%; object-fit:cover;">
                <label style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0; transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                    <span style="color:white; font-size:0.65rem;">Cambiar</span>
                    <input type="file" style="display:none;" accept="image/png, image/jpeg" onchange="uploadRoomImage('${tipo}', '${imgUrl}', this)">
                </label>
            </div>
        `;
    });
    document.getElementById('modal-tipo-error').classList.add('d-none');
    document.getElementById('btn-guardar-tipo').textContent = t('adm_hab_save');
    document.querySelector('#modal-tipo-hab .admin-btn--ghost').textContent = t('adm_hab_cancel');
    var modal = document.getElementById('modal-tipo-hab');
    modal.style.display = 'flex';
};

window.cerrarModalTipo = () => {
    document.getElementById('modal-tipo-hab').style.display = 'none';
};

window.uploadRoomImage = async (tipo, imgUrl, input) => {
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var formData = new FormData();
    
    var filename = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
    if (filename.indexOf('?') !== -1) {
        filename = filename.substring(0, filename.indexOf('?'));
    }

    formData.append('filename', filename);
    formData.append('file', file);

    try {
        var res = await fetch('/api/admin/habitaciones/tipo/' + tipo + '/imagen', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            abrirModalTipo(tipo, document.getElementById('tipo-precio').value, document.getElementById('tipo-descripcion').value);
            loadAdminHabitaciones();
        } else {
            var msg = await res.text();
            alert('Error al subir imagen: ' + msg);
        }
    } catch(e) {
        alert('Error de conexión al subir la imagen');
    }
};

window.guardarTipoHabitacion = async () => {
    var precio      = document.getElementById('tipo-precio').value;
    var descripcion = document.getElementById('tipo-descripcion').value.trim();
    var errEl       = document.getElementById('modal-tipo-error');
    var btn         = document.getElementById('btn-guardar-tipo');

    if (!precio || parseFloat(precio) <= 0) {
        errEl.textContent = t('adm_hab_price_error');
        errEl.classList.remove('d-none'); return;
    }

    btn.disabled    = true;
    btn.textContent = t('adm_hab_saving');

    try {
        var res = await fetch('/api/habitaciones/tipo/' + _editTipoActual, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ precioNoche: parseFloat(precio), descripcion: descripcion || null }),
        });
        if (res.ok) {
            cerrarModalTipo();
            loadAdminHabitaciones();
        } else if (res.status === 404) {
            errEl.textContent = t('adm_hab_not_found');
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = t('adm_hab_save_error');
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = t('adm_hab_conn_error');
        errEl.classList.remove('d-none');
    } finally {
        btn.disabled    = false;
        btn.textContent = t('adm_hab_save');
    }
};

// ── ADMIN: SERVICIOS ──────────────────────────────────────────────────────────

async function loadAdminServicios() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/servicios'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_svc_error') + '</p>'; return; }
    var servicios = await res.json();

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalServicio(null)">${t('adm_svc_new')}</button>
        </div>
        <table class="admin-table">
            <thead><tr><th>#</th><th>${t('adm_svc_col_name')}</th><th>${t('adm_svc_col_price')}</th><th></th></tr></thead>
            <tbody>
                ${servicios.map(s => `
                    <tr>
                        <td>${s.id}</td>
                        <td style="color:var(--cream);">${s.nombre}</td>
                        <td style="color:var(--gold);">${parseFloat(s.precio).toFixed(2)} €</td>
                        <td style="white-space:nowrap;">
                            <button class="admin-btn" onclick='abrirModalServicio(${JSON.stringify(s)})'>${t('adm_svc_edit')}</button>
                            <button class="admin-btn admin-btn--danger" onclick="adminEliminarServicio(${s.id})">${t('adm_svc_delete')}</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>

        <!-- Modal servicio -->
        <div id="modal-servicio" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a1a; border:1px solid rgba(185,149,77,0.3); border-radius:12px; padding:32px; width:100%; max-width:400px;">
                <h3 class="serif mb-4" id="modal-svc-title" style="color:var(--cream);"></h3>
                <div class="mb-3">
                    <label class="admin-form-label" id="svc-name-lbl"></label>
                    <input type="text" id="svc-nombre" class="admin-form-input">
                </div>
                <div class="mb-4">
                    <label class="admin-form-label" id="svc-price-lbl"></label>
                    <input type="number" id="svc-precio" class="admin-form-input" step="0.01" min="0">
                </div>
                <div class="mb-4" id="svc-images-container" style="display:none;">
                    <label class="admin-form-label">Gestión de Imágenes (click para cambiar)</label>
                    <div id="modal-svc-images" style="display:flex; gap:10px; margin-top:8px; flex-wrap:wrap;"></div>
                </div>
                <div id="modal-svc-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarServicio()" id="btn-svc-save"></button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalServicio()" id="btn-svc-cancel"></button>
                </div>
            </div>
        </div>`;
}

var _editSvcId = null;

window.abrirModalServicio = (svc) => {
    _editSvcId = svc ? svc.id : null;
    document.getElementById('modal-svc-title').textContent = svc ? t('adm_svc_modal_edit') : t('adm_svc_modal_new');
    document.getElementById('svc-name-lbl').textContent    = t('adm_svc_name_label');
    document.getElementById('svc-price-lbl').textContent   = t('adm_svc_price_label');
    document.getElementById('svc-nombre').placeholder      = t('adm_svc_name_placeholder');
    document.getElementById('svc-precio').placeholder      = t('adm_svc_price_placeholder');
    document.getElementById('svc-nombre').value = svc ? svc.nombre : '';
    document.getElementById('svc-precio').value = svc ? svc.precio : '';

    var imagesContainer = document.getElementById('svc-images-container');
    var imgsDiv = document.getElementById('modal-svc-images');
    imgsDiv.innerHTML = '';
    
    if (svc && typeof SERVICIO_DATA !== 'undefined' && SERVICIO_DATA[svc.id] && SERVICIO_DATA[svc.id].images) {
        imagesContainer.style.display = 'block';
        var images = SERVICIO_DATA[svc.id].images;
        images.forEach((imgUrl) => {
            imgsDiv.innerHTML += `
                <div style="position:relative; width:80px; height:60px; border-radius:6px; overflow:hidden; border:1px solid rgba(185,149,77,0.3);">
                    <img src="${imgUrl}?t=${Date.now()}" style="width:100%; height:100%; object-fit:cover;">
                    <label style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0; transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                        <span style="color:white; font-size:0.65rem;">Cambiar</span>
                        <input type="file" style="display:none;" accept="image/png, image/jpeg" onchange="uploadSvcImage(${svc.id}, '${imgUrl}', this)">
                    </label>
                </div>
            `;
        });
    } else {
        imagesContainer.style.display = 'none';
    }

    document.getElementById('modal-svc-error').classList.add('d-none');
    document.getElementById('btn-svc-save').textContent   = t('adm_svc_save');
    document.getElementById('btn-svc-cancel').textContent = t('adm_svc_cancel');
    var modal = document.getElementById('modal-servicio');
    modal.style.display = 'flex';
};

window.cerrarModalServicio = () => {
    document.getElementById('modal-servicio').style.display = 'none';
};

window.uploadSvcImage = async (id, imgUrl, input) => {
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var formData = new FormData();
    
    var filename = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
    if (filename.indexOf('?') !== -1) {
        filename = filename.substring(0, filename.indexOf('?'));
    }

    formData.append('filename', filename);
    formData.append('file', file);

    try {
        var res = await fetch('/api/admin/servicios/' + id + '/imagen', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            var fakeSvc = { id: id, nombre: document.getElementById('svc-nombre').value, precio: document.getElementById('svc-precio').value };
            abrirModalServicio(fakeSvc);
            loadAdminServicios();
        } else {
            var msg = await res.text();
            alert('Error al subir imagen: ' + msg);
        }
    } catch(e) {
        alert('Error de conexión al subir la imagen');
    }
};

window.guardarServicio = async () => {
    var nombre = document.getElementById('svc-nombre').value.trim();
    var precio = document.getElementById('svc-precio').value;
    var errEl  = document.getElementById('modal-svc-error');

    if (!nombre || !precio) {
        errEl.textContent = t('adm_svc_req_error');
        errEl.classList.remove('d-none'); return;
    }

    var url    = _editSvcId ? '/api/servicios/' + _editSvcId : '/api/servicios';
    var method = _editSvcId ? 'PUT' : 'POST';

    try {
        var res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio: parseFloat(precio) }),
        });
        if (res.ok || res.status === 201) {
            _serviciosCache = null; // invalidar cache
            cerrarModalServicio();
            loadAdminServicios();
        } else if (res.status === 409) {
            errEl.textContent = t('adm_svc_dup_error');
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = t('adm_svc_save_error');
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = t('adm_svc_conn_error');
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarServicio = async (id) => {
    if (!confirm(t('adm_svc_del_confirm'))) return;
    try {
        var res = await fetch('/api/servicios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _serviciosCache = null;
            loadAdminServicios();
        } else {
            alert(t('adm_svc_del_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

// ── ADMIN: ROOM SERVICE ───────────────────────────────────────────────────────

async function loadAdminRoomService() {
    var body = document.getElementById('admin-tab-body');
    var res;
    try { res = await fetch('/api/room-service/items'); } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>'; return;
    }
    if (!res.ok) { body.innerHTML = '<p style="color:#c0392b;">' + t('adm_rs_error') + '</p>'; return; }
    var items = await res.json();
    _rsItemsCache = null; // invalidar caché del frontend al editar desde admin

    var categorias = ['DESAYUNO','ALMUERZO','CENA','SNACKS','BEBIDAS'];
    var catLabels  = { DESAYUNO: t('cat_DESAYUNO'), ALMUERZO: t('cat_ALMUERZO'), CENA: t('cat_CENA'), SNACKS: t('cat_SNACKS'), BEBIDAS: t('cat_BEBIDAS') };

    var tablasPorCat = categorias.map(cat => {
        var catItems = items.filter(i => i.categoria === cat);
        if (catItems.length === 0) return '';
        return `
            <p style="font-size:0.7rem;letter-spacing:2px;color:var(--text-muted-custom);margin:18px 0 6px;text-transform:uppercase;">${catLabels[cat]}</p>
            <table class="admin-table">
                <thead><tr><th>#</th><th>${t('adm_rs_col_name')}</th><th>${t('adm_rs_col_price')}</th><th>${t('adm_rs_col_avail')}</th><th></th></tr></thead>
                <tbody>
                    ${catItems.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td style="color:var(--cream);">${item.nombre}</td>

                            <td style="color:var(--gold);">${parseFloat(item.precio).toFixed(2)} €</td>
                            <td>${item.disponible ? '<span class="admin-badge" style="color:#27ae60;">' + t('adm_rs_yes') + '</span>' : '<span class="admin-badge" style="color:#c0392b;">' + t('adm_rs_no') + '</span>'}</td>
                            <td style="white-space:nowrap;">
                                <button class="admin-btn" onclick='abrirModalRSItem(${JSON.stringify(item)})'>${t('adm_rs_edit')}</button>
                                <button class="admin-btn admin-btn--danger" onclick="adminEliminarRSItem(${item.id})">${t('adm_rs_delete')}</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }).join('');

    body.innerHTML = `
        <div class="mb-3">
            <button class="admin-btn" onclick="abrirModalRSItem(null)">${t('adm_rs_new')}</button>
        </div>
        ${tablasPorCat || '<p style="color:var(--text-muted-custom);font-size:0.8rem;letter-spacing:1px;margin-top:12px;">' + t('adm_rs_empty') + '</p>'}

        <!-- Modal ítem room service -->
        <div id="modal-rs-item" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:#1a1a1a;border:1px solid rgba(185,149,77,0.3);border-radius:12px;padding:32px;width:100%;max-width:460px;margin:16px;max-height:90vh;overflow-y:auto;">
                <h3 class="serif mb-4" id="modal-rsitem-title" style="color:var(--cream);"></h3>
                <div class="mb-3">
                    <label class="admin-form-label" id="rsi-name-lbl"></label>
                    <input type="text" id="rsi-nombre" class="admin-form-input">
                </div>

                <div class="mb-3">
                    <label class="admin-form-label" id="rsi-price-lbl"></label>
                    <input type="number" id="rsi-precio" class="admin-form-input" step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label class="admin-form-label" id="rsi-cat-lbl"></label>
                    <select id="rsi-categoria" class="admin-form-input" style="cursor:pointer;">
                        <option value="DESAYUNO"></option>
                        <option value="ALMUERZO"></option>
                        <option value="CENA"></option>
                        <option value="SNACKS"></option>
                        <option value="BEBIDAS"></option>
                    </select>
                </div>
                <div class="mb-4" style="display:flex;align-items:center;gap:10px;">
                    <input type="checkbox" id="rsi-disponible" checked style="accent-color:var(--gold);width:16px;height:16px;cursor:pointer;">
                    <label for="rsi-disponible" class="admin-form-label" id="rsi-avail-lbl" style="margin:0;cursor:pointer;"></label>
                </div>
                <div id="modal-rsitem-error" class="admin-form-error d-none"></div>
                <div class="d-flex gap-3">
                    <button class="admin-btn" onclick="guardarRSItem()" id="btn-rsi-save"></button>
                    <button class="admin-btn admin-btn--ghost" onclick="cerrarModalRSItem()" id="btn-rsi-cancel"></button>
                </div>
            </div>
        </div>`;
}

var _editRSItemId = null;

window.abrirModalRSItem = (item) => {
    _editRSItemId = item ? item.id : null;
    document.getElementById('modal-rsitem-title').textContent = item ? t('adm_rs_modal_edit') : t('adm_rs_modal_new');
    document.getElementById('rsi-name-lbl').textContent  = t('adm_rs_name_label');

    document.getElementById('rsi-price-lbl').textContent = t('adm_rs_price_label');
    document.getElementById('rsi-cat-lbl').textContent   = t('adm_rs_cat_label');
    document.getElementById('rsi-avail-lbl').textContent = t('adm_rs_avail_label');
    document.getElementById('btn-rsi-save').textContent   = t('adm_rs_save');
    document.getElementById('btn-rsi-cancel').textContent = t('adm_rs_cancel');
    // Translate select options
    var catLabels2 = { DESAYUNO: t('cat_DESAYUNO'), ALMUERZO: t('cat_ALMUERZO'), CENA: t('cat_CENA'), SNACKS: t('cat_SNACKS'), BEBIDAS: t('cat_BEBIDAS') };
    document.querySelectorAll('#rsi-categoria option').forEach(function(opt) {
        opt.textContent = catLabels2[opt.value] || opt.value;
    });
    document.getElementById('rsi-nombre').value      = item ? item.nombre      : '';

    document.getElementById('rsi-precio').value      = item ? item.precio      : '';
    document.getElementById('rsi-categoria').value   = item ? item.categoria   : 'SNACKS';
    document.getElementById('rsi-disponible').checked = item ? item.disponible : true;
    document.getElementById('modal-rsitem-error').classList.add('d-none');
    document.getElementById('modal-rs-item').style.display = 'flex';
};

window.cerrarModalRSItem = () => {
    document.getElementById('modal-rs-item').style.display = 'none';
};

window.guardarRSItem = async () => {
    var nombre      = document.getElementById('rsi-nombre').value.trim();

    var precio      = document.getElementById('rsi-precio').value;
    var categoria   = document.getElementById('rsi-categoria').value;
    var disponible  = document.getElementById('rsi-disponible').checked;
    var errEl       = document.getElementById('modal-rsitem-error');

    if (!nombre || !precio || parseFloat(precio) <= 0) {
        errEl.textContent = t('adm_rs_req_error');
        errEl.classList.remove('d-none'); return;
    }

    var url    = _editRSItemId ? '/api/room-service/items/' + _editRSItemId : '/api/room-service/items';
    var method = _editRSItemId ? 'PUT' : 'POST';

    try {
        var res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio: parseFloat(precio), categoria, disponible }),
        });
        if (res.ok || res.status === 201) {
            _rsItemsCache = null;
            cerrarModalRSItem();
            loadAdminRoomService();
        } else if (res.status === 404) {
            errEl.textContent = t('adm_rs_not_found');
            errEl.classList.remove('d-none');
        } else {
            errEl.textContent = t('adm_rs_save_error');
            errEl.classList.remove('d-none');
        }
    } catch (_) {
        errEl.textContent = t('adm_rs_conn_error');
        errEl.classList.remove('d-none');
    }
};

window.adminEliminarRSItem = async (id) => {
    if (!confirm(t('adm_rs_del_confirm'))) return;
    try {
        var res = await fetch('/api/room-service/items/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            _rsItemsCache = null;
            loadAdminRoomService();
        } else if (res.status === 409) {
            alert(t('adm_rs_del_active'));
        } else {
            alert(t('adm_rs_del_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

// ── ADMIN: USUARIOS ───────────────────────────────────────────────────────────

var _cachedUsuariosAdmin = [];

var _cachedRolesAdmin = [];

async function loadAdminUsuarios() {
    var body = document.getElementById('admin-tab-body');
    try {
        var [resUsr, resRoles] = await Promise.all([
            fetch('/api/admin/usuarios'),
            fetch('/api/admin/roles')
        ]);
        if (!resUsr.ok) {
            body.innerHTML = '<p style="color:#c0392b;">' + t('adm_usr_error') + '</p>';
            return;
        }
        var todosUsuarios = await resUsr.json();
        _cachedUsuariosAdmin = todosUsuarios.filter(u => {
            var roles = u.roles || (u.rol ? [u.rol] : []);
            return !roles.includes('ROLE_CLIENTE');
        });
        var todosRoles = resRoles.ok ? await resRoles.json() : [];
        _cachedRolesAdmin = todosRoles.filter(r => r.name !== 'ROLE_CLIENTE');
    } catch (_) {
        body.innerHTML = '<p style="color:#c0392b;">' + t('adm_error_conn') + '</p>';
        return;
    }

    var optionsRoles = _cachedRolesAdmin
        .map(r => `<option value="${r.name}">${prettyRole(r.name)}</option>`)
        .join('');

    body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
                <div style="font-size:0.85rem; color:var(--cream);">
                    Buscar:
                    <input type="text" id="admin-usr-search" class="admin-form-input"
                           placeholder="Nombre o email..."
                           style="display:inline-block; width:200px; margin-left:10px; padding:6px 12px;"
                           oninput="filtrarUsuarios()">
                </div>
                <div style="font-size:0.85rem; color:var(--cream);">
                    Filtrar por rol:
                    <select id="admin-usr-role-filter" class="admin-form-input"
                            style="display:inline-block; width:auto; margin-left:10px; padding:6px 12px; cursor:pointer;"
                            onchange="filtrarUsuarios()">
                        <option value="ALL">Todos</option>
                        ${optionsRoles}
                        <option value="__SIN__">Sin rol</option>
                    </select>
                </div>
                <button class="admin-btn" onclick="loadAdminUsuarios()" style="font-size:0.7rem; padding:6px 14px;">↻ Refrescar</button>
            </div>
            <button class="admin-btn admin-btn--gold" onclick="openNuevoEmpleadoModal()" style="font-size:0.75rem; padding:7px 18px; background:rgba(201,168,76,0.15); border-color:rgba(201,168,76,0.4); color:#c9a84c;">+ Nuevo Empleado</button>
        </div>
        <div id="admin-usr-table-container"></div>
    `;

    renderUsuariosTable(_cachedUsuariosAdmin);
}

window.filtrarUsuarios = () => {
    var query = (document.getElementById('admin-usr-search').value || "").toLowerCase();
    var role  = (document.getElementById('admin-usr-role-filter').value || "ALL");

    var filtered = _cachedUsuariosAdmin.filter(u => {
        var nombre = (u.nombre || "").toLowerCase();
        var email  = (u.email  || "").toLowerCase();
        var matchesText = nombre.includes(query) || email.includes(query);

        var matchesRole = true;
        var roles = u.roles || (u.rol ? [u.rol] : []);
        if (role === '__SIN__') matchesRole = roles.length === 0;
        else if (role !== 'ALL') matchesRole = roles.indexOf(role) !== -1;

        return matchesText && matchesRole;
    });

    renderUsuariosTable(filtered);
};


window.renderUsuariosTable = (usuarios) => {
    var container = document.getElementById('admin-usr-table-container');
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted-custom); font-size:0.8rem; letter-spacing:1px; margin-top:12px;">No hay usuarios que coincidan con este filtro.</p>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>#</th><th>${t('adm_usr_col_name')}</th><th>${t('adm_usr_col_email')}</th><th>${t('adm_usr_col_role')}</th><th></th></tr></thead>
            <tbody>
                ${usuarios.map(u => {
                    var roles = (u.roles && u.roles.length > 0)
                        ? u.roles
                        : (u.rol && u.rol !== 'SIN ROL' ? [u.rol] : []);
                    var badgesHtml = roles.length === 0
                        ? '<span class="admin-badge admin-badge--muted">SIN ROL</span>'
                        : roles.map(r => {
                            var cls = 'admin-badge ' + ENUMS.rolBadgeClass(r);
                            return `<span class="${cls}">${prettyRole(r)}</span>`;
                          }).join(' ');
                    return `
                        <tr>
                            <td>${u.id}</td>
                            <td><a href="javascript:void(0)" onclick="adminAbrirDetalleUsuario(${u.id})" style="color:#c9a84c;text-decoration:none;font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(201,168,76,0.4);" onmouseover="this.style.borderBottomColor='#c9a84c'" onmouseout="this.style.borderBottomColor='rgba(201,168,76,0.4)'">${u.nombre || '—'}</a></td>
                            <td style="color:var(--text-muted-custom);">${u.email}</td>
                            <td>${badgesHtml}</td>
                            <td><button class="admin-btn admin-btn--danger" onclick="adminEliminarUsuario(${u.id})">${t('adm_usr_delete')}</button></td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function prettyRole(name) {
    return ENUMS.rolLabel(name);
}

window.adminEliminarUsuario = async (id) => {
    if (!confirm(t('adm_usr_del_confirm'))) return;
    try {
        var res = await fetch('/api/admin/usuarios/' + id, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            loadAdminUsuarios();
        } else if (res.status === 400) {
            var data = await res.text();
            alert(data || t('adm_usr_del_active'));
        } else {
            alert(t('adm_usr_del_error'));
        }
    } catch (_) { alert(t('adm_error_conn')); }
};

