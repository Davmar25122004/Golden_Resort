// ── INCIDENCIAS DE LIMPIEZA / MANTENIMIENTO ─────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('inc-root')) return;
    incRecargar();
    document.addEventListener('shown.bs.modal', (ev) => {
        if (ev.target?.id === 'newIncModal') {
            const sel = document.getElementById('ni-habitacion');
            if (!sel || sel.options.length > 1) return;
            fetch('/api/limpieza/panel').then(r => r.json()).then(lista => {
                sel.innerHTML = '<option value="">— Sin habitación —</option>' +
                    lista.sort((a,b) => String(a.habitacionNumero).localeCompare(String(b.habitacionNumero)))
                         .map(h => `<option value="${h.habitacionId}">Hab. ${esc(h.habitacionNumero)} (${esc(h.habitacionTipo || '')})</option>`).join('');
            }).catch(() => {});
        }
    });
});

window.incRecargar = async () => {
    const root = document.getElementById('inc-root');
    const soloAbiertas = document.getElementById('inc-solo-abiertas')?.checked;
    try {
        const r = await fetch('/api/limpieza/incidencias?abiertas=' + soloAbiertas);
        if (!r.ok) throw new Error();
        const lista = await r.json();
        if (lista.length === 0) {
            root.innerHTML = '<div class="text-center text-muted py-5">Sin incidencias.</div>';
            return;
        }
        root.innerHTML = `
            <table class="limp-inc-table">
                <thead>
                    <tr><th>#</th><th>Tipo</th><th>Prioridad</th><th>Habitación</th><th>Descripción</th><th>Reportada</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                    ${lista.map(rowIncidencia).join('')}
                </tbody>
            </table>`;
    } catch (e) {
        root.innerHTML = '<div class="text-center text-danger py-5">Error cargando incidencias.</div>';
    }
};

function rowIncidencia(i) {
    const cls = (i.estado === 'RESUELTA') ? 'cerrada' : '';
    const estPill = i.estado === 'ABIERTA' ? '<span class="badge bg-warning text-dark">Abierta</span>'
                  : i.estado === 'EN_PROCESO' ? '<span class="badge bg-info text-dark">En proceso</span>'
                  : '<span class="badge bg-success">Resuelta</span>';
    const prioPill = i.prioridad === 'URGENTE' ? '<span class="badge bg-danger">Urgente</span>'
                   : i.prioridad === 'ALTA'    ? '<span class="badge bg-warning text-dark">Alta</span>'
                   : i.prioridad === 'BAJA'    ? '<span class="badge bg-dark">Baja</span>'
                   : '<span class="badge bg-secondary">Normal</span>';
    const accion = i.estado === 'RESUELTA' ? '' :
        `<div class="d-flex gap-1">
            ${i.estado === 'ABIERTA' ? `<button class="btn btn-sm btn-outline-light" onclick="incCambiarEstado(${i.id}, 'EN_PROCESO')">Iniciar</button>` : ''}
            <button class="btn btn-sm btn-gold" onclick="incAbrirResolver(${i.id})">Resolver</button>
        </div>`;
    return `
        <tr class="${cls}">
            <td>${i.id}</td>
            <td><span class="badge bg-secondary">${esc(i.tipo)}</span></td>
            <td>${prioPill}</td>
            <td>${i.habitacionNumero ? `Hab. ${esc(i.habitacionNumero)} <small class="text-muted">${esc(i.habitacionTipo || '')}</small>` : '<span class="text-muted">—</span>'}</td>
            <td style="max-width:340px;">${esc(i.descripcion)}${i.resolucion ? `<div class="small text-muted mt-1"><strong>Resuelto:</strong> ${esc(i.resolucion)}</div>` : ''}</td>
            <td>${i.reportadoNombre || i.reportadoEmail || '—'}<br><small class="text-muted">${formatFechaHora(i.creadaEn)}</small></td>
            <td>${estPill}</td>
            <td>${accion}</td>
        </tr>`;
}

window.incCrear = async (ev) => {
    ev.preventDefault();
    const err = document.getElementById('ni-error');
    err.classList.add('d-none');
    const habRaw = document.getElementById('ni-habitacion').value;
    const body = {
        habitacionId: habRaw ? parseInt(habRaw, 10) : null,
        tipo:         document.getElementById('ni-tipo').value,
        prioridad:    document.getElementById('ni-prioridad').value,
        descripcion:  document.getElementById('ni-descripcion').value
    };
    try {
        const r = await fetch('/api/limpieza/incidencias', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!r.ok) { err.textContent = await r.text() || 'Error.'; err.classList.remove('d-none'); return; }
        document.getElementById('ni-descripcion').value = '';
        bootstrap.Modal.getInstance(document.getElementById('newIncModal'))?.hide();
        incRecargar();
    } catch (e) { err.textContent = 'Error: ' + e.message; err.classList.remove('d-none'); }
};

window.incCambiarEstado = async (id, nuevo) => {
    try {
        const r = await fetch(`/api/limpieza/incidencias/${id}/estado`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevo })
        });
        if (!r.ok) { alert(await r.text() || 'Error.'); return; }
        incRecargar();
    } catch (e) { alert('Error: ' + e.message); }
};

window.incAbrirResolver = (id) => {
    document.getElementById('res-id').value = id;
    document.getElementById('res-comentario').value = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('resolverModal')).show();
};

window.incResolver = async () => {
    const id = document.getElementById('res-id').value;
    const com = document.getElementById('res-comentario').value;
    try {
        const r = await fetch(`/api/limpieza/incidencias/${id}/estado`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'RESUELTA', resolucion: com })
        });
        if (!r.ok) { alert(await r.text() || 'Error.'); return; }
        bootstrap.Modal.getInstance(document.getElementById('resolverModal'))?.hide();
        incRecargar();
    } catch (e) { alert('Error: ' + e.message); }
};

function esc(s) { return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatFechaHora(f) {
    if (!f) return '';
    try { return new Date(f).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }
    catch { return f; }
}
