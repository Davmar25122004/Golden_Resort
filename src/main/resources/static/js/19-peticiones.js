// ── PANEL PETICIONES ESPECIALES ───────────────────────────────────────────────

var _peticionesData = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('peticiones-root')) return;
    setTimeout(peticionesInit, 200);
});

async function peticionesInit() {
    var root = document.getElementById('peticiones-root');
    if (!root) return;

    root.innerHTML = `
        <div class="pet-wrap">
            <div class="pet-header">
                <div>
                    <h1 class="pet-title">Peticiones Especiales</h1>
                    <div class="pet-subtitle">Solicitudes de clientes al reservar</div>
                </div>
                <button class="rcp-btn" onclick="peticionesCargar()">↻ Refrescar</button>
            </div>
            <div class="pet-filters">
                <button class="pet-filter-btn active" data-filtro="TODAS"       onclick="peticionesFiltrar('TODAS')">Todas</button>
                <button class="pet-filter-btn"         data-filtro="EN_ESTANCIA" onclick="peticionesFiltrar('EN_ESTANCIA')">En estancia</button>
                <button class="pet-filter-btn"         data-filtro="PROXIMAS"   onclick="peticionesFiltrar('PROXIMAS')">Próximas</button>
            </div>
            <div id="pet-grid" class="pet-grid">
                <div class="pet-empty">Cargando…</div>
            </div>
        </div>`;

    await peticionesCargar();
}

async function peticionesCargar() {
    var grid = document.getElementById('pet-grid');
    if (grid) grid.innerHTML = '<div class="pet-empty">Cargando…</div>';
    try {
        var res = await fetch('/api/recepcion/peticiones');
        if (!res.ok) throw new Error();
        _peticionesData = await res.json();
        var activo = (document.querySelector('.pet-filter-btn.active') || {}).dataset;
        peticionesFiltrar(activo ? activo.filtro : 'TODAS');
    } catch (_) {
        if (grid) grid.innerHTML = '<div class="pet-empty">Error al cargar las peticiones.</div>';
    }
}

function peticionesFiltrar(filtro) {
    document.querySelectorAll('.pet-filter-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.filtro === filtro);
    });

    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    var filtradas = _peticionesData.filter(function (r) {
        var entrada = new Date(r.fechaEntrada + 'T00:00:00');
        var salida  = new Date(r.fechaSalida  + 'T00:00:00');
        if (filtro === 'EN_ESTANCIA') return entrada <= hoy && salida > hoy;
        if (filtro === 'PROXIMAS')   return entrada > hoy;
        if (filtro === 'PASADAS')    return salida <= hoy;
        if (filtro === 'TODAS')      return salida > hoy; // excluir pasadas por defecto
        return true;
    });

    var grid = document.getElementById('pet-grid');
    if (!grid) return;

    if (filtradas.length === 0) {
        grid.innerHTML = '<div class="pet-empty">No hay peticiones' + (filtro !== 'TODAS' ? ' para este filtro' : '') + '.</div>';
        return;
    }

    grid.innerHTML = filtradas.map(function (r) {
        var hoy2    = new Date(); hoy2.setHours(0, 0, 0, 0);
        var entrada = new Date(r.fechaEntrada + 'T00:00:00');
        var salida  = new Date(r.fechaSalida  + 'T00:00:00');
        var badge, badgeClass;
        if (entrada <= hoy2 && salida > hoy2) {
            badge = 'En estancia'; badgeClass = 'pet-badge--estancia';
        } else if (entrada > hoy2) {
            badge = 'Próxima'; badgeClass = 'pet-badge--proxima';
        } else {
            badge = 'Pasada'; badgeClass = 'pet-badge--pasada';
        }

        var nombre = escapeHtml(r.clienteNombre || r.clienteEmail || 'Cliente');
        var email  = escapeHtml(r.clienteEmail || '');
        var hab    = escapeHtml(r.habitacionNumero || '—');
        var tipo   = escapeHtml(r.habitacionTipo  || '');
        var texto  = escapeHtml(r.peticionEspecial || '');

        return `<div class="pet-card">
            <div class="pet-card-top">
                <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
                    <span class="pet-badge ${badgeClass}">${badge}</span>
                    <span class="pet-hab">Hab. ${hab}</span>
                    <span class="pet-tipo">${tipo}</span>
                </div>
                <span class="pet-id">#${r.id}</span>
            </div>
            <div class="pet-cliente">
                <span class="pet-nombre">${nombre}</span>
                <span class="pet-email">${email}</span>
            </div>
            <div class="pet-fechas">
                <span>${petFecha(r.fechaEntrada)}</span>
                <span style="color:var(--gold);">→</span>
                <span>${petFecha(r.fechaSalida)}</span>
            </div>
            <div class="pet-texto-box">
                <div class="pet-texto-label">Petición especial</div>
                <p class="pet-texto-content">&ldquo;${texto}&rdquo;</p>
            </div>
            <button class="rcp-btn" style="margin-top:0.25rem;" onclick="recepcionAbrirDetalle(${r.id})">Ver detalle</button>
        </div>`;
    }).join('');
}

function petFecha(d) {
    if (!d) return '—';
    var p = String(d).split('T')[0].split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
}
