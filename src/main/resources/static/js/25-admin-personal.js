// ── ADMIN: PERSONAL (horarios, perfiles/jornadas, planes/cuadrantes, asignación)

const PERS_DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

let _persSubtab = 'horarios';

window.loadAdminPersonal = () => {
    if (window._asbPersonalSubtab) {
        _persSubtab = window._asbPersonalSubtab;
        window._asbPersonalSubtab = null;
    }
    const body = document.getElementById('admin-tab-body');
    if (!body) return;
    body.innerHTML = `
        <div class="pers-shell">
            <div id="pers-body" class="pers-body"><div class="text-muted">Cargando…</div></div>
        </div>
    `;
    persSet(_persSubtab);
};

window.persSet = (tab) => {
    _persSubtab = tab;
    document.querySelectorAll('.pers-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'horarios')   persRenderHorarios();
    if (tab === 'perfiles')   persRenderPerfiles();
    if (tab === 'planes')     persRenderPlanes();
    if (tab === 'asignacion') persRenderAsignacion();
};

// ═════ HORARIOS ════════════════════════════════════════════════════════════

async function persRenderHorarios() {
    const body = document.getElementById('pers-body');
    body.innerHTML = '<div class="text-muted">Cargando…</div>';
    try {
        const r = await fetch('/api/horarios');
        const lista = await r.json();
        body.innerHTML = `
            <div class="pers-toolbar">
                <h4 class="pers-h4">Horarios</h4>
                <button class="pers-btn-primary" onclick="persEditarHorario()">+ Nuevo horario</button>
            </div>
            <div class="pers-cards">
                ${lista.length === 0 ? '<div class="text-muted py-4">Sin horarios. Crea el primero.</div>' :
                  lista.map(h => `
                    <div class="pers-card">
                        <div class="pers-card-head">
                            <div>
                                <div class="pers-card-title">${esc(h.nombre)}</div>
                                <div class="pers-card-sub">${esc(h.descripcion || '')}</div>
                            </div>
                            <div class="pers-card-actions">
                                <button class="pers-btn-ghost" onclick='persEditarHorario(${JSON.stringify(h)})'>Editar</button>
                                <button class="pers-btn-icon-danger" title="Borrar" onclick="persBorrarHorario(${h.id})">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </div>
                        ${persRenderHorarioGrid(h.tramos)}
                    </div>`).join('')}
            </div>
        `;
    } catch (e) { body.innerHTML = '<div class="text-danger">Error.</div>'; }
}

function persRenderHorarioGrid(tramos) {
    const labels = ['L','M','X','J','V','S','D'];
    const porDia = {};
    (tramos || []).forEach(t => {
        if (!porDia[t.dia_semana]) porDia[t.dia_semana] = [];
        porDia[t.dia_semana].push(`${t.hora_inicio.slice(0,5)}<br>${t.hora_fin.slice(0,5)}`);
    });
    return `
    <div class="pers-h-scroll"><div class="pers-h-grid">
        ${labels.map((lab, i) => {
            const dia = i + 1;
            const ts = porDia[dia];
            return `<div class="pers-h-cell ${ts ? 'pers-h-cell--on' : ''}">
                        <span class="pers-h-day">${lab}</span>
                        <span class="pers-h-time">${ts ? ts.join('<br>') : '—'}</span>
                    </div>`;
        }).join('')}
    </div></div>`;
}

window.persEditarHorario = (h) => {
    const editar = !!h;
    persOpenModal(`
        <h3 class="pers-modal-title">${editar ? 'Editar' : 'Nuevo'} horario</h3>
        <label class="pers-label">Nombre</label>
        <input id="ph-nombre" class="pers-input" value="${editar ? esc(h.nombre) : ''}">
        <label class="pers-label">Descripción</label>
        <input id="ph-desc" class="pers-input" value="${editar ? esc(h.descripcion || '') : ''}">
        <div class="pers-label" style="margin-top:14px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span>Tramos por día</span>
            <button type="button" class="pers-quick-btn pers-quick-btn--gold" onclick="persRellenar247()">24/7</button>
            <button type="button" class="pers-quick-btn pers-quick-btn--danger" onclick="persLimpiarTramos()">Limpiar</button>
        </div>
        <div id="ph-tramos" class="pers-tramos-editor"></div>
        <div class="pers-modal-actions">
            <button class="pers-btn-ghost" onclick="persCloseModal()">Cancelar</button>
            <button class="pers-btn-primary" onclick="persGuardarHorario(${editar ? h.id : 'null'})">Guardar</button>
        </div>
    `);
    persPintarEditorTramos(h ? h.tramos : []);
};

function persPintarEditorTramos(tramos) {
    const cont = document.getElementById('ph-tramos');
    cont.innerHTML = PERS_DIAS.map((nom, i) => {
        const dia = i + 1;
        const ts = (tramos || []).filter(t => t.dia_semana === dia);
        return `
        <div class="pers-tramo-row" data-dia="${dia}">
            <span class="pers-tramo-dia">${nom}</span>
            <div class="pers-tramo-list">
                ${ts.map(t => persTramoFila(dia, t.hora_inicio, t.hora_fin)).join('') || ''}
            </div>
            <button class="pers-tramo-add" onclick="persAddTramo(${dia})">+</button>
        </div>`;
    }).join('');
}

function persTramoFila(dia, hi, hf) {
    return `<span class="pers-tramo-input">
        <input type="time" value="${hi || '09:00'}" data-tipo="hi"> →
        <input type="time" value="${hf || '17:00'}" data-tipo="hf">
        <button onclick="this.parentElement.remove()">×</button>
    </span>`;
}

window.persAddTramo = (dia) => {
    const row = document.querySelector(`.pers-tramo-row[data-dia="${dia}"] .pers-tramo-list`);
    row.insertAdjacentHTML('beforeend', persTramoFila(dia, '09:00', '17:00'));
};

window.persRellenar247 = () => {
    const tramos = [];
    for (let d = 1; d <= 7; d++) {
        tramos.push({ dia_semana: d, hora_inicio: '00:00', hora_fin: '23:59' });
    }
    persPintarEditorTramos(tramos);
};

window.persLimpiarTramos = () => {
    persPintarEditorTramos([]);
};

window.persGuardarHorario = async (id) => {
    const body = {
        nombre: document.getElementById('ph-nombre').value,
        descripcion: document.getElementById('ph-desc').value,
        tramos: []
    };
    document.querySelectorAll('.pers-tramo-row').forEach(row => {
        const dia = parseInt(row.dataset.dia, 10);
        row.querySelectorAll('.pers-tramo-input').forEach(span => {
            const ins = span.querySelectorAll('input');
            body.tramos.push({ dia_semana: dia, hora_inicio: ins[0].value, hora_fin: ins[1].value });
        });
    });
    const url = id ? `/api/horarios/${id}` : '/api/horarios';
    const method = id ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { alert(await r.text() || 'Error.'); return; }
    persCloseModal();
    persRenderHorarios();
};

window.persBorrarHorario = async (id) => {
    if (!confirm('¿Borrar horario?')) return;
    const r = await fetch(`/api/horarios/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) { alert(await r.text() || 'Error.'); return; }
    persRenderHorarios();
};

// ═════ PERFILES (tipos de jornada) ════════════════════════════════════════

async function persRenderPerfiles() {
    const body = document.getElementById('pers-body');
    body.innerHTML = '<div class="text-muted">Cargando…</div>';
    try {
        const [rp, rh] = await Promise.all([fetch('/api/perfiles-turno'), fetch('/api/horarios')]);
        const perfiles = await rp.json();
        const horarios = await rh.json();
        window._persHorariosCache = horarios;
        body.innerHTML = `
            <div class="pers-toolbar">
                <h4 class="pers-h4">Tipos de jornada</h4>
                <button class="pers-btn-primary" onclick="persEditarPerfil()">+ Nuevo tipo</button>
            </div>
            <div class="pers-cards">
                ${perfiles.length === 0 ? '<div class="text-muted py-4">Sin perfiles. Crea el primero.</div>' :
                  perfiles.map(p => `
                    <div class="pers-card">
                        <div class="pers-card-head">
                            <div>
                                <div class="pers-card-title">${esc(p.nombre)}</div>
                                <div class="pers-card-sub">${esc(p.descripcion || '')}</div>
                            </div>
                            <div class="pers-card-actions">
                                <button class="pers-btn-ghost" onclick='persEditarPerfil(${JSON.stringify(p)})'>Editar</button>
                                <button class="pers-btn-danger" onclick="persBorrarPerfil(${p.id})">Borrar</button>
                            </div>
                        </div>
                        ${(p.horarios || []).length === 0
                            ? '<div class="pers-tramos"><span class="text-muted">Sin horarios</span></div>'
                            : `<div class="pers-perfil-horarios">
                                ${p.horarios.map(h => persRenderHorarioInline(h, horarios)).join('')}
                               </div>`}
                    </div>`).join('')}
            </div>
        `;
    } catch (e) { body.innerHTML = '<div class="text-danger">Error.</div>'; }
}

function persRenderHorarioInline(href, horariosCompletos) {
    // href = { id, nombre } del perfil; busca el horario completo (con tramos) en cache
    const full = (horariosCompletos || []).find(x => x.id === href.id) || { tramos: [] };
    const tramos = full.tramos || [];
    if (tramos.length === 0) {
        return `<div class="pers-perfil-horario">
                    <div class="pers-perfil-horario-head"><span class="pers-pill-gold">${esc(href.nombre)}</span></div>
                    <div class="pers-tramos"><span class="text-muted">Sin tramos definidos</span></div>
                </div>`;
    }
    // Agrupar tramos por día
    const porDia = {};
    tramos.forEach(t => {
        if (!porDia[t.dia_semana]) porDia[t.dia_semana] = [];
        porDia[t.dia_semana].push(`${t.hora_inicio}–${t.hora_fin}`);
    });
    const filas = PERS_DIAS.map((nom, i) => {
        const dia = i + 1;
        const ts = porDia[dia];
        if (!ts) return '';
        return `<span class="pers-tramo">${nom} ${ts.join(' · ')}</span>`;
    }).filter(Boolean).join('');
    return `<div class="pers-perfil-horario">
                <div class="pers-perfil-horario-head"><span class="pers-pill-gold">${esc(href.nombre)}</span></div>
                <div class="pers-tramos">${filas}</div>
            </div>`;
}

window.persEditarPerfil = (p) => {
    const horarios = window._persHorariosCache || [];
    const ids = p ? (p.horarios || []).map(h => h.id) : [];
    const colorActual = p ? (p.color || '#c9a96e') : '#c9a96e';
    persOpenModal(`
        <h3 class="pers-modal-title">${p ? 'Editar' : 'Nuevo'} tipo de jornada</h3>
        <label class="pers-label">Nombre</label>
        <input id="pp-nombre" class="pers-input" value="${p ? esc(p.nombre) : ''}">
        <label class="pers-label">Descripción</label>
        <input id="pp-desc" class="pers-input" value="${p ? esc(p.descripcion || '') : ''}">
        <label class="pers-label" style="margin-top:14px;">Color de identificación</label>
        <div class="pers-color-row">
            <input type="color" id="pp-color" class="pers-color-input" value="${colorActual}"
                   oninput="document.getElementById('pp-color-hex').textContent=this.value">
            <span id="pp-color-hex" class="pers-pill-gold" style="font-family:monospace">${colorActual}</span>
        </div>
        <div class="pers-label" style="margin-top:14px;">Horarios incluidos</div>
        <div class="pers-checks">
            ${horarios.map(h => `
                <label class="pers-check">
                    <input type="checkbox" value="${h.id}" ${ids.includes(h.id) ? 'checked' : ''}>
                    <span>${esc(h.nombre)}</span>
                </label>`).join('')}
        </div>
        <div class="pers-modal-actions">
            <button class="pers-btn-ghost" onclick="persCloseModal()">Cancelar</button>
            <button class="pers-btn-primary" onclick="persGuardarPerfil(${p ? p.id : 'null'})">Guardar</button>
        </div>
    `);
};

window.persGuardarPerfil = async (id) => {
    const horarios = Array.from(document.querySelectorAll('.pers-checks input:checked')).map(c => parseInt(c.value, 10));
    const body = {
        nombre: document.getElementById('pp-nombre').value,
        descripcion: document.getElementById('pp-desc').value,
        color: document.getElementById('pp-color').value,
        horarios
    };
    const url = id ? `/api/perfiles-turno/${id}` : '/api/perfiles-turno';
    const r = await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { alert(await r.text() || 'Error.'); return; }
    persCloseModal();
    persRenderPerfiles();
};

window.persBorrarPerfil = async (id) => {
    if (!confirm('¿Borrar tipo de jornada?')) return;
    const r = await fetch(`/api/perfiles-turno/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) { alert(await r.text() || 'Error.'); return; }
    persRenderPerfiles();
};

// ═════ PLANES (cuadrantes) ════════════════════════════════════════════════

const PERS_PALETTE = ['#c9a84c','#4dabf7','#51cf66','#ff6b6b','#cc5de8','#ffa94d','#f783ac','#3bc9db','#fcc419','#9775fa'];
function persPerfilColor(id) {
    if (id == null) return 'rgba(255,255,255,0.06)';
    const perfiles = window._persPerfilesCache || [];
    const p = perfiles.find(x => x.id === id);
    if (p && p.color) return p.color;
    return PERS_PALETTE[id % PERS_PALETTE.length];
}

let _persPlanState          = {};   // por planId: { vista, anyo, mes }
let _persPlanDayData        = {};   // por planId: { 'YYYY-MM-DD': infoObj }
let _persPlanSelectedPerfil = {};   // por planId: { id, nombre, color } | undefined
let _persPlanActiveDows     = {};   // por planId: Set<number> 1..7 (filtra al pintar mes/año)
let _persPlanScope          = {};   // por planId: 'mes' | 'anyo'

function persGetActiveDows(planId) {
    if (!_persPlanActiveDows[planId]) _persPlanActiveDows[planId] = new Set([1,2,3,4,5,6,7]);
    return _persPlanActiveDows[planId];
}
function persGetScope(planId) {
    if (!_persPlanScope[planId]) _persPlanScope[planId] = 'mes';
    return _persPlanScope[planId];
}

let _persCuadSelectedId = null;

async function persRenderPlanes() {
    const body = document.getElementById('pers-body');
    body.innerHTML = '<div class="text-muted">Cargando…</div>';
    try {
        const [rpl, rpe] = await Promise.all([fetch('/api/planes-turno'), fetch('/api/perfiles-turno')]);
        const planes   = await rpl.json();
        const perfiles = await rpe.json();
        window._persPerfilesCache = perfiles;
        if (planes.length === 0) {
            body.innerHTML = `
                <div class="pers-toolbar">
                    <h4 class="pers-h4">Cuadrantes</h4>
                    <button class="pers-btn-primary" onclick="persEditarPlan()">+ Nuevo cuadrante</button>
                </div>
                <div class="text-muted py-4">Sin cuadrantes. Crea el primero.</div>`;
            return;
        }
        if (!_persCuadSelectedId || !planes.find(p => p.id === _persCuadSelectedId)) {
            _persCuadSelectedId = planes[0].id;
        }
        body.innerHTML = `<div class="pers-cuad-shell">
            <div class="pers-cuad-sidebar">
                <div class="pers-cuad-sidebar-hdr">
                    <span class="pers-cuad-sidebar-label">Cuadrantes</span>
                    <button class="pers-btn-primary" style="padding:0.3rem 0.85rem;font-size:0.65rem;" onclick="persEditarPlan()">+ Nuevo</button>
                </div>
                <div class="pers-cuad-plan-list">
                    ${planes.map(p => `<div class="pers-cuad-side-card ${p.id === _persCuadSelectedId ? 'active' : ''}" data-plan="${p.id}" onclick="persSelectCuadrante(${p.id})">
                        <div class="pers-cuad-side-card-name">${esc(p.nombre)}</div>
                        ${p.descripcion ? `<div class="pers-cuad-side-card-desc">${esc(p.descripcion)}</div>` : ''}
                        ${p.perfil_default_nombre ? `<div class="pers-cuad-side-card-default"><span class="pers-pill-gold" style="font-size:0.62rem;padding:2px 8px;">${esc(p.perfil_default_nombre)}</span></div>` : ''}
                    </div>`).join('')}
                </div>
            </div>
            <div class="pers-cuad-main" id="pers-cuad-main"><div class="text-muted">Cargando…</div></div>
            <div class="pers-cuad-rsidebar" id="pers-cuad-rsidebar"></div>
        </div>`;
        persSelectCuadrante(_persCuadSelectedId);
    } catch (e) { body.innerHTML = '<div class="text-danger">Error.</div>'; }
}

window.persSelectCuadrante = (planId) => {
    _persCuadSelectedId = planId;
    document.querySelectorAll('.pers-cuad-side-card').forEach(c =>
        c.classList.toggle('active', parseInt(c.dataset.plan) === planId));
    const rsidebar = document.getElementById('pers-cuad-rsidebar');
    if (rsidebar) rsidebar.innerHTML = persRenderJornadaPicker(planId);
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(p => {
        _persPlanState[planId] = _persPlanState[planId] || { vista: 'cal', anyo: new Date().getFullYear(), mes: new Date().getMonth() };
        const main = document.getElementById('pers-cuad-main');
        if (!main) return;
        main.innerHTML = persCuadMainSkeleton(p);
        persPlanRender(p);
    });
};

function persCuadMainSkeleton(p) {
    const st = _persPlanState[p.id] || { vista: 'cal', anyo: new Date().getFullYear(), mes: new Date().getMonth() };
    return `<div class="pers-cuad-main-hdr">
        <div class="pers-cuad-main-title">
            <span class="pers-cuad-main-nom">${esc(p.nombre)}</span>
            ${p.descripcion ? `<span class="pers-cuad-main-desc">${esc(p.descripcion)}</span>` : ''}
            ${p.perfil_default_nombre ? `<span class="pers-cuad-main-desc">Por defecto: <span class="pers-pill-gold">${esc(p.perfil_default_nombre)}</span></span>` : ''}
        </div>
        <div class="pers-cuad-main-controls">
            <div class="pers-plan-tabs">
                <button class="pers-plan-tab ${st.vista==='cal'?'active':''}" onclick="persPlanSetVista(${p.id},'cal')">Calendario</button>
                <button class="pers-plan-tab ${st.vista==='mes'?'active':''}" onclick="persPlanSetVista(${p.id},'mes')">Mensual</button>
                <button class="pers-plan-tab ${st.vista==='perp'?'active':''}" onclick="persPlanSetVista(${p.id},'perp')">Perpetuo</button>
            </div>
            <div class="pers-plan-nav">
                <button class="pers-nav-btn" onclick="persPlanNav(${p.id},-1)">‹</button>
                <span id="pers-plan-label-${p.id}">${st.anyo}</span>
                <button class="pers-nav-btn" onclick="persPlanNav(${p.id},1)">›</button>
            </div>
            <button class="pers-btn-ghost" onclick='persEditarPlan(${JSON.stringify(p)})'>Editar</button>
            <button class="pers-btn-icon-danger" title="Borrar" onclick="persBorrarPlan(${p.id})">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>
    </div>
    <div class="pers-plan-content" id="pers-plan-${p.id}"><div class="text-muted">Cargando…</div></div>`;
}

function persLeyendaPerfiles(perfiles) {
    return `<div class="pers-leyenda">
        <span class="pers-leyenda-label">Leyenda:</span>
        ${perfiles.map(p => `<span class="pers-leyenda-item"><span class="pers-leyenda-dot" style="background:${persPerfilColor(p.id)}"></span>${esc(p.nombre)}</span>`).join('')}
    </div>`;
}

function persPlanCardSkeleton(p) {
    const st = _persPlanState[p.id] = _persPlanState[p.id] || { vista: 'cal', anyo: new Date().getFullYear(), mes: new Date().getMonth() };
    return `
    <div class="pers-card pers-plan-card" data-plan="${p.id}">
        <div class="pers-card-head">
            <div>
                <div class="pers-card-title">${esc(p.nombre)}</div>
                <div class="pers-card-sub">${esc(p.descripcion || '')}</div>
                ${p.perfil_default_nombre ? `<div class="pers-card-sub">Por defecto: <span class="pers-pill-gold">${esc(p.perfil_default_nombre)}</span></div>` : ''}
            </div>
            <div class="pers-card-actions">
                <div class="pers-plan-tabs">
                    <button class="pers-plan-tab ${st.vista==='cal' ?'active':''}"  onclick="persPlanSetVista(${p.id},'cal')">Calendario</button>
                    <button class="pers-plan-tab ${st.vista==='mes' ?'active':''}"  onclick="persPlanSetVista(${p.id},'mes')">Mensual</button>
                    <button class="pers-plan-tab ${st.vista==='perp'?'active':''}"  onclick="persPlanSetVista(${p.id},'perp')">Perpetuo</button>
                </div>
                <div class="pers-plan-nav">
                    <button class="pers-nav-btn" onclick="persPlanNav(${p.id},-1)">‹</button>
                    <span id="pers-plan-label-${p.id}">${st.anyo}</span>
                    <button class="pers-nav-btn" onclick="persPlanNav(${p.id},1)">›</button>
                </div>
                <button class="pers-btn-ghost" onclick='persEditarPlan(${JSON.stringify(p)})'>Editar</button>
                <button class="pers-btn-icon-danger" title="Borrar" onclick="persBorrarPlan(${p.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>
        <div class="pers-plan-content" id="pers-plan-${p.id}"><div class="text-muted">Cargando…</div></div>
    </div>`;
}

window.persPlanSetVista = (planId, vista) => {
    _persPlanState[planId] = _persPlanState[planId] || { anyo: new Date().getFullYear(), mes: new Date().getMonth() };
    _persPlanState[planId].vista = vista;
    const main = document.getElementById('pers-cuad-main');
    if (main) {
        main.querySelectorAll('.pers-plan-tab').forEach(t => t.classList.remove('active'));
        const idx = vista === 'cal' ? 0 : vista === 'mes' ? 1 : 2;
        const tabs = main.querySelectorAll('.pers-plan-tab');
        if (tabs[idx]) tabs[idx].classList.add('active');
    }
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};

window.persPlanNav = (planId, delta) => {
    const st = _persPlanState[planId] || { vista: 'cal', anyo: new Date().getFullYear(), mes: new Date().getMonth() };
    if (st.vista === 'mes') {
        st.mes += delta;
        if (st.mes < 0) { st.mes = 11; st.anyo--; }
        if (st.mes > 11) { st.mes = 0; st.anyo++; }
    } else {
        st.anyo += delta;
    }
    _persPlanState[planId] = st;
    actualizarLabelPlan(planId);
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};

function actualizarLabelPlan(planId) {
    const st = _persPlanState[planId];
    const label = document.getElementById('pers-plan-label-' + planId);
    if (!label) return;
    if (st.vista === 'mes') {
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        label.textContent = meses[st.mes] + ' ' + st.anyo;
    } else label.textContent = st.anyo;
}

async function persPlanRender(p) {
    const cont = document.getElementById('pers-plan-' + p.id);
    if (!cont) return;
    const st = _persPlanState[p.id] = _persPlanState[p.id] || { vista: 'cal', anyo: new Date().getFullYear(), mes: new Date().getMonth() };
    actualizarLabelPlan(p.id);

    let calHtml;

    if (st.vista === 'perp') {
        calHtml = `<div class="pers-week">
            ${PERS_DIAS.map((nom, i) => {
                const dia = i + 1;
                const ws = (p.patron_semanal || []).find(x => x.dia === dia);
                const color = ws ? (ws.perfil_color || persPerfilColor(ws.perfil_id)) : 'rgba(255,255,255,0.04)';
                return `<div class="pers-week-cell" style="border-top: 4px solid ${color};">
                    <span class="pers-week-day">${nom}</span>
                    <span class="pers-week-prof">${ws ? esc(ws.perfil_nombre) : '—'}</span>
                </div>`;
            }).join('')}
        </div>
        ${p.perfil_default_nombre ? `<div class="pers-card-sub" style="margin-top:8px;">El resto de días sin patrón usan: <span class="pers-pill-gold">${esc(p.perfil_default_nombre)}</span></div>` : ''}
        <div class="pers-perp-apply">
            <span class="pers-perp-apply-label">Expandir patrón a fechas reales:</span>
            <input type="number" min="1" max="10" value="3" id="pers-anyos-${p.id}" class="pers-input pers-input--sm" style="width:60px;">
            <span style="font-size:0.7rem;color:#888;">año(s) desde</span>
            <input type="number" min="2020" max="2050" value="${st.anyo}" id="pers-desde-${p.id}" class="pers-input pers-input--sm" style="width:80px;">
            <button class="pers-btn-primary" style="padding:0.35rem 0.9rem;" onclick="persAplicarPatron(${p.id})">Aplicar patrón</button>
        </div>`;
    } else {
        const desde = st.vista === 'cal' ? `${st.anyo}-01-01` : `${st.anyo}-${pad(st.mes+1)}-01`;
        const hasta = st.vista === 'cal' ? `${st.anyo}-12-31` : `${st.anyo}-${pad(st.mes+1)}-${pad(diasEnMes(st.anyo, st.mes))}`;
        let dias;
        try {
            const r = await fetch(`/api/planes-turno/${p.id}/calendario?from=${desde}&to=${hasta}`);
            dias = await r.json();
        } catch (_) { cont.innerHTML = '<div class="text-danger">Error.</div>'; return; }

        const porFecha = {};
        dias.forEach(d => porFecha[d.fecha] = d);
        _persPlanDayData[p.id] = Object.assign(_persPlanDayData[p.id] || {}, porFecha);

        const toolbar = persRenderPaintToolbar(p.id);
        if (st.vista === 'mes') {
            calHtml = toolbar + `<div class="pers-cal-mes">${persRenderMesGrid(st.anyo, st.mes, porFecha, p.id)}</div>`;
        } else {
            const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            let anual = '<div class="pers-cal-anual">';
            for (let m = 0; m < 12; m++) {
                anual += `<div class="pers-cal-mini">
                    <div class="pers-cal-mini-h pers-cal-mini-h--click" onclick="persClickMes(${p.id},${st.anyo},${m})">${meses[m]}</div>
                    ${persRenderMesGrid(st.anyo, m, porFecha, p.id, true)}
                </div>`;
            }
            anual += '</div>';
            calHtml = toolbar + anual;
        }
    }

    cont.innerHTML = calHtml;

    const main = document.getElementById('pers-cuad-main');
    if (main) main.classList.toggle('pers-jornada-painting', !!_persPlanSelectedPerfil[p.id]);
    const rsidebar = document.getElementById('pers-cuad-rsidebar');
    if (rsidebar && _persCuadSelectedId === p.id) rsidebar.innerHTML = persRenderJornadaPicker(p.id);
}

function persRenderJornadaPicker(planId) {
    const perfiles = window._persPerfilesCache || [];
    const sel = _persPlanSelectedPerfil[planId];
    return `<div class="pers-jornada-picker" id="pers-jpicker-${planId}">
        <div class="pers-jornada-picker-hdr">Tipo de jornada</div>
        ${perfiles.map(pf => {
            const color = pf.color || persPerfilColor(pf.id);
            return `<div class="pers-jornada-pill ${sel && sel.id === pf.id ? 'active' : ''}"
                        style="--jc:${color}"
                        onclick="persSeleccionarJornada(${planId},${pf.id},'${esc(pf.nombre)}','${color}')">
                        <span class="pers-jornada-dot" style="background:${color}"></span>
                        <span>${esc(pf.nombre)}</span>
                    </div>`;
        }).join('')}
        ${sel ? `<button class="pers-jornada-desel" onclick="persSeleccionarJornada(${planId},null)">✕ Limpiar</button>` : ''}
        ${sel ? `<div class="pers-jornada-hint">Clic en mes, día o letra</div>` : ''}
    </div>`;
}

window.persSeleccionarJornada = (planId, perfilId, nombre, color) => {
    const actual = _persPlanSelectedPerfil[planId];
    if (!perfilId || (actual && actual.id === perfilId)) {
        delete _persPlanSelectedPerfil[planId];
    } else {
        _persPlanSelectedPerfil[planId] = { id: perfilId, nombre, color };
    }
    const sel = _persPlanSelectedPerfil[planId];
    // Actualizar picker sin re-fetch
    const picker = document.getElementById(`pers-jpicker-${planId}`);
    if (picker) {
        picker.querySelectorAll('.pers-jornada-pill').forEach(el => {
            const pId = parseInt(el.getAttribute('onclick').match(/persSeleccionarJornada\(\d+,(\d+)/)?.[1]);
            el.classList.toggle('active', sel && pId === sel.id);
        });
        let desel = picker.querySelector('.pers-jornada-desel');
        let hint  = picker.querySelector('.pers-jornada-hint');
        if (sel) {
            if (!desel) picker.insertAdjacentHTML('beforeend',
                `<button class="pers-jornada-desel" onclick="persSeleccionarJornada(${planId},null)">✕ Limpiar</button>`);
            if (!hint) picker.insertAdjacentHTML('beforeend',
                `<div class="pers-jornada-hint">Clic en mes, día o letra</div>`);
        } else {
            desel?.remove(); hint?.remove();
        }
    }
    const main = document.getElementById('pers-cuad-main');
    if (main) main.classList.toggle('pers-jornada-painting', !!sel);
};

window.persClickCalCell = (planId, fecha, currentPerfilId, isOverride, isLibre) => {
    if (_persPlanSelectedPerfil[planId]) {
        persAplicarJornada(planId, fecha, fecha, null);
    } else {
        persPlanCellClick(planId, fecha, currentPerfilId, isOverride, !!isLibre);
    }
};

window.persClickMes = (planId, anyo, mes) => {
    if (!_persPlanSelectedPerfil[planId]) return;
    const scope = persGetScope(planId);
    const dows = Array.from(persGetActiveDows(planId));
    const usarTodos = dows.length === 7;
    if (scope === 'anyo') {
        persAplicarJornada(planId, `${anyo}-01-01`, `${anyo}-12-31`, usarTodos ? null : dows);
    } else {
        const desde = `${anyo}-${pad(mes+1)}-01`;
        const hasta = `${anyo}-${pad(mes+1)}-${pad(diasEnMes(anyo, mes))}`;
        persAplicarJornada(planId, desde, hasta, usarTodos ? null : dows);
    }
};

window.persClickDiaSemana = (planId, anyo, mes, diaSemana) => {
    if (!_persPlanSelectedPerfil[planId]) return;
    const desde = `${anyo}-${pad(mes+1)}-01`;
    const hasta = `${anyo}-${pad(mes+1)}-${pad(diasEnMes(anyo, mes))}`;
    persAplicarJornada(planId, desde, hasta, [diaSemana]);
};

window.persAplicarJornada = async (planId, desde, hasta, diasSemana) => {
    const sel = _persPlanSelectedPerfil[planId];
    if (!sel) return;
    const r = await fetch(`/api/planes-turno/${planId}/overrides/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_id: sel.id, desde, hasta, dias_semana: diasSemana })
    });
    if (!r.ok) { alert(await r.text() || 'Error.'); return; }

    // Update optimista: pintar celdas del DOM directamente sin re-fetchar el calendario
    const color = sel.color;
    const cache = _persPlanDayData[planId] = _persPlanDayData[planId] || {};
    const container = document.getElementById('pers-plan-' + planId);
    let cur = new Date(desde + 'T00:00:00');
    const end = new Date(hasta + 'T00:00:00');
    while (cur <= end) {
        const dow = cur.getDay() === 0 ? 7 : cur.getDay(); // ISO: 1=Lun..7=Dom
        if (!diasSemana || diasSemana.includes(dow)) {
            const fecha = cur.toISOString().slice(0, 10);
            // Actualizar cache local
            cache[fecha] = Object.assign(cache[fecha] || {}, {
                perfil_id: sel.id, perfil_nombre: sel.nombre, color, override: true, libre: false
            });
            // Pintar celda en el DOM
            const btn = container && container.querySelector(`button[data-fecha="${fecha}"]`);
            if (btn) {
                btn.style.borderBottomColor = color;
                btn.title = sel.nombre + ' (override) — Clic derecho: borrar override';
                if (!btn.querySelector('.pers-cal-dot'))
                    btn.insertAdjacentHTML('beforeend', '<span class="pers-cal-dot">●</span>');
            }
        }
        cur.setDate(cur.getDate() + 1);
    }
};

function persRenderMesGrid(anyo, mes, porFecha, planId, mini) {
    const st  = _persPlanState[planId] || {};
    const dias = diasEnMes(anyo, mes);
    const primer = (new Date(anyo, mes, 1).getDay() + 6) % 7;
    const labels = ['L','M','X','J','V','S','D'];
    let html = `<div class="pers-cal-grid ${mini ? 'pers-cal-grid--mini' : ''}">`;
    labels.forEach((l, li) => html += `<div class="pers-cal-cabecera pers-cal-cabecera--click" onclick="persClickDiaSemana(${planId},${anyo},${mes},${li+1})">${l}</div>`);
    for (let i = 0; i < primer; i++) html += '<div class="pers-cal-celda pers-cal-celda--vacia"></div>';
    const hoy = new Date();
    for (let d = 1; d <= dias; d++) {
        const fecha = `${anyo}-${pad(mes+1)}-${pad(d)}`;
        const info = porFecha[fecha];
        const color = info && info.color ? info.color : (info && info.perfil_id ? persPerfilColor(info.perfil_id) : 'rgba(255,255,255,0.04)');
        const isOverride = info && info.override;
        const isLibre   = info && !!info.libre;
        const isHoy = (anyo === hoy.getFullYear() && mes === hoy.getMonth() && d === hoy.getDate());
        const isCustom = info && info.custom_tramos;
        html += `<button type="button" class="pers-cal-celda ${isHoy ? 'pers-cal-celda--hoy' : ''}"
                    style="border-bottom: 4px solid ${color};"
                    data-fecha="${fecha}"
                    data-custom="${isCustom ? 'true' : 'false'}"
                    onclick="persClickCalCell(${planId},'${fecha}',${info && info.perfil_id ? info.perfil_id : 'null'},${isOverride},${isLibre})"
                    oncontextmenu="event.preventDefault(); persPlanRestaurarPatron(${planId},'${fecha}'); return false;"
                    title="${isLibre ? 'Día libre' : (info && info.perfil_nombre ? esc(info.perfil_nombre) : 'Sin perfil')}${isOverride && !isLibre ? ' (override)' : ''}${isCustom ? ' [horas custom]' : ''} — Clic derecho: borrar override">
                    <span class="pers-cal-num">${d}</span>
                    ${(isOverride || isCustom) ? '<span class="pers-cal-dot">●</span>' : ''}
                </button>`;
    }
    return html + '</div>';
}

window.persPlanCellClick = async (planId, fecha, currentPerfilId, isOverride, isLibre) => {
    const perfiles    = window._persPerfilesCache || [];
    const perfilActual = perfiles.find(p => p.id === currentPerfilId);
    const colorActual  = perfilActual ? (perfilActual.color || persPerfilColor(perfilActual.id)) : '#c9a96e';

    const info  = (_persPlanDayData[planId] || {})[fecha] || {};
    const slots = info.slots || [];

    // Día marcado como libre: modal simplificado
    if (isLibre) {
        persOpenModal(`
            <h3 class="pers-modal-title">
                <span style="font-size:0.6rem;letter-spacing:2px;color:#888;display:block;margin-bottom:4px;text-transform:uppercase;">Editar día</span>
                ${fecha}
            </h3>
            <div class="pers-cell-info" style="border-left:3px solid #555;">
                <span class="pers-cell-info-tag">Día libre</span>
                <span class="pers-cell-info-nom" style="color:#888">Sin jornada asignada</span>
            </div>
            <div class="pers-modal-actions" style="justify-content:space-between;margin-top:24px;">
                <button type="button" class="pers-btn-ghost" style="color:#888;border-color:rgba(255,255,255,0.15);"
                    onclick="persPlanRestaurarPatron(${planId},'${fecha}')">Restaurar patrón</button>
                <button class="pers-btn-ghost" onclick="persCloseModal()">Cerrar</button>
            </div>
        `);
        return;
    }

    const slotsHtml = slots.map(s =>
        `<div class="pers-tramo-input">
            <input type="time" value="${s.from}" data-tipo="hi"> →
            <input type="time" value="${s.to}" data-tipo="hf">
            <button type="button" onclick="this.parentElement.remove()" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:1rem;padding:0 4px;">×</button>
         </div>`
    ).join('');

    const infoHtml = currentPerfilId
        ? `<div class="pers-cell-info" style="border-left:3px solid ${colorActual};">
               <span class="pers-cell-info-tag">${isOverride ? 'Override de perfil' : 'Patrón semanal'}</span>
               <span class="pers-cell-info-nom" style="color:${colorActual}">${esc(perfilActual ? perfilActual.nombre : '')}</span>
           </div>`
        : `<div class="pers-cell-info pers-cell-info--empty">Sin perfil asignado</div>`;

    const opts = `<option value="">— Sin override (usa patrón) —</option>` +
        perfiles.map(p => `<option value="${p.id}" ${isOverride && currentPerfilId === p.id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('');

    persOpenModal(`
        <h3 class="pers-modal-title">
            <span style="font-size:0.6rem;letter-spacing:2px;color:#888;display:block;margin-bottom:4px;text-transform:uppercase;">Editar día</span>
            ${fecha}
        </h3>
        ${infoHtml}

        <div style="margin-top:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <label class="pers-label" style="margin:0;">Tramos horarios</label>
                <button type="button" class="pers-btn-ghost" style="padding:3px 10px;font-size:0.7rem;" onclick="persCellAddSlot()">+ Añadir tramo</button>
            </div>
            <div id="pcc-slots-cont" class="pers-tramos-editor" style="max-height:200px;overflow-y:auto;">
                ${slotsHtml || '<div style="color:#666;font-size:0.8rem;padding:8px 0;">Sin tramos definidos</div>'}
            </div>
        </div>

        <div style="margin-top:18px;">
            <label class="pers-label">Cambiar perfil para este día (opcional)</label>
            <select id="pcc-perfil" class="pers-input">${opts}</select>
        </div>

        <div class="pers-modal-actions" style="justify-content:space-between;">
            <button type="button" class="pers-btn-ghost" style="color:#e74c3c;border-color:rgba(231,76,60,0.35);"
                onclick="persPlanLimpiarJornada(${planId},'${fecha}')">Limpiar jornada</button>
            <div style="display:flex;gap:8px;">
                <button class="pers-btn-ghost" onclick="persCloseModal()">Cancelar</button>
                <button class="pers-btn-primary" onclick="persPlanGuardarDiaCompleto(${planId}, '${fecha}')">Guardar</button>
            </div>
        </div>
    `);
};

window.persCellAddSlot = () => {
    const cont = document.getElementById('pcc-slots-cont');
    if (!cont) return;
    // Quitar el mensaje "libre" si existía
    const msg = cont.querySelector('div[style*="color:#666"]');
    if (msg) msg.remove();
    cont.insertAdjacentHTML('beforeend', `
        <div class="pers-tramo-input">
            <input type="time" value="09:00" data-tipo="hi"> →
            <input type="time" value="17:00" data-tipo="hf">
            <button type="button" onclick="this.parentElement.remove()" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:1rem;padding:0 4px;">×</button>
        </div>
    `);
};

window.persPlanGuardarDiaCompleto = async (planId, fecha) => {
    // 1. Recoger tramos editados
    const tramos = [];
    document.querySelectorAll('#pcc-slots-cont .pers-tramo-input').forEach(row => {
        const ins = row.querySelectorAll('input[type="time"]');
        if (ins[0] && ins[1] && ins[0].value && ins[1].value) {
            tramos.push({ hora_inicio: ins[0].value, hora_fin: ins[1].value });
        }
    });

    // 2. Guardar tramos custom (PUT reemplaza todo; lista vacía = volver al perfil)
    const rTramos = await fetch(`/api/planes-turno/${planId}/dia/${fecha}/tramos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tramos })
    });
    if (!rTramos.ok) { alert(await rTramos.text() || 'Error al guardar tramos.'); return; }

    // 3. Guardar override de perfil para este día (endpoint dedicado, evita conflicto UNIQUE)
    const perfilSel = document.getElementById('pcc-perfil')?.value;
    const rPerfil = await fetch(`/api/planes-turno/${planId}/dia/${fecha}/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_id: perfilSel ? parseInt(perfilSel, 10) : null })
    });
    if (!rPerfil.ok) { alert(await rPerfil.text() || 'Error al guardar perfil.'); return; }

    persCloseModal();
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};


window.persPlanLimpiarJornada = async (planId, fecha) => {
    const [r1, r2] = await Promise.all([
        fetch(`/api/planes-turno/${planId}/dia/${fecha}/tramos`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tramos: [] })
        }),
        fetch(`/api/planes-turno/${planId}/dia/${fecha}/perfil`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ libre: true })
        })
    ]);
    if (!r1.ok || !r2.ok) { alert('Error al limpiar jornada.'); return; }
    persCloseModal();
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};

function persRenderPaintToolbar(planId) {
    const dows = persGetActiveDows(planId);
    const scope = persGetScope(planId);
    const labels = [{d:1,l:'L'},{d:2,l:'M'},{d:3,l:'X'},{d:4,l:'J'},{d:5,l:'V'},{d:6,l:'S'},{d:7,l:'D'}];
    return `<div class="pers-paint-toolbar">
        <div class="pers-paint-grp">
            <span class="pers-paint-lbl">Pintar:</span>
            <button class="pers-paint-pill ${scope==='mes'?'active':''}" onclick="persSetScope(${planId},'mes')">Mes</button>
            <button class="pers-paint-pill ${scope==='anyo'?'active':''}" onclick="persSetScope(${planId},'anyo')">Año</button>
        </div>
        <div class="pers-paint-grp">
            <button class="pers-paint-pill" onclick="persSetDows(${planId},[1,2,3,4,5])">L–V</button>
            <button class="pers-paint-pill" onclick="persSetDows(${planId},[1,2,3,4,5,6,7])">Todos</button>
        </div>
        <div class="pers-paint-grp">
            ${labels.map(({d,l}) => `<button class="pers-paint-chip ${dows.has(d)?'active':''}" onclick="persToggleDow(${planId},${d})">${l}</button>`).join('')}
        </div>
        <div class="pers-paint-grp pers-paint-grp--end">
            <button class="pers-paint-clear" onclick="persLimpiarRango(${planId},'mes')">Limpiar mes</button>
            <button class="pers-paint-clear" onclick="persLimpiarRango(${planId},'anyo')">Limpiar año</button>
        </div>
    </div>`;
}

window.persSetScope = (planId, scope) => {
    _persPlanScope[planId] = scope;
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};

window.persSetDows = (planId, arr) => {
    _persPlanActiveDows[planId] = new Set(arr);
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};

window.persToggleDow = (planId, dow) => {
    const s = persGetActiveDows(planId);
    if (s.has(dow)) s.delete(dow); else s.add(dow);
    if (s.size === 0) s.add(dow); // no permitir vacío
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};

window.persAplicarPatron = async (planId) => {
    const anyos = parseInt(document.getElementById('pers-anyos-' + planId)?.value || '1', 10);
    const desde = parseInt(document.getElementById('pers-desde-' + planId)?.value || new Date().getFullYear(), 10);
    if (!confirm(`Esto reemplazará ${anyos} año(s) de overrides desde ${desde}. ¿Continuar?`)) return;
    const r = await fetch(`/api/planes-turno/${planId}/aplicar-patron`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anyos, desde_anyo: desde })
    });
    if (!r.ok) { alert(await r.text() || 'Error.'); return; }
    const json = await r.json();
    alert(`Patrón aplicado: ${json.insertados} días insertados.`);
    fetch('/api/planes-turno/' + planId).then(rr => rr.json()).then(persPlanRender);
};

window.persLimpiarRango = async (planId, tipo) => {
    const st = _persPlanState[planId] || { anyo: new Date().getFullYear(), mes: new Date().getMonth() };
    let url, msg;
    if (tipo === 'mes') {
        url = `/api/planes-turno/${planId}/calendario?year=${st.anyo}&month=${st.mes+1}`;
        msg = `¿Borrar todos los overrides y tramos de ${st.mes+1}/${st.anyo}?`;
    } else {
        url = `/api/planes-turno/${planId}/calendario?year=${st.anyo}`;
        msg = `¿Borrar todos los overrides y tramos del año ${st.anyo}?`;
    }
    if (!confirm(msg)) return;
    const r = await fetch(url, { method: 'DELETE' });
    if (!r.ok) { alert(await r.text() || 'Error.'); return; }
    fetch('/api/planes-turno/' + planId).then(rr => rr.json()).then(persPlanRender);
};

window.persPlanRestaurarPatron = async (planId, fecha) => {
    const [r1, r2] = await Promise.all([
        fetch(`/api/planes-turno/${planId}/dia/${fecha}/tramos`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tramos: [] })
        }),
        fetch(`/api/planes-turno/${planId}/dia/${fecha}/perfil`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfil_id: null })
        })
    ]);
    if (!r1.ok || !r2.ok) { alert('Error al restaurar.'); return; }
    persCloseModal();
    fetch('/api/planes-turno/' + planId).then(r => r.json()).then(persPlanRender);
};

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function diasEnMes(anyo, mes) { return new Date(anyo, mes + 1, 0).getDate(); }

window.persEditarPlan = (p) => {
    const perfiles = window._persPerfilesCache || [];
    const optsPerfiles = (selId) => `<option value="">— Sin perfil por defecto —</option>` +
        perfiles.map(pp => `<option value="${pp.id}" ${selId === pp.id ? 'selected' : ''}>${esc(pp.nombre)}</option>`).join('');

    if (!p) {
        // ── MODO CREAR: formulario limpio ─────────────────────────────────
        persOpenModal(`
            <div class="pers-plan-create-modal">
                <div class="pers-plan-create-header">
                    <h3 class="pers-plan-create-title">Nuevo cuadrante</h3>
                    <button class="pers-plan-create-close" onclick="persCloseModal()">×</button>
                </div>

                <label class="pers-plan-create-label">Nombre</label>
                <input id="pl-nombre" class="pers-plan-create-input" placeholder="Ej: Recepción Rotativo 2026" autocomplete="off">

                <label class="pers-plan-create-label">Descripción <span class="pers-plan-create-optional">(opcional)</span></label>
                <textarea id="pl-desc" class="pers-plan-create-input pers-plan-create-textarea" rows="2" placeholder="Describe el cuadrante…"></textarea>

                <label class="pers-plan-create-label">Perfil por defecto <span class="pers-plan-create-optional">(días sin asignación)</span></label>
                <select id="pl-default" class="pers-plan-create-input pers-plan-create-select">${optsPerfiles(null)}</select>

                <button class="pers-plan-create-btn" onclick="persGuardarPlan(null)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                    Crear cuadrante
                </button>
            </div>
        `);
        return;
    }

    // ── MODO EDITAR: formulario completo con patrón y overrides ──────────
    const patron = p.patron_semanal || [];
    persOpenModal(`
        <h3 class="pers-modal-title">Editar — ${esc(p.nombre)}</h3>
        <label class="pers-label">Nombre</label>
        <input id="pl-nombre" class="pers-input" value="${esc(p.nombre)}">
        <label class="pers-label">Descripción</label>
        <input id="pl-desc" class="pers-input" value="${esc(p.descripcion || '')}">
        <label class="pers-label" style="margin-top:14px;">Perfil por defecto</label>
        <select id="pl-default" class="pers-input">${optsPerfiles(p.perfil_default_id)}</select>

        <div class="pers-label" style="margin-top:18px;">Patrón semanal</div>
        <div class="pers-week-edit">
            ${PERS_DIAS.map((nom, i) => {
                const dia = i + 1;
                const ws = patron.find(x => x.dia === dia);
                return `<div class="pers-week-edit-row" data-dia="${dia}">
                    <span class="pers-week-day">${nom}</span>
                    <select class="pers-input pers-input--sm">${optsPerfiles(ws ? ws.perfil_id : null)}</select>
                </div>`;
            }).join('')}
        </div>

        <div class="pers-label" style="margin-top:18px;">Overrides por fecha (opcional)</div>
        <div class="pers-overrides-edit">
            <div class="d-flex gap-2 align-items-end mb-2">
                <input type="date" id="pl-ovr-date" class="pers-input pers-input--sm">
                <select id="pl-ovr-perfil" class="pers-input pers-input--sm">${optsPerfiles(null)}</select>
                <button class="pers-btn-ghost" onclick="persPlanAddOverride()">+ Añadir</button>
            </div>
            <div id="pl-ovr-list"></div>
        </div>

        <div class="pers-modal-actions">
            <button class="pers-btn-ghost" onclick="persCloseModal()">Cancelar</button>
            <button class="pers-btn-primary" onclick="persGuardarPlan(${p.id})">Guardar</button>
        </div>
    `);
    window._persOverrides = (p.dias || []).map(d => ({ fecha: d.fecha, perfil_id: d.perfil_id, perfil_nombre: d.perfil_nombre }));
    persPintarOverrides();
};

function persPintarOverrides() {
    const cont = document.getElementById('pl-ovr-list');
    if (!cont) return;
    const list = window._persOverrides || [];
    cont.innerHTML = list.length === 0 ? '<span class="text-muted">Sin overrides</span>' :
        list.map((d, i) => `
            <div class="pers-ovr-row">
                <span>${d.fecha}</span>
                <span class="pers-pill-gold">${esc(d.perfil_nombre || ('id ' + d.perfil_id))}</span>
                <button class="pers-btn-ghost" onclick="persPlanRemoveOverride(${i})">×</button>
            </div>`).join('');
}

window.persPlanAddOverride = () => {
    const fecha = document.getElementById('pl-ovr-date').value;
    const sel = document.getElementById('pl-ovr-perfil');
    const perfilId = parseInt(sel.value, 10);
    if (!fecha || !perfilId) { alert('Fecha y perfil requeridos.'); return; }
    const perfilNombre = sel.options[sel.selectedIndex].text;
    window._persOverrides = window._persOverrides || [];
    window._persOverrides.push({ fecha, perfil_id: perfilId, perfil_nombre: perfilNombre });
    persPintarOverrides();
};

window.persPlanRemoveOverride = (idx) => {
    window._persOverrides.splice(idx, 1);
    persPintarOverrides();
};

window.persGuardarPlan = async (id) => {
    const nombreEl = document.getElementById('pl-nombre');
    if (!nombreEl || !nombreEl.value.trim()) { alert('El nombre es obligatorio.'); nombreEl && nombreEl.focus(); return; }
    const def = document.getElementById('pl-default').value;
    const patron = [];
    document.querySelectorAll('.pers-week-edit-row').forEach(row => {
        const dia = parseInt(row.dataset.dia, 10);
        const sel = row.querySelector('select').value;
        if (sel) patron.push({ dia, perfil_id: parseInt(sel, 10) });
    });
    const descEl = document.getElementById('pl-desc');
    const body = {
        nombre: nombreEl.value.trim(),
        descripcion: descEl ? descEl.value : '',
        perfil_default_id: def ? parseInt(def, 10) : null,
        patron_semanal: patron,
        dias: (window._persOverrides || []).map(d => ({ fecha: d.fecha, perfil_id: d.perfil_id }))
    };
    const url = id ? `/api/planes-turno/${id}` : '/api/planes-turno';
    const r = await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { alert(await r.text() || 'Error.'); return; }
    persCloseModal();
    persRenderPlanes();
};

window.persBorrarPlan = async (id) => {
    if (!confirm('¿Borrar cuadrante? Los empleados asignados quedarán sin plan.')) return;
    const r = await fetch(`/api/planes-turno/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) { alert(await r.text() || 'Error.'); return; }
    if (_persCuadSelectedId === id) _persCuadSelectedId = null;
    persRenderPlanes();
};

// ═════ ASIGNACIÓN ═════════════════════════════════════════════════════════

let _persSelectedPlanId   = null;   // id del plan seleccionado en el sidebar
let _persSelectedPlanNom  = null;

async function persRenderAsignacion() {
    const body = document.getElementById('pers-body');
    body.innerHTML = '<div class="text-muted">Cargando…</div>';
    try {
        const [re, rp] = await Promise.all([fetch('/api/empleados'), fetch('/api/planes-turno')]);
        const emps   = await re.json();
        const planes = await rp.json();
        window._persPlanesCache = planes;
        window._persEmpsCache   = emps;

        body.innerHTML = `
        <div class="pers-asig-layout">

            <!-- ── Sidebar izquierdo: lista de planes ── -->
            <aside class="pers-asig-sidebar">
                <div class="pers-asig-sidebar-hdr">
                    <span class="pers-asig-sidebar-label">Plan a asignar</span>
                    <span id="pers-asig-plan-nom" class="pers-asig-sidebar-nom">—</span>
                </div>
                <div class="pers-asig-plan-list">
                    <div class="pers-asig-plan-card" id="asig-card-null" onclick="persAsigSeleccionarPlan(null)">
                        <div class="pers-asig-plan-card-name">Sin plan</div>
                        <div class="pers-asig-plan-card-desc">Quitar plan asignado</div>
                    </div>
                    ${planes.map(p => `
                    <div class="pers-asig-plan-card" id="asig-card-${p.id}" data-plan-id="${p.id}"
                         onclick="persAsigSeleccionarPlan(${p.id}, '${esc(p.nombre)}')">
                        <div class="pers-asig-plan-card-name">${esc(p.nombre)}</div>
                        ${p.descripcion ? `<div class="pers-asig-plan-card-desc">${esc(p.descripcion)}</div>` : ''}
                    </div>`).join('')}
                </div>
            </aside>

            <!-- ── Panel derecho: tabla de empleados ── -->
            <div class="pers-asig-main">
                <div class="pers-asig-search-wrap">
                    <svg class="pers-asig-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input id="pers-asig-search" class="pers-asig-search"
                           placeholder="Nombre, email…"
                           oninput="persAsigFiltrar(this.value)">
                </div>
                <div class="pers-asig-table-hdr">
                    <span>Usuario</span>
                    <span>Departamento</span>
                    <span>Rol</span>
                    <span>Plan actual</span>
                    <span></span>
                </div>
                <div id="pers-asig-rows">
                    ${emps.length === 0
                        ? '<div class="text-muted" style="padding:24px 0">Sin empleados.</div>'
                        : emps.map(e => persAsigEmpRow(e)).join('')}
                </div>
            </div>
        </div>`;
    } catch(err) { body.innerHTML = '<div class="text-danger">Error al cargar.</div>'; }
}

function persAsigEmpRow(e) {
    const initials = (e.nombre || e.email || '?').split(' ').slice(0,2).map(w => w[0].toUpperCase()).join('');
    const colores  = ['#4dabf7','#51cf66','#ff6b6b','#cc5de8','#ffa94d','#f783ac','#3bc9db','#c9a84c'];
    const avatarBg = colores[e.id % colores.length];
    const planNom  = e.planNombre ? esc(e.planNombre) : '<span class="pers-asig-sinplan">Sin plan</span>';
    const deptoNom = e.departamento
        ? `<span class="pers-asig-dept-badge">${e.departamento.charAt(0)+e.departamento.slice(1).toLowerCase()}</span>`
        : '<span class="pers-asig-sinplan">—</span>';
    const roles = (e.roles || []).filter(r => r !== 'ROLE_CLIENTE')
        .map(r => r.replace('ROLE_',''))
        .join(', ') || '—';
    return `
    <div class="pers-asig-row" id="asig-row-${e.id}">
        <div class="pers-asig-user">
            <div class="pers-asig-avatar" style="background:${avatarBg}">${initials}</div>
            <div class="pers-asig-user-info">
                <div class="pers-asig-user-name">${esc(e.nombre || e.email)}</div>
                <div class="pers-asig-user-email">${esc(e.email)}</div>
            </div>
        </div>
        <div class="pers-asig-cell">${deptoNom}</div>
        <div class="pers-asig-cell pers-asig-rol">${esc(roles)}</div>
        <div class="pers-asig-cell" id="asig-plan-${e.id}">${planNom}</div>
        <div class="pers-asig-cell pers-asig-actions">
            <button class="pers-asig-btn-asignar" onclick="persAsignarPlanSeleccionado(${e.id})">Asignar</button>
            <button class="pers-asig-btn-ver" title="Ver semana" onclick="persVerHorario(${e.id}, '${esc(e.nombre || e.email)}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
            </button>
        </div>
    </div>`;
}

window.persAsigSeleccionarPlan = (planId, planNom) => {
    _persSelectedPlanId  = planId;
    _persSelectedPlanNom = planNom || null;
    // Actualizar label del sidebar
    const nomEl = document.getElementById('pers-asig-plan-nom');
    if (nomEl) nomEl.textContent = planNom || 'Sin plan';
    // Resaltar card seleccionada
    document.querySelectorAll('.pers-asig-plan-card').forEach(c => c.classList.remove('active'));
    const card = document.getElementById(planId ? `asig-card-${planId}` : 'asig-card-null');
    if (card) card.classList.add('active');
};

window.persAsignarPlanSeleccionado = async (empId) => {
    if (_persSelectedPlanId === null && _persSelectedPlanNom !== null) return; // sin selección
    const bodyReq = { plan_id: _persSelectedPlanId || null, departamento: null };
    const r = await fetch(`/api/empleados/${empId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyReq)
    });
    if (!r.ok) { alert(await r.text() || 'Error.'); return; }
    // Actualizar la celda de plan actual inline sin recargar toda la lista
    const planCell = document.getElementById(`asig-plan-${empId}`);
    if (planCell) {
        planCell.innerHTML = _persSelectedPlanId
            ? esc(_persSelectedPlanNom || '')
            : '<span class="pers-asig-sinplan">Sin plan</span>';
    }
    // Actualizar caché
    const emp = (window._persEmpsCache || []).find(e => e.id === empId);
    if (emp) { emp.planId = _persSelectedPlanId; emp.planNombre = _persSelectedPlanNom; }
};

window.persAsigFiltrar = (q) => {
    const term = q.toLowerCase();
    const emps = window._persEmpsCache || [];
    const filtrados = term
        ? emps.filter(e => (e.nombre || '').toLowerCase().includes(term) || (e.email || '').toLowerCase().includes(term))
        : emps;
    const cont = document.getElementById('pers-asig-rows');
    if (cont) cont.innerHTML = filtrados.length === 0
        ? '<div class="text-muted" style="padding:16px 0">Sin resultados.</div>'
        : filtrados.map(e => persAsigEmpRow(e)).join('');
};

// mantener compatibilidad con persAsignarPlan usado en código antiguo
window.persAsignarPlan = async (empId, planId, dept) => {
    const bodyReq = { plan_id: planId ? parseInt(planId, 10) : null, departamento: dept || null };
    const r = await fetch(`/api/empleados/${empId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyReq)
    });
    if (!r.ok) alert(await r.text() || 'Error.');
};

window.persVerHorario = async (empId, nombre) => {
    const hoy = new Date();
    const dow = (hoy.getDay() + 6) % 7; // 0=Lun
    const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - dow);
    const fechas = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(lunes); d.setDate(lunes.getDate() + i);
        fechas.push(d.toISOString().slice(0, 10));
    }
    persOpenModal(`
        <h3 class="pers-modal-title">Horario semanal · ${esc(nombre)}</h3>
        <div id="pers-week-view" class="text-muted">Cargando…</div>
        <div class="pers-modal-actions"><button class="pers-btn-primary" onclick="persCloseModal()">Cerrar</button></div>
    `);
    const out = await Promise.all(fechas.map(f =>
        fetch(`/api/empleados/${empId}/horario?date=${f}`).then(r => r.json()).then(j => ({ fecha: f, ...j }))
    ));
    const cont = document.getElementById('pers-week-view');
    cont.innerHTML = `
        <div class="pers-week-table">
            ${out.map((d, i) => `
                <div class="pers-week-day-row">
                    <span class="pers-week-day-name">${PERS_DIAS[i]} <small class="text-muted">${d.fecha.slice(5)}</small></span>
                    <span class="pers-week-day-perf" style="${d.libre ? 'color:#555;font-style:italic;' : ''}">${d.libre ? 'Día libre' : (d.perfil_nombre || '—')}</span>
                    <div class="pers-week-day-slots">
                        ${d.libre ? '<span class="text-muted" style="color:#555">Sin horario</span>' :
                          (d.slots || []).length === 0 ? '<span class="text-muted">Sin tramos</span>' :
                          d.slots.map(s => `<span class="pers-tramo">${s.from}–${s.to}</span>`).join('')}
                    </div>
                </div>`).join('')}
        </div>`;
};

window.persFiltrarPlan = (planId, btn) => {
    document.querySelectorAll('.pers-plan-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.pers-plan-card').forEach(card => {
        const show = planId === null || parseInt(card.dataset.plan) === planId;
        card.style.display = show ? '' : 'none';
    });
};

// ═════ Modal helper ═══════════════════════════════════════════════════════

window.persOpenModal = (html) => {
    persCloseModal();
    const div = document.createElement('div');
    div.id = 'pers-modal';
    div.className = 'pers-modal-overlay';
    div.innerHTML = `<div class="pers-modal-content">${html}</div>`;
    div.addEventListener('click', e => { if (e.target === div) persCloseModal(); });
    document.body.appendChild(div);
};
window.persCloseModal = () => {
    const m = document.getElementById('pers-modal');
    if (m) m.remove();
};

function esc(s) { return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
