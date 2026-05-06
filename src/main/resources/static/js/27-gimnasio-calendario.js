// ── GIMNASIO CALENDARIO ───────────────────────────────────────────────────────
(function () {

    var MESES    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var DIAS_CAB = ['L','M','X','J','V','S','D'];
    var NOMBRES_DIA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

    var state = {
        vista:  'anual',
        anyo:   new Date().getFullYear(),
        mes:    new Date().getMonth(),
        semana: 0
    };
    var _cache = {};

    // ── HELPERS DE FECHA ──────────────────────────────────────────────────────

    function pad(n)          { return n < 10 ? '0' + n : '' + n; }
    function diasEnMes(a, m) { return new Date(a, m + 1, 0).getDate(); }
    function ymd(a, m, d)    { return a + '-' + pad(m + 1) + '-' + pad(d); }

    function toYmd(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function parseYmd(s) {
        var p = s.split('-');
        return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    }

    function fechaCorta(ymdStr) {
        if (!ymdStr) return '—';
        var d = parseYmd(ymdStr);
        return d.getDate() + ' ' + ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function semanasDelMes(a, m) {
        var primer = (new Date(a, m, 1).getDay() + 6) % 7;
        return Math.ceil((primer + diasEnMes(a, m)) / 7);
    }

    function semanaActualDelMes(a, m) {
        var hoy = new Date();
        if (hoy.getFullYear() !== a || hoy.getMonth() !== m) return 0;
        var primer = (new Date(a, m, 1).getDay() + 6) % 7;
        return Math.floor((primer + hoy.getDate() - 1) / 7);
    }

    function rangoDeSemanaDelMes(a, m, sem) {
        var primer = (new Date(a, m, 1).getDay() + 6) % 7;
        var inicio = new Date(a, m, 1 + (sem * 7) - primer);
        var fin    = new Date(inicio.getTime() + 6 * 86400000);
        return { desde: toYmd(inicio), hasta: toYmd(fin) };
    }

    function esHoy(a, m, d) {
        var h = new Date();
        return h.getFullYear() === a && h.getMonth() === m && h.getDate() === d;
    }

    // ── LABEL DEL SELECTOR CONTEXTUAL ────────────────────────────────────────

    function labelCtx() {
        if (state.vista === 'anual') return String(state.anyo);
        if (state.vista === 'mensual') return MESES[state.mes].toUpperCase() + ' ' + state.anyo;
        var rango = rangoDeSemanaDelMes(state.anyo, state.mes, state.semana);
        return 'Sem. ' + (state.semana + 1) + ' · ' + fechaCorta(rango.desde) + ' → ' + fechaCorta(rango.hasta);
    }

    // ── HTTP ─────────────────────────────────────────────────────────────────

    async function cargarRango(desde, hasta) {
        var key = desde + '_' + hasta;
        if (_cache[key]) return _cache[key];
        try {
            var r = await fetch('/api/gimnasio/calendario?from=' + desde + '&to=' + hasta);
            if (!r.ok) return {};
            var arr = await r.json();
            var map = {};
            arr.forEach(function (d) { map[d.fecha] = d; });
            _cache[key] = map;
            return map;
        } catch (_) { return {}; }
    }

    // ── GRID COLOR ────────────────────────────────────────────────────────────

    function colorBadge(info) {
        if (info && info.conGimnasio) return '#58c4dc';
        return '#c9a84c';
    }

    // ── GRID DE UN MES ────────────────────────────────────────────────────────

    function renderGridMes(a, m, conteos, lg) {
        var primer = (new Date(a, m, 1).getDay() + 6) % 7;
        var dias   = diasEnMes(a, m);
        var html   = '<div class="cal-grid' + (lg ? ' cal-grid--lg' : '') + '">';

        DIAS_CAB.forEach(function (d) {
            html += '<div class="cal-cabecera">' + d + '</div>';
        });
        for (var i = 0; i < primer; i++) {
            html += '<div class="cal-celda cal-celda--vacia"></div>';
        }
        for (var d = 1; d <= dias; d++) {
            var f    = ymd(a, m, d);
            var info = conteos[f];
            var n    = info ? info.reservas : 0;

            var cls = 'cal-celda';
            if (n > 0) cls += ' cal-celda--con-reservas';
            if (info && info.conGimnasio) cls += ' cal-celda--gimnasio';
            if (esHoy(a, m, d)) cls += ' cal-celda--hoy';

            var badge = n > 0
                ? '<span class="cal-celda-badge" style="background:' + colorBadge(info) + ';">' + n + '</span>'
                : '';
            var dataAttrs = info
                ? ' data-reservas="' + n + '" data-gimnasio="' + (info.conGimnasio ? 'true' : 'false') + '"'
                : '';

            html += '<button type="button" class="' + cls + '" data-day="' + f + '"' + dataAttrs + '>'
                  + '<span class="cal-celda-num">' + d + '</span>'
                  + badge
                  + '</button>';
        }
        return html + '</div>';
    }

    function attachGridClicks(root) {
        root.querySelectorAll('[data-day]').forEach(function (el) {
            if (el.classList.contains('cal-sem-dia')) return; // semanal tiene su propio handler
            el.addEventListener('click', function () {
                if (!el.dataset.reservas) return;
                gimDiaDetalle(el.dataset.day);
            });
        });
    }

    // ── VISTA SEMANAL ─────────────────────────────────────────────────────────

    function renderSemanal(content, conteos) {
        var rango  = rangoDeSemanaDelMes(state.anyo, state.mes, state.semana);
        var fechas = [];
        var cur    = parseYmd(rango.desde);
        var fin    = parseYmd(rango.hasta);
        while (cur <= fin) { fechas.push(toYmd(cur)); cur = new Date(cur.getTime() + 86400000); }

        Promise.all(fechas.map(function (fecha) {
            return fetch('/api/gimnasio/calendario/dia?fecha=' + fecha)
                .then(function (r) { return r.ok ? r.json() : []; })
                .then(function (j) { return { fecha: fecha, reservas: j }; });
        })).then(function (resultados) {
            var html = '<div class="cal-semanal-card">'
                + '<div class="cal-mensual-header">Semana ' + (state.semana + 1)
                + ' · ' + capitalize(MESES[state.mes].toLowerCase()) + ' ' + state.anyo + '</div>'
                + '<div class="cal-semanal-list">';

            resultados.forEach(function (item) {
                var fechaObj = parseYmd(item.fecha);
                var dow = (fechaObj.getDay() + 6) % 7;
                var num = conteos[item.fecha] ? conteos[item.fecha].reservas : 0;
                var esHoyDia = esHoy(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate());
                var conGim = conteos[item.fecha] && conteos[item.fecha].conGimnasio;

                var reservasHtml = '';
                if (item.reservas.length === 0) {
                    reservasHtml = '<div class="cal-sem-empty">Sin reservas</div>';
                } else {
                    reservasHtml = item.reservas.map(function (r) {
                        var gymPill = r.conGimnasio
                            ? '<span style="display:inline-flex;align-items:center;gap:3px;vertical-align:middle;'
                              + 'background:rgba(88,196,220,0.15);color:#58c4dc;border:1px solid rgba(88,196,220,0.3);'
                              + 'border-radius:4px;padding:0px 6px;font-size:0.68rem;font-weight:600;">'
                              + GYM_SVG_SM + 'GYM</span>'
                            : '';
                        return '<div class="cal-sem-reserva">'
                            + '<span class="cal-sem-hab">Hab. ' + escHtml(r.habitacionNumero || '—') + '</span>'
                            + '<span class="cal-sem-tipo">' + escHtml(({ NORMAL:'Normal',DOBLE:'Doble',SUITE:'Suite',LUJO:'Lujo' }[r.habitacionTipo] || r.habitacionTipo)) + '</span>'
                            + '<span class="cal-sem-cliente">' + escHtml(r.clienteNombre || r.clienteEmail || '—') + '</span>'
                            + pillReserva(r)
                            + gymPill
                            + '</div>';
                    }).join('');
                }

                var diaStyle = esHoyDia ? ' style="outline:2px solid rgba(255,255,255,0.25);outline-offset:-2px;"' : '';
                var gimBorder = conGim ? ' style="border-left:3px solid #58c4dc;"' : '';

                html += '<div class="cal-sem-dia" data-day="' + item.fecha + '"' + (conGim ? ' style="border-left:3px solid rgba(88,196,220,0.5);"' : '') + '>'
                    + '<div class="cal-sem-cabecera"' + (esHoyDia ? ' style="background:rgba(255,255,255,0.07);border-radius:6px;"' : '') + '>'
                    + '<span class="cal-sem-num">' + fechaObj.getDate() + '</span>'
                    + '<span class="cal-sem-nombre">' + NOMBRES_DIA[dow] + '</span>'
                    + '<span class="cal-sem-count">' + num + ' reserva' + (num === 1 ? '' : 's') + '</span>'
                    + '</div>'
                    + '<div class="cal-sem-reservas">' + reservasHtml + '</div>'
                    + '</div>';
            });

            html += '</div></div>';
            content.innerHTML = html;

            content.querySelectorAll('.cal-sem-dia').forEach(function (el) {
                el.addEventListener('click', function () {
                    gimDiaDetalle(el.dataset.day);
                });
            });
        });
    }

    // ── RENDER GENERAL ────────────────────────────────────────────────────────

    async function renderizar() {
        var content = document.getElementById('cal-content');
        var label   = document.getElementById('cal-context-label');
        if (!content) return;

        content.innerHTML = '<div class="cal-loading">Cargando…</div>';
        if (label) label.textContent = labelCtx();

        if (state.vista === 'anual') {
            var desde   = ymd(state.anyo, 0, 1);
            var hasta   = ymd(state.anyo, 11, 31);
            var conteos = await cargarRango(desde, hasta);
            var html = '<div class="cal-anual-grid">';
            for (var m = 0; m < 12; m++) {
                html += '<div class="cal-mes-card">'
                      + '<div class="cal-mes-header">' + MESES[m] + '</div>'
                      + renderGridMes(state.anyo, m, conteos, false)
                      + '</div>';
            }
            html += '</div>';
            content.innerHTML = html;
            attachGridClicks(content);

        } else if (state.vista === 'mensual') {
            var totalDias = diasEnMes(state.anyo, state.mes);
            var desde     = ymd(state.anyo, state.mes, 1);
            var hasta     = ymd(state.anyo, state.mes, totalDias);
            var conteos   = await cargarRango(desde, hasta);
            content.innerHTML = '<div class="cal-mensual-card">'
                + '<div class="cal-mensual-header">' + MESES[state.mes] + ' ' + state.anyo + '</div>'
                + renderGridMes(state.anyo, state.mes, conteos, true)
                + '</div>';
            attachGridClicks(content);

        } else {
            var rango   = rangoDeSemanaDelMes(state.anyo, state.mes, state.semana);
            var conteos = await cargarRango(rango.desde, rango.hasta);
            renderSemanal(content, conteos);
        }
    }

    // ── HELPERS DE RENDER ─────────────────────────────────────────────────────

    function escHtml(s) {
        return (s == null ? '' : String(s))
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function fechaLargaLabel(fecha) {
        var d = parseYmd(fecha);
        var dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        return 'Reservas del ' + dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' ' + d.getFullYear();
    }

    function pillReserva(r) {
        var hoy = new Date(); hoy.setHours(0,0,0,0);
        var entrada = parseYmd(r.fechaEntrada);
        var salida  = parseYmd(r.fechaSalida);
        if (salida.getTime()  < hoy.getTime()) return '<span class="cal-pill cal-pill--past">Pasada</span>';
        if (entrada.getTime() > hoy.getTime()) return '<span class="cal-pill cal-pill--future">Próxima</span>';
        if (r.checkIn) return '<span class="cal-pill cal-pill--in">Check-in</span>';
        return '<span class="cal-pill cal-pill--stay">En estancia</span>';
    }

    function imgPorTipo(tipo) {
        var imgs = (typeof TIPO_IMAGES !== 'undefined' && TIPO_IMAGES[tipo]) || [];
        return imgs[0] || '/images/normal-1.jpg';
    }

    var GYM_SVG_SM = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:2px;">'
        + '<path d="M14.4 14.4 9.6 9.6"/>'
        + '<path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>'
        + '<path d="m21.5 21.5-1.4-1.4"/>'
        + '<path d="M3.9 3.9 2.5 2.5"/>'
        + '<path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>'
        + '</svg>';

    var GYM_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">'
        + '<path d="M14.4 14.4 9.6 9.6"/>'
        + '<path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>'
        + '<path d="m21.5 21.5-1.4-1.4"/>'
        + '<path d="M3.9 3.9 2.5 2.5"/>'
        + '<path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>'
        + '</svg>';

    function renderReservaCard(r) {
        var img      = imgPorTipo(r.habitacionTipo);
        var badge    = pillReserva(r);
        var tipoLabel = { NORMAL:'Normal', DOBLE:'Doble', SUITE:'Suite', LUJO:'Lujo' }[r.habitacionTipo] || r.habitacionTipo;
        var checkin  = (window.HOTEL_INFO && window.HOTEL_INFO.checkinTime)  || '15:00';
        var checkout = (window.HOTEL_INFO && window.HOTEL_INFO.checkoutTime) || '11:00';

        var emailHtml = (r.clienteEmail && r.clienteEmail !== r.clienteNombre)
            ? '<div class="cal-dia-extra-line cal-dia-extra-line--email">' + escHtml(r.clienteEmail) + '</div>'
            : '';

        var serviciosHtml = '';
        if (r.servicios && r.servicios.length > 0) {
            serviciosHtml = '<div class="cal-dia-extra-line"><span class="cal-dia-extra-key">Servicios:</span> '
                + r.servicios.map(function (s) {
                    if (s.esGimnasio) {
                        return '<span style="display:inline-flex;align-items:center;gap:4px;vertical-align:middle;'
                            + 'background:linear-gradient(135deg,rgba(88,196,220,0.18),rgba(88,196,220,0.08));'
                            + 'color:#58c4dc;border:1px solid rgba(88,196,220,0.3);border-radius:6px;'
                            + 'padding:1px 8px 1px 6px;font-weight:600;font-size:0.85em;">'
                            + GYM_SVG + escHtml(s.nombre)
                            + (s.cantidad > 1 ? ' ×' + s.cantidad : '')
                            + '</span>';
                    }
                    return escHtml(s.nombre) + (s.cantidad > 1 ? ' ×' + s.cantidad : '');
                }).join(', ')
                + '</div>';
        }

        var peticionHtml = r.peticionEspecial
            ? '<div class="cal-dia-peticion">'
              + '<svg class="cal-dia-peticion-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
              + '<span class="cal-dia-peticion-key">Petición:</span> ' + escHtml(r.peticionEspecial)
              + '</div>'
            : '';

        return '<div class="cal-dia-card">'
            + '<div class="cal-dia-img" style="background-image:url(\'' + img + '\')"></div>'
            + '<div class="cal-dia-info">'
            +   '<div class="cal-dia-row">'
            +     '<span class="cal-dia-hab">Hab. ' + escHtml(r.habitacionNumero || '—') + '</span>'
            +     '<span class="cal-dia-tipo">' + escHtml(tipoLabel) + '</span>'
            +     badge
            +   '</div>'
            +   '<div class="cal-dia-cliente">' + escHtml(r.clienteNombre || r.clienteEmail || '—') + '</div>'
            +   emailHtml
            +   '<div class="cal-dia-fechas">'
            +     fechaCorta(r.fechaEntrada) + ' <span class="cal-dia-hora">' + checkin  + 'h</span>'
            +     ' → '
            +     fechaCorta(r.fechaSalida)  + ' <span class="cal-dia-hora">' + checkout + 'h</span>'
            +   '</div>'
            +   serviciosHtml
            +   peticionHtml
            + '</div>'
            + '</div>';
    }

    // ── MODAL DE DETALLE ─────────────────────────────────────────────────────

    window.gimDiaDetalle = async function (fecha) {
        var titulo = document.getElementById('calDiaTitulo');
        var body   = document.getElementById('calDiaBody');
        if (titulo) titulo.textContent = fechaLargaLabel(fecha);
        if (body) body.innerHTML = '<div class="text-center py-4 text-muted">Cargando…</div>';

        var modal = document.getElementById('calDiaModal');
        if (modal && window.bootstrap) new bootstrap.Modal(modal).show();

        try {
            var r = await fetch('/api/gimnasio/calendario/dia?fecha=' + fecha);
            if (!r.ok) throw new Error();
            var reservas = await r.json();
            if (!body) return;

            if (reservas.length === 0) {
                body.innerHTML = '<div class="text-center py-5 cal-empty-day">Sin reservas para este día.</div>';
                return;
            }
            body.innerHTML = '<div class="cal-dia-list">' + reservas.map(renderReservaCard).join('') + '</div>';

        } catch (e) {
            if (body) body.innerHTML = '<div class="alert alert-danger">No se pudieron cargar las reservas.</div>';
        }
    };

    // ── EVENTOS ───────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.cal-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.cal-tab').forEach(function (b) { b.classList.remove('cal-tab--active'); });
                btn.classList.add('cal-tab--active');
                state.vista = btn.dataset.view;
                if (state.vista === 'semanal') {
                    state.semana = semanaActualDelMes(state.anyo, state.mes);
                }
                _cache = {};
                renderizar();
            });
        });

        var prev = document.getElementById('cal-prev');
        var next = document.getElementById('cal-next');

        if (prev) prev.addEventListener('click', function () {
            if (state.vista === 'anual') {
                state.anyo--;
            } else if (state.vista === 'mensual') {
                state.mes--; if (state.mes < 0) { state.mes = 11; state.anyo--; }
            } else {
                var total = semanasDelMes(state.anyo, state.mes);
                state.semana--;
                if (state.semana < 0) {
                    state.mes--;
                    if (state.mes < 0) { state.mes = 11; state.anyo--; }
                    state.semana = semanasDelMes(state.anyo, state.mes) - 1;
                }
            }
            _cache = {};
            renderizar();
        });

        if (next) next.addEventListener('click', function () {
            if (state.vista === 'anual') {
                state.anyo++;
            } else if (state.vista === 'mensual') {
                state.mes++; if (state.mes > 11) { state.mes = 0; state.anyo++; }
            } else {
                var total = semanasDelMes(state.anyo, state.mes);
                state.semana++;
                if (state.semana >= total) {
                    state.mes++;
                    if (state.mes > 11) { state.mes = 0; state.anyo++; }
                    state.semana = 0;
                }
            }
            _cache = {};
            renderizar();
        });

        renderizar();
    });

})();
