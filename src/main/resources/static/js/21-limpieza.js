// ── PANEL DE LIMPIEZA ────────────────────────────────────────────────────────

let _limpTab    = 'panel';   // 'panel' | 'mias' | 'todas'
let _limpFiltro = '';
let _limpCacheHabs = [];
let _limpFecha = { anyo: '', mes: '', sem: '', dia: '' };  // todos = sin filtro

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('limp-root')) return;

    document.querySelectorAll('#limp-filtros .btn-filter').forEach(b => {
        b.addEventListener('click', () => {
            document.querySelectorAll('#limp-filtros .btn-filter').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            _limpFiltro = b.dataset.estado || '';
            limpRender();
        });
    });

    limpInicializarSelectsFecha();

    // Si la URL trae #mias / #todas / #panel, abrir esa tab al cargar
    var hash = (window.location.hash || '').replace('#','').trim();
    if (['panel','mias','todas'].indexOf(hash) !== -1) {
        limpSetTab(hash);
    } else {
        limpCargar();
    }
    setInterval(limpCargar, 30000);

    document.addEventListener('shown.bs.modal', (ev) => {
        if (ev.target?.id === 'tareaManualModal' || ev.target?.id === 'incidenciaModal') {
            limpPoblarSelectsHabitacion();
        }
    });
});

function limpSetTab(tab) {
    _limpTab = tab;
    document.querySelectorAll('.limp-tabs .nav-link').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
    // En "Mis tareas" ocultamos los filtros de estado y la barra de fecha:
    // ahí solo aplica la lista de tareas asignadas a mí.
    var filtros = document.getElementById('limp-filtros');
    var fechaBar = document.getElementById('limp-fecha');
    if (filtros)  filtros.style.display  = tab === 'mias' ? 'none' : '';
    if (fechaBar) fechaBar.style.display = tab === 'mias' ? 'none' : '';
    limpCargar();
}

async function limpCargar() {
    const root = document.getElementById('limp-root');
    if (!root) return;
    try {
        if (_limpTab === 'mias') {
            const r = await fetch('/api/limpieza/mis-tareas');
            if (!r.ok) throw new Error('No autenticado');
            limpRenderTareas(await r.json(), 'No tienes tareas asignadas en curso.');
        } else if (_limpTab === 'todas') {
            const r = await fetch('/api/limpieza/tareas');
            if (!r.ok) throw new Error('Error');
            limpRenderTareas(await r.json(), 'Sin tareas abiertas.');
        } else {
            const r = await fetch('/api/limpieza/panel');
            if (!r.ok) throw new Error('Error');
            _limpCacheHabs = await r.json();
            limpRender();
        }
    } catch (e) {
        root.innerHTML = `<div class="col-12 text-center text-danger py-5">${e.message || 'Error'}</div>`;
    }
}

function limpRender() {
    const root = document.getElementById('limp-root');
    if (!root) return;
    const lista = _limpCacheHabs.filter(h => {
        if (_limpFiltro && h.estadoLimpieza !== _limpFiltro) return false;
        if (!limpFechaMatch(h.proximaSalida)) return false;
        return true;
    });
    if (lista.length === 0) {
        root.innerHTML = '<div class="col-12 text-center text-muted py-5">No hay habitaciones con ese filtro.</div>';
        return;
    }
    root.innerHTML = lista.map(habitacionCard).join('');
}

// ── Filtro de fecha (cascada: año / mes / semana / día) ────────────────────

function limpInicializarSelectsFecha() {
    const anyoSel = document.getElementById('limp-anyo');
    const mesSel  = document.getElementById('limp-mes');
    const semSel  = document.getElementById('limp-sem');
    const diaSel  = document.getElementById('limp-dia');
    if (!anyoSel) return;

    const anyoActual = new Date().getFullYear();
    let opts = '<option value="">AÑO (todos)</option>';
    for (let y = anyoActual - 1; y <= anyoActual + 2; y++) opts += `<option value="${y}">${y}</option>`;
    anyoSel.innerHTML = opts;

    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    let mopts = '<option value="">MES (todos)</option>';
    meses.forEach((m, i) => mopts += `<option value="${i+1}">${m}</option>`);
    mesSel.innerHTML = mopts;

    semSel.innerHTML = '<option value="">SEMANA (todas)</option>';
    diaSel.innerHTML = '<option value="">DÍA (todos)</option>';
}

window.limpFechaCambio = () => {
    const anyoSel = document.getElementById('limp-anyo');
    const mesSel  = document.getElementById('limp-mes');
    const semSel  = document.getElementById('limp-sem');
    const diaSel  = document.getElementById('limp-dia');

    const nuevoAnyo = anyoSel.value;
    const nuevoMes  = mesSel.value;
    const nuevoSem  = semSel.value;

    // Detectamos qué cambió respecto al estado anterior
    const cambioPeriodo = nuevoAnyo !== _limpFecha.anyo || nuevoMes !== _limpFecha.mes;
    const cambioSemana  = nuevoSem !== _limpFecha.sem;

    _limpFecha.anyo = nuevoAnyo;
    _limpFecha.mes  = nuevoMes;

    if (cambioPeriodo) {
        if (_limpFecha.anyo && _limpFecha.mes) {
            const a = parseInt(_limpFecha.anyo, 10), m = parseInt(_limpFecha.mes, 10);
            const dias = new Date(a, m, 0).getDate();
            const mesesCort = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
            const diasCort  = ['dom','lun','mar','mié','jue','vie','sáb'];
            const mc = mesesCort[m - 1];

            // Semanas naturales (lunes-domingo) del mes seleccionado
            // diaSemanaPrimero: 0=lun..6=dom para el día 1 del mes
            const diaSemanaPrimero = (new Date(a, m - 1, 1).getDay() + 6) % 7;
            const numSem = Math.ceil((diaSemanaPrimero + dias) / 7);
            let semOpts = '<option value="">SEMANA (todas)</option>';
            for (let s = 1; s <= numSem; s++) {
                const ini = Math.max(1, (s - 1) * 7 + 1 - diaSemanaPrimero);
                const fin = Math.min(dias,  s      * 7      - diaSemanaPrimero);
                const label = (ini === fin) ? `${ini} ${mc}` : `${ini} – ${fin} ${mc}`;
                semOpts += `<option value="${s}">${label}</option>`;
            }
            semSel.innerHTML = semOpts;
            semSel.disabled = false;

            // Días: número + día de la semana + mes corto
            let diaOpts = '<option value="">DÍA (todos)</option>';
            for (let d = 1; d <= dias; d++) {
                const dow = new Date(a, m - 1, d).getDay();
                diaOpts += `<option value="${d}">${diasCort[dow]} ${d} ${mc}</option>`;
            }
            diaSel.innerHTML = diaOpts;
            diaSel.disabled = false;
        } else {
            semSel.innerHTML = '<option value="">SEMANA (todas)</option>';
            diaSel.innerHTML = '<option value="">DÍA (todos)</option>';
            semSel.disabled = true;
            diaSel.disabled = true;
        }
        // al cambiar el período se limpian sem/día
        _limpFecha.sem = '';
        _limpFecha.dia = '';
    } else if (cambioSemana && _limpFecha.anyo && _limpFecha.mes) {
        // Sólo cambió la semana: repoblamos días con los de esa semana (o todos si "TODAS")
        _limpFecha.sem = nuevoSem;
        const a = parseInt(_limpFecha.anyo, 10), m = parseInt(_limpFecha.mes, 10);
        const dias = new Date(a, m, 0).getDate();
        const diasCort  = ['dom','lun','mar','mié','jue','vie','sáb'];
        const mesesCort = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
        const mc = mesesCort[m - 1];
        const diaSemanaPrimero = (new Date(a, m - 1, 1).getDay() + 6) % 7;

        let from = 1, to = dias;
        if (nuevoSem) {
            const s = parseInt(nuevoSem, 10);
            from = Math.max(1, (s - 1) * 7 + 1 - diaSemanaPrimero);
            to   = Math.min(dias,  s      * 7      - diaSemanaPrimero);
        }

        let diaOpts = '<option value="">DÍA (todos)</option>';
        for (let d = from; d <= to; d++) {
            const dow = new Date(a, m - 1, d).getDay();
            diaOpts += `<option value="${d}">${diasCort[dow]} ${d} ${mc}</option>`;
        }
        diaSel.innerHTML = diaOpts;
        _limpFecha.dia = '';   // al cambiar semana se reinicia el día
    } else {
        // cambió día: leer
        _limpFecha.dia = diaSel.value;
    }
    limpRender();
};

window.limpFechaHoy = () => {
    const hoy = new Date();
    document.getElementById('limp-anyo').value = hoy.getFullYear();
    document.getElementById('limp-mes').value  = hoy.getMonth() + 1;
    limpFechaCambio();
    document.getElementById('limp-dia').value  = hoy.getDate();
    _limpFecha.dia = String(hoy.getDate());
    limpRender();
};

window.limpFechaReset = () => {
    _limpFecha = { anyo: '', mes: '', sem: '', dia: '' };
    limpInicializarSelectsFecha();
    document.getElementById('limp-sem').disabled = true;
    document.getElementById('limp-dia').disabled = true;
    limpRender();
};

function limpFechaMatch(ymd) {
    if (!_limpFecha.anyo && !_limpFecha.mes && !_limpFecha.sem && !_limpFecha.dia) return true;
    if (!ymd) return false;
    const d = new Date(ymd);
    if (_limpFecha.anyo && d.getFullYear() !== parseInt(_limpFecha.anyo, 10)) return false;
    if (_limpFecha.mes  && (d.getMonth() + 1) !== parseInt(_limpFecha.mes, 10)) return false;
    if (_limpFecha.dia  && d.getDate() !== parseInt(_limpFecha.dia, 10)) return false;
    if (_limpFecha.sem) {
        // Semana natural lunes-domingo dentro del mes (alineada al calendario real)
        const a = d.getFullYear(), m = d.getMonth();
        const diaSemanaPrimero = (new Date(a, m, 1).getDay() + 6) % 7;
        const semana = Math.floor((d.getDate() - 1 + diaSemanaPrimero) / 7) + 1;
        if (semana !== parseInt(_limpFecha.sem, 10)) return false;
    }
    return true;
}

function limpRenderTareas(tareas, vacioMsg) {
    const root = document.getElementById('limp-root');
    if (!root) return;
    if (!tareas || tareas.length === 0) {
        root.innerHTML = `<div class="col-12 text-center text-muted py-5">${vacioMsg}</div>`;
        return;
    }
    root.innerHTML = tareas.map(tareaCard).join('');
}

// ── Render cards ────────────────────────────────────────────────────────────

function habitacionCard(h) {
    const tieneTarea = !!h.tareaId;
    return `
    <div class="col-md-6 col-lg-4">
      <div class="limp-card ${cssEstado(h.estadoLimpieza)}">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">Hab. ${escHtml(h.habitacionNumero)}</h5>
            <small class="text-muted">${escHtml(h.habitacionTipo || '')}</small>
          </div>
          <span class="badge ${badgeEstado(h.estadoLimpieza)}">${labelEstado(h.estadoLimpieza)}</span>
        </div>
        ${h.proximaSalida ? `<div class="small text-muted mt-2">Próxima salida: <strong>${formatFecha(h.proximaSalida)}</strong></div>` : ''}
        ${tieneTarea ? `
          <hr class="my-2 border-secondary">
          <div class="small mb-2">
            <span class="badge bg-secondary me-1">${escHtml(h.tareaTipo)}</span>
            <span class="badge ${badgePrioridad(h.tareaPrioridad)}">${escHtml(h.tareaPrioridad)}</span>
            ${h.tareaAsignadoEmail ? `<span class="ms-2 text-muted">→ ${escHtml(h.tareaAsignadoEmail)}</span>` : ''}
          </div>
          ${h.tareaNotas ? `<div class="small text-muted mb-2">${escHtml(h.tareaNotas)}</div>` : ''}
          <div class="d-flex gap-2">
            ${h.tareaEstado !== 'EN_PROGRESO' ? `<button class="btn btn-sm btn-outline-light flex-grow-1" onclick="limpIniciar(${h.tareaId})">Iniciar</button>` : ''}
            <button class="btn btn-sm btn-gold flex-grow-1" onclick="limpAbrirCompletar(${h.tareaId})">Completar</button>
          </div>
        ` : '<div class="small text-muted mt-2">Sin tareas pendientes.</div>'}
      </div>
    </div>`;
}

function tareaCard(t) {
    const enProgreso = t.estado === 'EN_PROGRESO';
    return `
    <div class="col-md-6 col-lg-4">
      <div class="limp-card ${cssEstado(t.habitacionEstadoLimpieza || 'SUCIA')}">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">Hab. ${escHtml(t.habitacionNumero)}</h5>
            <small class="text-muted">${escHtml(t.habitacionTipo || '')}</small>
          </div>
          <span class="badge ${badgePrioridad(t.prioridad)}">${escHtml(t.prioridad)}</span>
        </div>
        <div class="small mt-2">
          <span class="badge bg-secondary me-1">${escHtml(t.tipo)}</span>
          <span class="badge bg-info text-dark">${escHtml(t.estado)}</span>
          ${t.asignadoEmail ? `<span class="ms-2 text-muted">→ ${escHtml(t.asignadoEmail)}</span>` : ''}
        </div>
        ${t.notas ? `<div class="small text-muted mt-2">${escHtml(t.notas)}</div>` : ''}
        <div class="d-flex gap-2 mt-2">
          ${enProgreso ? '' : `<button class="btn btn-sm btn-outline-light flex-grow-1" onclick="limpIniciar(${t.id})">Iniciar</button>`}
          <button class="btn btn-sm btn-gold flex-grow-1" onclick="limpAbrirCompletar(${t.id})">Completar</button>
        </div>
      </div>
    </div>`;
}

// ── Acciones ───────────────────────────────────────────────────────────────

async function limpIniciar(id) {
    try {
        const r = await fetch(`/api/limpieza/tarea/${id}/iniciar`, { method: 'POST' });
        if (!r.ok) { alert(await r.text() || 'No se pudo iniciar la tarea.'); return; }
        await limpCargar();
    } catch (e) { alert('Error: ' + e.message); }
}

function limpAbrirCompletar(id) {
    document.getElementById('completar-tarea-id').value = id;
    document.getElementById('completar-notas').value = '';
    document.getElementById('completar-error').classList.add('d-none');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('completarModal')).show();
}

async function limpConfirmarCompletar() {
    const id    = document.getElementById('completar-tarea-id').value;
    const notas = document.getElementById('completar-notas').value;
    const err   = document.getElementById('completar-error');
    err.classList.add('d-none');
    try {
        const r = await fetch(`/api/limpieza/tarea/${id}/completar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notasFinales: notas })
        });
        if (!r.ok) { err.textContent = await r.text() || 'Error completando.'; err.classList.remove('d-none'); return; }
        bootstrap.Modal.getInstance(document.getElementById('completarModal'))?.hide();
        await limpCargar();
    } catch (e) { err.textContent = 'Error de red: ' + e.message; err.classList.remove('d-none'); }
}

async function limpGenerarSalidas() {
    if (!confirm('Crear tareas de SALIDA para las reservas que terminan hoy?')) return;
    try {
        const r = await fetch('/api/limpieza/generar-salidas-hoy', { method: 'POST' });
        if (!r.ok) { alert(await r.text() || 'Error.'); return; }
        const data = await r.json();
        alert(`Se han creado ${data.creadas} tarea(s).`);
        await limpCargar();
    } catch (e) { alert('Error: ' + e.message); }
}

async function limpCrearManual(ev) {
    ev.preventDefault();
    const err = document.getElementById('manual-error');
    err.classList.add('d-none');
    const habitacionId = parseInt(document.getElementById('manual-habitacion').value, 10);
    const tipo         = document.getElementById('manual-tipo').value;
    const prioridad    = document.getElementById('manual-prioridad').value;
    const notas        = document.getElementById('manual-notas').value;
    try {
        const r = await fetch('/api/limpieza/tarea', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habitacionId, tipo, prioridad, notas })
        });
        if (!r.ok) { err.textContent = await r.text() || 'No se pudo crear.'; err.classList.remove('d-none'); return; }
        document.getElementById('manual-notas').value = '';
        await limpCargar();
        bootstrap.Modal.getInstance(document.getElementById('tareaManualModal'))?.hide();
    } catch (e) { err.textContent = 'Error: ' + e.message; err.classList.remove('d-none'); }
}

async function limpCrearIncidencia(ev) {
    ev.preventDefault();
    const err = document.getElementById('inc-error');
    const ok  = document.getElementById('inc-success');
    err.classList.add('d-none'); ok.classList.add('d-none');
    const habRaw = document.getElementById('inc-habitacion').value;
    const habitacionId = habRaw ? parseInt(habRaw, 10) : null;
    const body = {
        habitacionId,
        tipo: document.getElementById('inc-tipo').value,
        prioridad: document.getElementById('inc-prioridad').value,
        descripcion: document.getElementById('inc-descripcion').value
    };
    try {
        const r = await fetch('/api/limpieza/incidencias', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!r.ok) { err.textContent = await r.text() || 'No se pudo reportar.'; err.classList.remove('d-none'); return; }
        ok.textContent = 'Incidencia reportada correctamente.';
        ok.classList.remove('d-none');
        document.getElementById('inc-descripcion').value = '';
        setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('incidenciaModal'))?.hide(), 800);
    } catch (e) { err.textContent = 'Error: ' + e.message; err.classList.remove('d-none'); }
}

function limpPoblarSelectsHabitacion() {
    const opts = (lista) => lista.sort((a,b) => String(a.habitacionNumero).localeCompare(String(b.habitacionNumero)))
        .map(h => `<option value="${h.habitacionId}">Hab. ${escHtml(h.habitacionNumero)} (${escHtml(h.habitacionTipo || '')})</option>`).join('');

    const fill = (lista) => {
        const m = document.getElementById('manual-habitacion');
        if (m && m.options.length === 0) m.innerHTML = opts(lista);
        const i = document.getElementById('inc-habitacion');
        if (i && i.options.length <= 1) i.innerHTML = '<option value="">— Sin habitación —</option>' + opts(lista);
    };

    if (_limpCacheHabs.length > 0) fill(_limpCacheHabs);
    else fetch('/api/limpieza/panel').then(r => r.json()).then(fill).catch(() => {});
}

// ── Helpers ────────────────────────────────────────────────────────────────

function cssEstado(e)       { return ENUMS.estadoLimpiezaCss(e); }
function badgeEstado(e)     { return ENUMS.estadoLimpiezaBadge(e); }
function labelEstado(e)     { return ENUMS.estadoLimpiezaLabel(e); }
function badgePrioridad(p)  { return ENUMS.prioridadBadge(p); }
function formatFecha(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('es-ES'); } catch { return iso; }
}
function escHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
