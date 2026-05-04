// ── OBJETOS PERDIDOS ────────────────────────────────────────────────────────

const OBJ_ICON = {
    cal:  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    note: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
};

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('obj-root')) return;

    // Pre-rellenar fecha/hora actual en el modal de creación
    const fechaInput = document.getElementById('no-fecha');
    if (fechaInput) {
        const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
        fechaInput.value = now.toISOString().slice(0, 16);
    }

    // Cargar habitaciones para el select cuando se abra el modal
    document.addEventListener('shown.bs.modal', (ev) => {
        if (ev.target?.id !== 'newObjModal') return;
        const sel = document.getElementById('no-habitacion');
        if (!sel || sel.options.length > 1) return;
        fetch('/api/limpieza/panel').then(r => r.json()).then(lista => {
            sel.innerHTML = '<option value="">— Sin habitación / zona común —</option>' +
                lista.sort((a,b) => String(a.habitacionNumero).localeCompare(String(b.habitacionNumero)))
                     .map(h => `<option value="${h.habitacionId}">Hab. ${esc(h.habitacionNumero)} (${esc(h.habitacionTipo || '')})</option>`).join('');
        }).catch(() => {});
    });

    objRecargar();
});

window.objRecargar = async () => {
    const root = document.getElementById('obj-root');
    const solo = document.getElementById('obj-solo-disponibles')?.checked;
    try {
        const r = await fetch('/api/limpieza/objetos?soloDisponibles=' + solo);
        if (!r.ok) throw new Error();
        const lista = await r.json();
        if (lista.length === 0) {
            root.innerHTML = '<div class="col-12 text-center text-muted py-5">No hay objetos registrados.</div>';
            return;
        }
        root.innerHTML = lista.map(objCard).join('');
    } catch (e) {
        root.innerHTML = '<div class="col-12 text-center text-danger py-5">Error cargando.</div>';
    }
};

function objCard(o) {
    const cssEstado = o.estado === 'ENTREGADO' ? 'estado-entregado'
                    : o.estado === 'DESCARTADO' ? 'estado-descartado' : 'estado-disponible';
    const badge = o.estado === 'DISPONIBLE' ? '<span class="badge bg-warning text-dark">Disponible</span>'
                : o.estado === 'ENTREGADO'  ? '<span class="badge bg-success">Entregado</span>'
                : '<span class="badge bg-secondary">Descartado</span>';
    const acciones = o.estado === 'DISPONIBLE' ? `
        <div class="d-flex gap-2 mt-2">
            <button class="btn btn-sm btn-gold flex-grow-1" onclick="objAbrirEntregar(${o.id})">Entregar</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="objDescartar(${o.id})">Descartar</button>
        </div>` : '';
    return `
    <div class="col-md-6 col-lg-4">
      <div class="obj-card ${cssEstado}">
        ${o.imagenUrl ? `<a href="${esc(o.imagenUrl)}" target="_blank" rel="noopener"><img src="${esc(o.imagenUrl)}" alt="objeto" class="obj-img"></a>` : '<div class="obj-img obj-img--placeholder">Sin imagen</div>'}
        <div class="obj-body">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <strong>${o.habitacionNumero ? 'Hab. ' + esc(o.habitacionNumero) : 'Zona común'}</strong>
            ${badge}
          </div>
          ${o.habitacionTipo ? `<small class="text-muted d-block">${esc(o.habitacionTipo)}</small>` : ''}
          <div class="mt-2 small">${esc(o.descripcion)}</div>
          <div class="small text-muted mt-2 obj-meta">${OBJ_ICON.cal}<span>${formatFechaHora(o.encontradoEn)}</span></div>
          ${o.reportadoNombre || o.reportadoEmail ? `<div class="small text-muted obj-meta">${OBJ_ICON.user}<span>${esc(o.reportadoNombre || o.reportadoEmail)}</span></div>` : ''}
          ${o.notasEntrega ? `<div class="small text-muted mt-1 obj-meta"><span>${OBJ_ICON.note}</span><span><strong>Entrega:</strong> ${esc(o.notasEntrega)}</span></div>` : ''}
          ${acciones}
        </div>
      </div>
    </div>`;
}

window.objCrear = async (ev) => {
    ev.preventDefault();
    const err = document.getElementById('no-error');
    const ok  = document.getElementById('no-success');
    err.classList.add('d-none'); ok.classList.add('d-none');

    const fd = new FormData();
    const habRaw = document.getElementById('no-habitacion').value;
    if (habRaw) fd.append('habitacionId', habRaw);
    fd.append('descripcion', document.getElementById('no-descripcion').value);
    fd.append('encontradoEn', document.getElementById('no-fecha').value + ':00');
    const file = document.getElementById('no-file').files[0];
    if (file) fd.append('file', file);

    try {
        const r = await fetch('/api/limpieza/objetos', { method: 'POST', body: fd });
        if (!r.ok) { err.textContent = await r.text() || 'Error.'; err.classList.remove('d-none'); return; }
        ok.textContent = 'Objeto registrado correctamente.';
        ok.classList.remove('d-none');
        document.getElementById('no-descripcion').value = '';
        document.getElementById('no-file').value = '';
        await objRecargar();
        setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('newObjModal'))?.hide(), 700);
    } catch (e) { err.textContent = 'Error: ' + e.message; err.classList.remove('d-none'); }
};

window.objAbrirEntregar = (id) => {
    document.getElementById('ent-id').value = id;
    document.getElementById('ent-notas').value = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('entregarModal')).show();
};

window.objEntregar = async () => {
    const id = document.getElementById('ent-id').value;
    const notas = document.getElementById('ent-notas').value;
    try {
        const r = await fetch(`/api/limpieza/objetos/${id}/estado`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'ENTREGADO', notasEntrega: notas })
        });
        if (!r.ok) { alert(await r.text() || 'Error.'); return; }
        bootstrap.Modal.getInstance(document.getElementById('entregarModal'))?.hide();
        objRecargar();
    } catch (e) { alert('Error: ' + e.message); }
};

window.objDescartar = async (id) => {
    if (!confirm('¿Marcar este objeto como descartado?')) return;
    try {
        const r = await fetch(`/api/limpieza/objetos/${id}/estado`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'DESCARTADO' })
        });
        if (!r.ok) { alert(await r.text() || 'Error.'); return; }
        objRecargar();
    } catch (e) { alert('Error: ' + e.message); }
};

function esc(s) { return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function formatFechaHora(f) {
    if (!f) return '';
    try { return new Date(f).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return f; }
}
