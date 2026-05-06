// ── OBJETOS PERDIDOS · VISTA CLIENTE ──────────────────────────────────────────
(function () {

    var _modal = null;

    function escHtml(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function fmtFecha(s){ if(!s) return '—'; var d=new Date(s); if(isNaN(d)) return s; return d.getDate()+' '+['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]+' '+d.getFullYear()+' · '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }

    window.oclTab = function (tab) {
        document.querySelectorAll('.obj-c-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab === tab); });
        document.getElementById('ocl-tab-catalogo').style.display = tab === 'catalogo' ? '' : 'none';
        document.getElementById('ocl-tab-mias').style.display     = tab === 'mias'     ? '' : 'none';
        if (tab === 'mias') cargarMisReclamaciones();
        else cargarCatalogo();
    };

    async function cargarCatalogo() {
        var grid = document.getElementById('ocl-grid');
        grid.innerHTML = '<div class="obj-c-empty"><div>Cargando…</div></div>';
        try {
            var r = await fetch('/api/objetos-perdidos');
            if (!r.ok) throw new Error();
            var items = await r.json();
            if (!items.length) {
                grid.innerHTML = '<div class="obj-c-empty" style="grid-column:1/-1;">'
                    + '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
                    + '<div>No hay objetos perdidos disponibles en este momento.</div>'
                    + '</div>';
                return;
            }
            grid.innerHTML = items.map(renderCard).join('');
        } catch (_) {
            grid.innerHTML = '<div class="obj-c-empty" style="grid-column:1/-1;color:#e74c3c;">No se pudieron cargar los objetos.</div>';
        }
    }

    function renderCard(o) {
        var imgStyle = o.imagenUrl
            ? 'background-image:url(\'' + escHtml(o.imagenUrl) + '\');'
            : '';
        var imgInner = o.imagenUrl ? '' :
            '<div class="obj-c-img obj-c-img-empty" style="position:absolute;inset:0;">'
            + '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
            + '</div>';
        var hab = o.habitacionNumero ? 'Hab. ' + escHtml(o.habitacionNumero) : 'Zona común';
        var pendientesBadge = o.reclamacionesPendientes > 0
            ? '<span class="obj-c-badge reclamada">' + o.reclamacionesPendientes + ' reclamaci' + (o.reclamacionesPendientes === 1 ? 'ón' : 'ones') + '</span>'
            : '';

        var btnHtml;
        if (o.yaReclamadoPorMi) {
            btnHtml = '<button class="obj-c-claim-btn" disabled>✓ Ya lo has reclamado</button>';
        } else {
            btnHtml = '<button class="obj-c-claim-btn" onclick="oclAbrirReclamar(' + o.id + ', ' + JSON.stringify(o.descripcion || '').replace(/"/g, '&quot;') + ')">Reclamar este objeto</button>';
        }

        return '<div class="obj-c-card">'
            + '<div class="obj-c-img" style="' + imgStyle + 'position:relative;">' + imgInner + pendientesBadge + '</div>'
            + '<div class="obj-c-body">'
            +   '<div class="obj-c-desc">' + escHtml(o.descripcion || '—') + '</div>'
            +   '<div class="obj-c-meta">'
            +     '<div class="obj-c-meta-row">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
            +       '<span>' + hab + '</span>'
            +     '</div>'
            +     '<div class="obj-c-meta-row">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
            +       '<span>Encontrado: ' + fmtFecha(o.encontradoEn) + '</span>'
            +     '</div>'
            +   '</div>'
            +   btnHtml
            + '</div>'
            + '</div>';
    }

    window.oclAbrirReclamar = function (id, descripcion) {
        document.getElementById('reclamar-objeto-id').value = id;
        document.getElementById('reclamar-objeto-desc').textContent = descripcion || 'Objeto seleccionado';
        document.getElementById('reclamar-mensaje').value = '';
        document.getElementById('reclamar-telefono').value = '';
        document.getElementById('reclamar-error').classList.add('d-none');
        document.getElementById('reclamar-success').classList.add('d-none');
        if (!_modal) _modal = new bootstrap.Modal(document.getElementById('reclamarModal'));
        _modal.show();
    };

    window.oclEnviarReclamacion = async function () {
        var id = document.getElementById('reclamar-objeto-id').value;
        var msg = document.getElementById('reclamar-mensaje').value.trim();
        var tel = document.getElementById('reclamar-telefono').value.trim();
        var errEl = document.getElementById('reclamar-error');
        var okEl  = document.getElementById('reclamar-success');
        errEl.classList.add('d-none');
        okEl.classList.add('d-none');

        if (!msg) {
            errEl.textContent = 'Por favor, indica por qué crees que el objeto es tuyo.';
            errEl.classList.remove('d-none');
            return;
        }
        try {
            var r = await fetch('/api/objetos-perdidos/' + id + '/reclamar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: msg, telefono: tel || null })
            });
            if (!r.ok) {
                var txt = await r.text();
                errEl.textContent = txt || 'No se pudo enviar la reclamación.';
                errEl.classList.remove('d-none');
                return;
            }
            okEl.textContent = 'Reclamación enviada. El equipo revisará tu solicitud y te contactará si procede.';
            okEl.classList.remove('d-none');
            setTimeout(function(){ if (_modal) _modal.hide(); cargarCatalogo(); }, 1400);
        } catch (_) {
            errEl.textContent = 'Error de conexión.';
            errEl.classList.remove('d-none');
        }
    };

    async function cargarMisReclamaciones() {
        var box = document.getElementById('ocl-mias');
        box.innerHTML = '<div class="obj-c-empty"><div>Cargando…</div></div>';
        try {
            var r = await fetch('/api/objetos-perdidos/mis-reclamaciones');
            if (!r.ok) throw new Error();
            var items = await r.json();
            if (!items.length) {
                box.innerHTML = '<div class="obj-c-empty">'
                    + '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>'
                    + '<div>Aún no has reclamado ningún objeto.</div>'
                    + '</div>';
                return;
            }
            box.innerHTML = items.map(function (r) {
                var imgStyle = r.objetoImagen ? 'background-image:url(\'' + escHtml(r.objetoImagen) + '\');' : '';
                var notas = r.notasStaff
                    ? '<div class="rec-card-notas">Nota del equipo: ' + escHtml(r.notasStaff) + '</div>'
                    : '';
                var resuelto = r.resueltoEn ? ' · resuelto: ' + fmtFecha(r.resueltoEn) : '';
                return '<div class="rec-card">'
                    + '<div class="rec-card-img" style="' + imgStyle + '"></div>'
                    + '<div class="rec-card-info">'
                    +   '<div class="rec-card-desc">' + escHtml(r.objetoDescripcion || '—') + '</div>'
                    +   '<div class="rec-card-msg">"' + escHtml(r.mensaje) + '"</div>'
                    +   '<div class="rec-card-meta">Enviada: ' + fmtFecha(r.creadoEn) + resuelto + '</div>'
                    +   notas
                    + '</div>'
                    + '<span class="rec-pill rec-pill--' + r.estado + '">' + r.estado + '</span>'
                    + '</div>';
            }).join('');
        } catch (_) {
            box.innerHTML = '<div class="obj-c-empty" style="color:#e74c3c;">No se pudieron cargar tus reclamaciones.</div>';
        }
    }

    document.addEventListener('DOMContentLoaded', function () { cargarCatalogo(); });
})();
