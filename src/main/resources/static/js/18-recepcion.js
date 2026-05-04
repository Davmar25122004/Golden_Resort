// ── PANEL RECEPCIÓN ───────────────────────────────────────────────────────────

window._recepcionState = {
    llegadas: [],
    enEstancia: [],
    salidas: [],
    busqueda: []
};

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('recepcion-root')) return;
    setTimeout(() => recepcionInit(), 200);
});

async function recepcionInit() {
    var root = document.getElementById('recepcion-root');
    if (!root) return;

    var mc = document.getElementById('main-content');
    if (mc) mc.style.display = 'block';

    root.innerHTML = `
        <div class="rcp-wrap">
            <div class="rcp-header">
                <div>
                    <h1 class="rcp-title">Recepción</h1>
                    <div class="rcp-subtitle">Panel del día — <span id="rcp-fecha"></span></div>
                </div>
                <div class="rcp-actions">
                    <button class="rcp-btn" onclick="recepcionRecargar()">↻ Refrescar</button>
                    <button class="rcp-btn rcp-btn--primary" onclick="recepcionAbrirWalkin()">+ Walk-in</button>
                </div>
            </div>

            <input type="text" class="rcp-search mb-4" id="rcp-search" placeholder="Buscar por nº reserva, habitación, email o nombre…">

            <div id="rcp-busqueda-wrap" style="display:none; margin-bottom:2rem;">
                <div class="rcp-col">
                    <div class="rcp-col-title">Resultados de búsqueda <span class="rcp-col-count" id="rcp-busqueda-count">0</span></div>
                    <div id="rcp-busqueda-list"></div>
                </div>
            </div>

            <div class="rcp-grid">
                <div class="rcp-col">
                    <div class="rcp-col-title">Llegadas hoy <span class="rcp-col-count" id="rcp-llegadas-count">0</span></div>
                    <div id="rcp-llegadas-list">
                        <div class="rcp-empty">Cargando…</div>
                    </div>
                </div>
                <div class="rcp-col">
                    <div class="rcp-col-title">En estancia <span class="rcp-col-count" id="rcp-estancia-count">0</span></div>
                    <div id="rcp-estancia-list">
                        <div class="rcp-empty">Cargando…</div>
                    </div>
                </div>
                <div class="rcp-col">
                    <div class="rcp-col-title">Salidas hoy <span class="rcp-col-count" id="rcp-salidas-count">0</span></div>
                    <div id="rcp-salidas-list">
                        <div class="rcp-empty">Cargando…</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    var fechaEl = document.getElementById('rcp-fecha');
    if (fechaEl) fechaEl.textContent = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    var search = document.getElementById('rcp-search');
    if (search) search.addEventListener('input', debounceBuscar);

    await recepcionRecargar();
    setupWalkinFlatpickr();
}

let _searchTimer = null;
function debounceBuscar(ev) {
    var q = ev.target.value.trim();
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => recepcionBuscar(q), 280);
}

async function recepcionRecargar() {
    try {
        var [a, b, c] = await Promise.all([
            fetch('/api/recepcion/llegadas-hoy').then(r => r.ok ? r.json() : []),
            fetch('/api/recepcion/en-estancia').then(r => r.ok ? r.json() : []),
            fetch('/api/recepcion/salidas-hoy').then(r => r.ok ? r.json() : [])
        ]);
        window._recepcionState.llegadas   = a || [];
        window._recepcionState.enEstancia = b || [];
        window._recepcionState.salidas    = c || [];
        renderRecepcion();
    } catch (_) {
        renderEmptyAll('Error de conexión');
    }
}

function renderEmptyAll(msg) {
    ['rcp-llegadas-list','rcp-estancia-list','rcp-salidas-list'].forEach(id => {
        var el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="rcp-empty">${msg}</div>`;
    });
}

function renderRecepcion() {
    renderColumna('rcp-llegadas-list', 'rcp-llegadas-count', window._recepcionState.llegadas, 'Sin llegadas hoy');
    renderColumna('rcp-estancia-list', 'rcp-estancia-count', window._recepcionState.enEstancia, 'Nadie alojado');
    renderColumna('rcp-salidas-list',  'rcp-salidas-count',  window._recepcionState.salidas,    'Sin salidas hoy');
}

function renderColumna(idLista, idCount, items, vacioMsg) {
    var lista = document.getElementById(idLista);
    var count = document.getElementById(idCount);
    if (count) count.textContent = (items || []).length;
    if (!lista) return;
    if (!items || items.length === 0) {
        lista.innerHTML = `<div class="rcp-empty">${vacioMsg}</div>`;
        return;
    }
    lista.innerHTML = items.map(reservaCard).join('');
}

function reservaCard(r) {
    var nombre = r.clienteNombre || r.clienteEmail || 'Cliente';
    var hab = r.habitacionNumero ? `Hab ${r.habitacionNumero}` : '—';
    var tipo = r.habitacionTipo || '';
    var pagada = r.pagada
        ? '<span class="rcp-flag rcp-flag--ok">PAGADA</span>'
        : '<span class="rcp-flag rcp-flag--warn">SIN PAGAR</span>';
    var peticion = r.peticionEspecial ? '<span class="rcp-flag rcp-flag--info">PETICIÓN</span>' : '';
    return `
        <div class="rcp-card" onclick="recepcionAbrirDetalle(${r.id})">
            <div class="rcp-card-title">${escapeHtml(nombre)}</div>
            <div class="rcp-card-meta">
                <strong>${hab}</strong> · ${tipo}<br>
                ${formatFecha(r.fechaEntrada)} → ${formatFecha(r.fechaSalida)}
            </div>
            <div class="rcp-card-flags">${pagada}${peticion}</div>
        </div>
    `;
}

async function recepcionBuscar(q) {
    var wrap = document.getElementById('rcp-busqueda-wrap');
    var list = document.getElementById('rcp-busqueda-list');
    var count = document.getElementById('rcp-busqueda-count');
    if (!q) {
        if (wrap) wrap.style.display = 'none';
        return;
    }
    try {
        var r = await fetch('/api/recepcion/buscar?q=' + encodeURIComponent(q));
        var items = r.ok ? await r.json() : [];
        if (count) count.textContent = items.length;
        if (list) {
            list.innerHTML = items.length === 0
                ? '<div class="rcp-empty">Sin resultados</div>'
                : items.map(reservaCard).join('');
        }
        if (wrap) wrap.style.display = 'block';
    } catch (_) {
        if (list) list.innerHTML = '<div class="rcp-empty">Error de conexión</div>';
        if (wrap) wrap.style.display = 'block';
    }
}

// ── DETALLE ───────────────────────────────────────────────────────────────────

window.recepcionAbrirDetalle = async (id) => {
    var modalEl = document.getElementById('reservaDetalleModal');
    var body    = document.getElementById('reservaDetalleBody');
    if (!modalEl || !body) return;
    body.innerHTML = '<div class="text-center py-4 text-muted">Cargando…</div>';
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    try {
        var r = await fetch('/api/recepcion/reserva/' + id);
        if (!r.ok) {
            body.innerHTML = '<div class="alert alert-danger py-2">No se pudo cargar.</div>';
            return;
        }
        var d = await r.json();
        body.innerHTML = renderDetalle(d);
    } catch (_) {
        body.innerHTML = '<div class="alert alert-danger py-2">Error de conexión.</div>';
    }
};

function renderDetalle(d) {
    var nombre = d.clienteNombre || d.clienteEmail || 'Cliente';
    var inicial = nombre.trim().charAt(0).toUpperCase();

    var noches = '';
    try {
        var d1 = new Date(d.fechaEntrada), d2 = new Date(d.fechaSalida);
        var n = Math.round((d2 - d1) / 86400000);
        if (n > 0) noches = n + ' noche' + (n === 1 ? '' : 's');
    } catch (_) {}

    function pagoEstadoCls(estado) {
        if (estado === 'COMPLETADO')   return 'rcp-pill rcp-pill--ok';
        if (estado === 'CANCELADO')    return 'rcp-pill rcp-pill--err';
        if (estado === 'REEMBOLSADO')  return 'rcp-pill rcp-pill--warn';
        return 'rcp-pill rcp-pill--info';
    }

    var pagosHtml = (d.pagos && d.pagos.length > 0)
        ? d.pagos.map(p => `
            <div class="rcp-pago">
                <div class="rcp-pago-top">
                    <span class="rcp-pago-ref">${escapeHtml(p.referencia || '—')}</span>
                    <span class="${pagoEstadoCls(p.estado)}">${escapeHtml(p.estado || '')}</span>
                </div>
                <div class="rcp-pago-bot">
                    <span>${escapeHtml(p.metodoTipo || '')}</span>
                    <span class="rcp-pago-total">${formatEur(p.total)}</span>
                </div>
            </div>`).join('')
        : '<div class="rcp-empty-line">Sin pagos registrados.</div>';

    var notasHtml = (d.notas && d.notas.length > 0)
        ? d.notas.map(n => `
            <div class="rcp-nota">
                <div class="rcp-nota-meta">${escapeHtml(n.autorEmail || '')} · ${formatFechaHora(n.creadoEn)}</div>
                <div class="rcp-nota-texto">${escapeHtml(n.texto)}</div>
            </div>`).join('')
        : '<div class="rcp-empty-line">Aún no hay notas internas.</div>';

    return `
        <div class="rcp-detalle">
            <div class="rcp-detalle-hero">
                <div class="rcp-detalle-avatar">${escapeHtml(inicial)}</div>
                <div style="flex:1; min-width:0;">
                    <h3>${escapeHtml(nombre)}</h3>
                    <a class="rcp-detalle-email" href="mailto:${escapeHtml(d.clienteEmail || '')}">${escapeHtml(d.clienteEmail || '')}</a>
                </div>
            </div>

            <div class="rcp-detalle-grid">
                <div class="rcp-detalle-card">
                    <div class="rcp-detalle-tag">Habitación</div>
                    <div class="rcp-detalle-room">
                        <span class="rcp-detalle-num">${escapeHtml(d.habitacionNumero || '—')}</span>
                        <span class="rcp-detalle-type">${escapeHtml(d.habitacionTipo || '')}</span>
                    </div>
                </div>
                <div class="rcp-detalle-card">
                    <div class="rcp-detalle-tag">Estancia</div>
                    <div class="rcp-detalle-dates">
                        <strong>${formatFecha(d.fechaEntrada)}</strong>
                        <span class="rcp-detalle-arrow">→</span>
                        <strong>${formatFecha(d.fechaSalida)}</strong>
                    </div>
                    ${noches ? `<div class="rcp-detalle-nights">${noches}</div>` : ''}
                </div>
            </div>

            ${d.peticionEspecial ? `
                <div class="rcp-section">
                    <div class="rcp-section-title">Petición especial</div>
                    <div class="rcp-quote">${escapeHtml(d.peticionEspecial)}</div>
                </div>` : ''}

            <div class="rcp-section">
                <div class="rcp-section-title">Pagos</div>
                ${pagosHtml}
            </div>

            <div class="rcp-section">
                <div class="rcp-section-title">Notas internas</div>
                ${notasHtml}
                <div class="rcp-nueva-nota">
                    <textarea id="rcp-nota-input-${d.id}" placeholder="Escribir nota interna…" maxlength="2000"></textarea>
                    <button class="rcp-btn rcp-btn--primary" onclick="recepcionGuardarNota(${d.id})">Añadir</button>
                </div>
            </div>
        </div>
    `;
}

window.recepcionGuardarNota = async (reservaId) => {
    var ta = document.getElementById('rcp-nota-input-' + reservaId);
    if (!ta) return;
    var texto = ta.value.trim();
    if (!texto) return;
    try {
        var r = await fetch('/api/recepcion/reserva/' + reservaId + '/notas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        if (!r.ok) return;
        ta.value = '';
        recepcionAbrirDetalle(reservaId);
    } catch (_) {}
};

// ── WALK-IN ──────────────────────────────────────────────────────────────────

function setupWalkinFlatpickr() {
    if (typeof flatpickr === 'undefined') return;
    var entrada = document.getElementById('wi-entrada');
    var salida  = document.getElementById('wi-salida');
    if (entrada) flatpickr(entrada, { dateFormat: 'Y-m-d', minDate: 'today' });
    if (salida)  flatpickr(salida,  { dateFormat: 'Y-m-d', minDate: 'today' });
}

window.recepcionAbrirWalkin = () => {
    var modalEl = document.getElementById('walkinModal');
    if (!modalEl) return;
    var err = document.getElementById('walkin-error');
    var ok  = document.getElementById('walkin-success');
    if (err) err.classList.add('d-none');
    if (ok)  ok.classList.add('d-none');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
};

window.recepcionCrearWalkIn = async (ev) => {
    ev.preventDefault();
    var err = document.getElementById('walkin-error');
    var ok  = document.getElementById('walkin-success');
    if (err) err.classList.add('d-none');
    if (ok)  ok.classList.add('d-none');

    var payload = {
        email:           document.getElementById('wi-email').value,
        nombre:          document.getElementById('wi-nombre').value,
        fechaEntrada:    document.getElementById('wi-entrada').value,
        fechaSalida:     document.getElementById('wi-salida').value,
        tipoHabitacion:  document.getElementById('wi-tipo').value,
        peticionEspecial:document.getElementById('wi-peticion').value
    };

    try {
        var r = await fetch('/api/recepcion/walkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!r.ok) {
            var t = await r.text();
            if (err) { err.textContent = t || 'No se pudo crear la reserva.'; err.classList.remove('d-none'); }
            return;
        }
        var data = await r.json();
        if (ok) {
            ok.textContent = 'Reserva creada · Habitación ' + (data.habitacionNumero || '') + ' (' + (data.habitacionTipo || '') + ')';
            ok.classList.remove('d-none');
        }
        document.getElementById('form-walkin').reset();
        await recepcionRecargar();
    } catch (_) {
        if (err) { err.textContent = 'Error de conexión.'; err.classList.remove('d-none'); }
    }
};

// ── HELPERS ──────────────────────────────────────────────────────────────────

function escapeHtml(s) {
    return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatFecha(f) {
    if (!f) return '—';
    try {
        var d = (typeof f === 'string') ? new Date(f) : new Date(f);
        return d.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });
    } catch (_) { return f; }
}

function formatFechaHora(f) {
    if (!f) return '';
    try {
        var d = new Date(f);
        return d.toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    } catch (_) { return f; }
}

function formatEur(v) {
    if (v == null) return '—';
    var n = parseFloat(v);
    if (isNaN(n)) return v;
    return n.toFixed(2) + ' €';
}
