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
        <div class="d-flex gap-2 mt-2 flex-wrap">
            <button class="btn btn-sm btn-gold flex-grow-1" onclick="objAbrirEntregar(${o.id})">Entregar</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="objDescartar(${o.id})">Descartar</button>
            <button class="btn btn-sm" style="background:rgba(88,196,220,0.12);border:1px solid rgba(88,196,220,0.4);color:#58c4dc;flex-basis:100%;" onclick="objVerReclamaciones(${o.id})">📨 Ver reclamaciones</button>
        </div>` : `
        <div class="d-flex gap-2 mt-2">
            <button class="btn btn-sm" style="background:rgba(88,196,220,0.12);border:1px solid rgba(88,196,220,0.4);color:#58c4dc;flex-grow:1;" onclick="objVerReclamaciones(${o.id})">📨 Ver reclamaciones</button>
        </div>`;
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

// ── RECLAMACIONES ──────────────────────────────────────────────────────────
window.objVerReclamaciones = async function (objetoId) {
    let modal = document.getElementById('reclamModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reclamModal';
        modal.className = 'modal fade modal-dark';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header" style="border-bottom:1px solid rgba(201,168,76,0.15);">
                        <div>
                            <h5 class="modal-title" style="color:#c9a84c;font-family:'Playfair Display',serif;letter-spacing:0.06em;">Reclamaciones del objeto</h5>
                            <small class="text-muted" id="reclam-objeto-info"></small>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="reclam-body" style="min-height:200px;">
                        <div class="text-center text-muted py-4">Cargando…</div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }
    const body = document.getElementById('reclam-body');
    const info = document.getElementById('reclam-objeto-info');
    body.innerHTML = '<div class="text-center text-muted py-4">Cargando…</div>';
    info.textContent = 'Objeto #' + objetoId;
    bootstrap.Modal.getOrCreateInstance(modal).show();

    try {
        const r = await fetch('/api/limpieza/objetos/' + objetoId + '/reclamaciones');
        if (!r.ok) throw new Error();
        const items = await r.json();
        if (!items.length) {
            body.innerHTML = '<div class="text-center text-muted py-5" style="font-style:italic;">Sin reclamaciones todavía.</div>';
            return;
        }
        body.innerHTML = items.map(rec => renderReclamCard(rec, objetoId)).join('');
    } catch (e) {
        body.innerHTML = '<div class="alert alert-danger">No se pudieron cargar las reclamaciones.</div>';
    }
};

function renderReclamCard(r, objetoId) {
    const pillStyle = r.estado === 'ACEPTADA'  ? 'background:rgba(46,204,113,0.15);color:#2ecc71;border-color:rgba(46,204,113,0.4);'
                    : r.estado === 'RECHAZADA' ? 'background:rgba(231,76,60,0.12);color:#e74c3c;border-color:rgba(231,76,60,0.4);'
                    : 'background:rgba(201,168,76,0.15);color:#c9a84c;border-color:rgba(201,168,76,0.4);';
    const acciones = r.estado === 'PENDIENTE' ? `
        <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-success flex-grow-1" onclick="objDecidirReclam(${r.id}, 'ACEPTADA', ${objetoId})">✓ Aceptar y entregar</button>
            <button class="btn btn-sm btn-outline-danger flex-grow-1" onclick="objDecidirReclam(${r.id}, 'RECHAZADA', ${objetoId})">✕ Rechazar</button>
        </div>` : '';
    const notas = r.notasStaff
        ? `<div class="small mt-2" style="background:rgba(255,255,255,0.04);border-left:2px solid rgba(201,168,76,0.4);padding:6px 10px;border-radius:0 6px 6px 0;color:rgba(255,255,255,0.65);"><strong>Nota:</strong> ${esc(r.notasStaff)}</div>`
        : '';
    const tel = r.telefono ? `<div class="small text-muted">📞 ${esc(r.telefono)}</div>` : '';
    return `
    <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 18px;margin-bottom:12px;">
        <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
            <div>
                <div style="color:#e8e0c8;font-weight:600;">${esc(r.usuarioNombre || r.usuarioEmail)}</div>
                <div class="small text-muted">${esc(r.usuarioEmail)}</div>
                ${tel}
            </div>
            <span style="font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;padding:5px 12px;border-radius:20px;font-weight:700;border:1px solid;${pillStyle}">${r.estado}</span>
        </div>
        <div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:10px 12px;margin-top:8px;color:rgba(255,255,255,0.78);font-size:0.86rem;font-style:italic;">"${esc(r.mensaje)}"</div>
        <div class="small text-muted mt-2">Enviada: ${formatFechaHora(r.creadoEn)}${r.resueltoEn ? ' · resuelta: ' + formatFechaHora(r.resueltoEn) : ''}</div>
        ${notas}
        ${acciones}
    </div>`;
}

window.objDecidirReclam = async function (recId, estado, objetoId) {
    const verbo = estado === 'ACEPTADA' ? 'aceptar la reclamación y marcar el objeto como entregado al cliente' : 'rechazar la reclamación';
    const notas = prompt('Notas (opcional) al ' + verbo + ':', '') || '';
    if (notas === null) return;
    try {
        const r = await fetch('/api/limpieza/reclamaciones/' + recId + '/decidir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: estado, notasStaff: notas })
        });
        if (!r.ok) { alert(await r.text() || 'Error.'); return; }
        await objVerReclamaciones(objetoId);
        objRecargar();
    } catch (e) { alert('Error: ' + e.message); }
};

function esc(s) { return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function formatFechaHora(f) {
    if (!f) return '';
    try { return new Date(f).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return f; }
}
