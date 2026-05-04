// ── CALENDARIO DE LIMPIEZA: muestra checkouts (días con limpiezas pendientes)
(function () {
    'use strict';

    const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const DIAS_CAB = ['L','M','X','J','V','S','D'];

    let state = { vista: 'anual', anyo: new Date().getFullYear(), mes: new Date().getMonth(), cacheRango: null, diaActual: null };
    let modal = null;

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('cal-page')) return;
        modal = new bootstrap.Modal(document.getElementById('calDiaModal'));
        document.querySelectorAll('.cal-tab').forEach(b => b.addEventListener('click', () => cambiarVista(b.dataset.view)));
        document.getElementById('cal-prev').addEventListener('click', () => navegar(-1));
        document.getElementById('cal-next').addEventListener('click', () => navegar(1));
        render();
    });

    function cambiarVista(v) {
        state.vista = v;
        document.querySelectorAll('.cal-tab').forEach(b => b.classList.toggle('cal-tab--active', b.dataset.view === v));
        render();
    }
    function navegar(d) {
        if (state.vista === 'anual') state.anyo += d;
        else { state.mes += d; if (state.mes < 0) { state.mes = 11; state.anyo--; } if (state.mes > 11) { state.mes = 0; state.anyo++; } }
        render();
    }
    function actualizarLabel() {
        document.getElementById('cal-context-label').textContent =
            state.vista === 'anual' ? state.anyo : (cap(MESES[state.mes].toLowerCase()) + ' ' + state.anyo);
    }
    function render() {
        actualizarLabel();
        const c = document.getElementById('cal-content');
        c.innerHTML = '<div class="cal-loading">Cargando…</div>';
        if (state.vista === 'anual') return renderAnual(c);
        return renderMensual(c);
    }

    function renderAnual(content) {
        const desde = ymd(state.anyo, 0, 1), hasta = ymd(state.anyo, 11, 31);
        cargarRango(desde, hasta).then(conteos => {
            let html = '<div class="cal-anual-grid">';
            for (let m = 0; m < 12; m++) {
                html += `<div class="cal-mes-card"><div class="cal-mes-header">${MESES[m]}</div>${renderGridMes(state.anyo, m, conteos, false)}</div>`;
            }
            html += '</div>';
            content.innerHTML = html;
            attachClicks(content);
        });
    }

    function renderMensual(content) {
        const dias = diasEnMes(state.anyo, state.mes);
        const desde = ymd(state.anyo, state.mes, 1), hasta = ymd(state.anyo, state.mes, dias);
        cargarRango(desde, hasta).then(conteos => {
            let html = `<div class="cal-mensual-card"><div class="cal-mensual-header">${cap(MESES[state.mes].toLowerCase())} ${state.anyo}</div>${renderGridMes(state.anyo, state.mes, conteos, true)}</div>`;
            content.innerHTML = html;
            attachClicks(content);
        });
    }

    function renderGridMes(a, m, conteos, lg) {
        const primer = (new Date(a, m, 1).getDay() + 6) % 7;
        const dias = diasEnMes(a, m);
        const hoy = new Date();
        let html = `<div class="cal-grid${lg ? ' cal-grid--lg' : ''}">`;
        DIAS_CAB.forEach(d => html += `<div class="cal-cabecera">${d}</div>`);
        for (let i = 0; i < primer; i++) html += '<div class="cal-celda cal-celda--vacia"></div>';
        for (let d = 1; d <= dias; d++) {
            const f = ymd(a, m, d);
            const n = conteos[f] || 0;
            let cls = 'cal-celda';
            if (n > 0) cls += ' cal-celda--con-reservas';
            if (a === hoy.getFullYear() && m === hoy.getMonth() && d === hoy.getDate()) cls += ' cal-celda--hoy';
            html += `<button type="button" class="${cls}" data-day="${f}"><span class="cal-celda-num">${d}</span>${n > 0 ? `<span class="cal-celda-badge">${n}</span>` : ''}</button>`;
        }
        return html + '</div>';
    }

    function attachClicks(root) {
        root.querySelectorAll('[data-day]').forEach(el => el.addEventListener('click', () => abrirDia(el.dataset.day)));
    }

    async function abrirDia(fecha) {
        state.diaActual = fecha;
        document.getElementById('calDiaTitulo').textContent = 'Checkouts del ' + fechaLarga(parseYmd(fecha));
        const body = document.getElementById('calDiaBody');
        body.innerHTML = '<div class="text-center py-4 text-muted">Cargando…</div>';
        modal.show();
        try {
            const r = await fetch('/api/limpieza/calendario/dia?fecha=' + fecha);
            if (!r.ok) throw new Error();
            const lista = await r.json();
            if (lista.length === 0) {
                body.innerHTML = '<div class="text-center py-5 cal-empty-day">Sin checkouts este día.</div>';
                return;
            }
            body.innerHTML = '<div class="cal-dia-list">' + lista.map(renderCheckoutCard).join('') + '</div>';
        } catch (_) {
            body.innerHTML = '<div class="alert alert-danger">No se pudieron cargar los datos.</div>';
        }
    }

    function renderCheckoutCard(r) {
        const imgs = (typeof TIPO_IMAGES !== 'undefined' && TIPO_IMAGES[r.habitacionTipo]) || [];
        const img = imgs[0] || '/images/normal-1.jpg';
        const estadoBadge = badgeEstado(r.estadoLimpieza);

        // Estado del día clicado respecto a hoy
        const tipoDia = compararDiaActual();   // 'pasado' | 'hoy' | 'futuro'

        let temporalBadge;
        if (tipoDia === 'pasado')      temporalBadge = '<span class="cal-pill cal-pill--past">Pasada</span>';
        else if (tipoDia === 'futuro') temporalBadge = '<span class="cal-pill cal-pill--future">Próxima</span>';
        else                           temporalBadge = r.tareaCreada
            ? '<span class="cal-pill cal-pill--in">Tarea creada</span>'
            : '<span class="cal-pill cal-pill--out">Pendiente generar</span>';

        // Solo HOY y sin tarea muestra el botón de generar
        const accionesHtml = (tipoDia === 'hoy' && !r.tareaCreada)
            ? `<div class="cal-dia-actions"><button class="admin-btn" style="background:rgba(255,255,255,0.05); color:var(--c-accent); border:1px solid rgba(201,168,76,0.4);" onclick="generarParaReserva(${r.reservaId})">Generar tarea</button></div>`
            : '';

        return `
            <div class="cal-dia-card">
                <div class="cal-dia-img" style="background-image:url('${img}')"></div>
                <div class="cal-dia-info">
                    <div class="cal-dia-row">
                        <span class="cal-dia-hab">Hab. ${escHtml(r.habitacionNumero)}</span>
                        <span class="cal-dia-tipo">${escHtml(r.habitacionTipo || '')}</span>
                        ${estadoBadge}
                        ${temporalBadge}
                    </div>
                    <div class="cal-dia-cliente">${escHtml(r.clienteNombre || r.clienteEmail || '—')}</div>
                    <div class="cal-dia-fechas">${escHtml(r.fechaEntrada)} → ${escHtml(r.fechaSalida)}</div>
                    ${accionesHtml}
                </div>
            </div>`;
    }

    function compararDiaActual() {
        if (!state.diaActual) return 'hoy';
        const d = parseYmd(state.diaActual);
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        if (d.getTime() < hoy.getTime()) return 'pasado';
        if (d.getTime() > hoy.getTime()) return 'futuro';
        return 'hoy';
    }

    function badgeEstado(e) {
        if (e === 'LIMPIA')        return '<span class="cal-pill cal-pill--in">Limpia</span>';
        if (e === 'EN_LIMPIEZA')   return '<span class="cal-pill cal-pill--stay">En limpieza</span>';
        if (e === 'MANTENIMIENTO') return '<span class="cal-pill cal-pill--out">Mantenimiento</span>';
        return '<span class="cal-pill cal-pill--out">Sucia</span>';
    }

    window.generarParaReserva = async () => {
        // Atajo: como solo hay endpoint de generar TODAS las salidas de hoy, llamamos a ese.
        if (!confirm('Esto creará tareas para todos los checkouts del día actual.\n¿Continuar?')) return;
        try {
            const r = await fetch('/api/limpieza/generar-salidas-hoy', { method: 'POST' });
            if (!r.ok) { alert(await r.text() || 'Error.'); return; }
            const d = await r.json();
            alert(`Se han creado ${d.creadas} tarea(s).`);
            if (state.diaActual) abrirDia(state.diaActual);
        } catch (e) { alert('Error: ' + e.message); }
    };

    // ── Helpers de fecha ──────────────────────────────────────────────────────
    function diasEnMes(a, m) { return new Date(a, m + 1, 0).getDate(); }
    function ymd(a, m, d) { return a + '-' + pad(m + 1) + '-' + pad(d); }
    function parseYmd(s) { const p = s.split('-'); return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])); }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function fechaLarga(d) {
        const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' ' + d.getFullYear();
    }
    function escHtml(s) {
        return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function cargarRango(desde, hasta) {
        if (state.cacheRango && state.cacheRango.key === desde + '|' + hasta) return Promise.resolve(state.cacheRango.data);
        return fetch('/api/limpieza/calendario?desde=' + desde + '&hasta=' + hasta)
            .then(r => r.ok ? r.json() : {})
            .then(d => { state.cacheRango = { key: desde + '|' + hasta, data: d }; return d; });
    }
})();
