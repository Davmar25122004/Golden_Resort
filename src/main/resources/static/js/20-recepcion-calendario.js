// ── CALENDARIO RECEPCIÓN ─────────────────────────────────────────────────────
//
// Tres vistas:
//   - anual:   12 meses como tarjetas, números de día con badge de reservas
//   - mensual: un mes ampliado, mismo formato que anual
//   - semanal: una semana del mes seleccionado, lista de días con desglose
//
// Selector contextual a la derecha cambia según la vista (año / mes / semana).
// Click en un día abre el modal con la lista de reservas de ese día.

(function () {
    'use strict';

    var MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                 'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    var DIAS_CABECERA = ['L','M','X','J','V','S','D']; // semana empieza en lunes

    var state = {
        vista: 'anual',
        anyo:  new Date().getFullYear(),
        mes:   new Date().getMonth(),    // 0-11
        semana: 0,                        // 0-5 dentro del mes
        cacheRango: null,
        diaActual: null,
    };

    var modal = null;

    // ── ARRANQUE ─────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('cal-page')) return;

        modal = new bootstrap.Modal(document.getElementById('calDiaModal'));

        // Tabs de vista
        document.querySelectorAll('.cal-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                cambiarVista(btn.dataset.view);
            });
        });

        document.getElementById('cal-prev').addEventListener('click', navegar.bind(null, -1));
        document.getElementById('cal-next').addEventListener('click', navegar.bind(null, 1));

        render();
    });

    // ── NAVEGACIÓN ───────────────────────────────────────────────────────────

    function cambiarVista(nuevaVista) {
        state.vista = nuevaVista;
        document.querySelectorAll('.cal-tab').forEach(function (btn) {
            btn.classList.toggle('cal-tab--active', btn.dataset.view === nuevaVista);
        });
        // Al pasar a semanal, situarse en la semana actual del mes seleccionado
        if (nuevaVista === 'semanal') {
            state.semana = semanaActualDelMes(state.anyo, state.mes);
        }
        render();
    }

    function navegar(delta) {
        if (state.vista === 'anual') {
            state.anyo += delta;
        } else if (state.vista === 'mensual') {
            state.mes += delta;
            if (state.mes < 0)  { state.mes = 11; state.anyo--; }
            if (state.mes > 11) { state.mes = 0;  state.anyo++; }
        } else if (state.vista === 'semanal') {
            var totalSemanas = semanasDelMes(state.anyo, state.mes);
            state.semana += delta;
            if (state.semana < 0) {
                state.mes--;
                if (state.mes < 0) { state.mes = 11; state.anyo--; }
                state.semana = semanasDelMes(state.anyo, state.mes) - 1;
            } else if (state.semana >= totalSemanas) {
                state.mes++;
                if (state.mes > 11) { state.mes = 0; state.anyo++; }
                state.semana = 0;
            }
        }
        render();
    }

    // ── RENDER GENERAL ───────────────────────────────────────────────────────

    function render() {
        actualizarLabelContexto();
        var content = document.getElementById('cal-content');
        content.innerHTML = '<div class="cal-loading">Cargando…</div>';

        if (state.vista === 'anual')   return renderAnual(content);
        if (state.vista === 'mensual') return renderMensual(content);
        if (state.vista === 'semanal') return renderSemanal(content);
    }

    function actualizarLabelContexto() {
        var label = document.getElementById('cal-context-label');
        if (state.vista === 'anual') {
            label.textContent = state.anyo;
        } else if (state.vista === 'mensual') {
            label.textContent = capitalize(MESES[state.mes].toLowerCase()) + ' ' + state.anyo;
        } else {
            var rango = rangoDeSemanaDelMes(state.anyo, state.mes, state.semana);
            label.textContent = 'Sem. ' + (state.semana + 1) + ' · ' +
                fechaCorta(rango.desde) + ' → ' + fechaCorta(rango.hasta);
        }
    }

    // ── VISTA ANUAL ──────────────────────────────────────────────────────────

    function renderAnual(content) {
        var desde = ymd(state.anyo, 0, 1);
        var hasta = ymd(state.anyo, 11, 31);

        cargarRango(desde, hasta).then(function (conteos) {
            var html = '<div class="cal-anual-grid">';
            for (var m = 0; m < 12; m++) {
                html += '<div class="cal-mes-card">';
                html += '<div class="cal-mes-header">' + MESES[m] + '</div>';
                html += renderGridMes(state.anyo, m, conteos);
                html += '</div>';
            }
            html += '</div>';
            content.innerHTML = html;
            attachDayClickHandlers(content);
        });
    }

    // ── VISTA MENSUAL ────────────────────────────────────────────────────────

    function renderMensual(content) {
        var desde = ymd(state.anyo, state.mes, 1);
        var hasta = ymd(state.anyo, state.mes, diasEnMes(state.anyo, state.mes));

        cargarRango(desde, hasta).then(function (conteos) {
            var html = '<div class="cal-mensual-card">';
            html += '<div class="cal-mensual-header">' + capitalize(MESES[state.mes].toLowerCase()) + ' ' + state.anyo + '</div>';
            html += renderGridMes(state.anyo, state.mes, conteos, true);
            html += '</div>';
            content.innerHTML = html;
            attachDayClickHandlers(content);
        });
    }

    // ── VISTA SEMANAL ────────────────────────────────────────────────────────

    function renderSemanal(content) {
        var rango = rangoDeSemanaDelMes(state.anyo, state.mes, state.semana);

        cargarRango(rango.desde, rango.hasta).then(function (conteos) {
            // Solicitar también el detalle de cada día para mostrar mini-listas
            var fechas = [];
            var d = parseYmd(rango.desde);
            var f = parseYmd(rango.hasta);
            while (d <= f) {
                fechas.push(toYmd(d));
                d = new Date(d.getTime() + 86400000);
            }

            Promise.all(fechas.map(function (fecha) {
                return fetch('/api/recepcion/calendario/dia?fecha=' + fecha)
                    .then(function (r) { return r.ok ? r.json() : []; })
                    .then(function (j) { return { fecha: fecha, reservas: j }; });
            })).then(function (resultados) {
                var html = '<div class="cal-semanal-card">';
                html += '<div class="cal-mensual-header">Semana ' + (state.semana + 1) +
                        ' · ' + capitalize(MESES[state.mes].toLowerCase()) + ' ' + state.anyo + '</div>';
                html += '<div class="cal-semanal-list">';

                resultados.forEach(function (item) {
                    var fechaObj = parseYmd(item.fecha);
                    var nombreDia = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
                    var dow = (fechaObj.getDay() + 6) % 7;
                    var num = conteos[item.fecha] || 0;

                    var reservasHtml = '';
                    if (item.reservas.length === 0) {
                        reservasHtml = '<div class="cal-sem-empty">Sin reservas</div>';
                    } else {
                        reservasHtml = item.reservas.map(function (r) {
                            return '<div class="cal-sem-reserva">' +
                                       '<span class="cal-sem-hab">Hab. ' + escHtml(r.habitacionNumero || '—') + '</span>' +
                                       '<span class="cal-sem-tipo">' + escHtml(r.habitacionTipo || '') + '</span>' +
                                       '<span class="cal-sem-cliente">' + escHtml(r.clienteNombre || r.clienteEmail || '—') + '</span>' +
                                       pillReserva(r) +
                                   '</div>';
                        }).join('');
                    }

                    html += '<div class="cal-sem-dia" data-day="' + item.fecha + '">' +
                                '<div class="cal-sem-cabecera">' +
                                    '<span class="cal-sem-num">' + fechaObj.getDate() + '</span>' +
                                    '<span class="cal-sem-nombre">' + nombreDia[dow] + '</span>' +
                                    '<span class="cal-sem-count">' + num + ' reserva' + (num === 1 ? '' : 's') + '</span>' +
                                '</div>' +
                                '<div class="cal-sem-reservas">' + reservasHtml + '</div>' +
                            '</div>';
                });

                html += '</div></div>';
                content.innerHTML = html;
                attachDayClickHandlers(content);
            });
        });
    }

    // ── GRID DE UN MES (compartido entre anual y mensual) ────────────────────

    function renderGridMes(anyo, mes, conteos, ampliado) {
        var primerDia = (new Date(anyo, mes, 1).getDay() + 6) % 7; // L=0..D=6
        var dias = diasEnMes(anyo, mes);

        var html = '<div class="cal-grid' + (ampliado ? ' cal-grid--lg' : '') + '">';
        DIAS_CABECERA.forEach(function (d) {
            html += '<div class="cal-cabecera">' + d + '</div>';
        });
        for (var i = 0; i < primerDia; i++) html += '<div class="cal-celda cal-celda--vacia"></div>';
        for (var d = 1; d <= dias; d++) {
            var fecha = ymd(anyo, mes, d);
            var n = conteos[fecha] || 0;
            var clase = 'cal-celda';
            if (n > 0) clase += ' cal-celda--con-reservas';
            if (esHoy(anyo, mes, d)) clase += ' cal-celda--hoy';
            html += '<button type="button" class="' + clase + '" data-day="' + fecha + '">' +
                        '<span class="cal-celda-num">' + d + '</span>' +
                        (n > 0 ? '<span class="cal-celda-badge">' + n + '</span>' : '') +
                    '</button>';
        }
        html += '</div>';
        return html;
    }

    // ── CLICK EN DÍA → MODAL ─────────────────────────────────────────────────

    function attachDayClickHandlers(root) {
        root.querySelectorAll('[data-day]').forEach(function (el) {
            el.addEventListener('click', function (ev) {
                ev.stopPropagation();
                abrirDia(el.dataset.day);
            });
        });
    }

    function abrirDia(fecha) {
        state.diaActual = fecha;
        document.getElementById('calDiaTitulo').textContent = 'Reservas del ' + fechaLarga(parseYmd(fecha));
        var body = document.getElementById('calDiaBody');
        body.innerHTML = '<div class="text-center py-4 text-muted">Cargando…</div>';
        modal.show();

        fetch('/api/recepcion/calendario/dia?fecha=' + fecha)
            .then(function (r) {
                if (!r.ok) throw new Error('No se pudo cargar.');
                return r.json();
            })
            .then(function (reservas) {
                if (reservas.length === 0) {
                    body.innerHTML = '<div class="text-center py-5 cal-empty-day">Sin reservas para este día.</div>';
                    return;
                }
                body.innerHTML = '<div class="cal-dia-list">' + reservas.map(renderReservaCard).join('') + '</div>';
            })
            .catch(function () {
                body.innerHTML = '<div class="alert alert-danger">No se pudieron cargar las reservas.</div>';
            });
    }

    function pillReserva(r) {
        if (!r || !r.fechaEntrada || !r.fechaSalida)
            return '<span class="cal-pill cal-pill--stay">—</span>';
        var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        var entrada = parseYmd(r.fechaEntrada);
        var salida  = parseYmd(r.fechaSalida);
        var hT = hoy.getTime(), eT = entrada.getTime(), sT = salida.getTime();

        if (sT < hT) return '<span class="cal-pill cal-pill--past">Pasada</span>';
        if (eT > hT) return '<span class="cal-pill cal-pill--future">Próxima</span>';
        return '<span class="cal-pill cal-pill--stay">En estancia</span>';
    }

    function renderReservaCard(r) {
        var img = imgPorTipo(r.habitacionTipo);
        var badge = pillReserva(r);

        var emailHtml = (r.clienteEmail && r.clienteEmail !== r.clienteNombre)
            ? '<div class="cal-dia-extra-line cal-dia-extra-line--email">' + escHtml(r.clienteEmail) + '</div>'
            : '';

        var serviciosHtml = '';
        if (r.servicios && r.servicios.length > 0) {
            serviciosHtml = '<div class="cal-dia-extra-line cal-dia-servicios"><span class="cal-dia-extra-key">Servicios:</span>'
                + r.servicios.map(function (s) { return '<span class="cal-dia-srv-item">' + escHtml(s.nombre) + (s.cantidad > 1 ? ' ×' + s.cantidad : '') + '</span>'; }).join('')
                + '</div>';
        }

        var rsHtml = '';
        if (r.pedidosRoomService && r.pedidosRoomService.length > 0) {
            rsHtml = '<div class="cal-dia-extra-line"><span class="cal-dia-extra-key">Room service:</span> '
                + r.pedidosRoomService.map(function (p) { return escHtml(p.nombre) + ' ×' + (p.cantidad || 1); }).join(', ')
                + '</div>';
        }

        return '<div class="cal-dia-card">' +
                    '<div class="cal-dia-img" style="background-image:url(\'' + img + '\')"></div>' +
                    '<div class="cal-dia-info">' +
                        '<div class="cal-dia-row">' +
                            '<span class="cal-dia-hab">Hab. ' + escHtml(r.habitacionNumero || '—') + '</span>' +
                            '<span class="cal-dia-tipo">' + escHtml(r.habitacionTipo || '') + '</span>' +
                            badge +
                        '</div>' +
                        '<div class="cal-dia-cliente">' + escHtml(r.clienteNombre || r.clienteEmail || '—') + '</div>' +
                        emailHtml +
                        '<div class="cal-dia-fechas">' +
                            fechaCortaStr(r.fechaEntrada) + ' <span class="cal-dia-hora">' + ((window.HOTEL_INFO && window.HOTEL_INFO.checkinTime) || '15:00') + 'h</span>' +
                            ' → ' +
                            fechaCortaStr(r.fechaSalida)  + ' <span class="cal-dia-hora">' + ((window.HOTEL_INFO && window.HOTEL_INFO.checkoutTime) || '11:00') + 'h</span>' +
                        '</div>' +
                        serviciosHtml +
                        rsHtml +
                        (r.peticionEspecial ? '<div class="cal-dia-peticion">'
                            + '<svg class="cal-dia-peticion-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
                            + '<span class="cal-dia-peticion-key">Petición:</span> '
                            + escHtml(r.peticionEspecial)
                            + '</div>' : '') +
                    '</div>' +
                '</div>';
    }

    // ── HTTP ─────────────────────────────────────────────────────────────────

    function cargarRango(desde, hasta) {
        if (state.cacheRango && state.cacheRango.key === desde + '|' + hasta) {
            return Promise.resolve(state.cacheRango.data);
        }
        return fetch('/api/recepcion/calendario?desde=' + desde + '&hasta=' + hasta)
            .then(function (r) { return r.ok ? r.json() : {}; })
            .then(function (data) {
                state.cacheRango = { key: desde + '|' + hasta, data: data };
                return data;
            });
    }

    // ── HELPERS DE FECHA ─────────────────────────────────────────────────────

    function diasEnMes(anyo, mes) { return new Date(anyo, mes + 1, 0).getDate(); }

    function ymd(anyo, mes, dia) {
        return anyo + '-' + pad(mes + 1) + '-' + pad(dia);
    }

    function toYmd(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function parseYmd(s) {
        var p = s.split('-');
        return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function semanasDelMes(anyo, mes) {
        var primer = (new Date(anyo, mes, 1).getDay() + 6) % 7;
        var dias   = diasEnMes(anyo, mes);
        return Math.ceil((primer + dias) / 7);
    }

    function semanaActualDelMes(anyo, mes) {
        var hoy = new Date();
        if (hoy.getFullYear() !== anyo || hoy.getMonth() !== mes) return 0;
        var primer = (new Date(anyo, mes, 1).getDay() + 6) % 7;
        return Math.floor((primer + hoy.getDate() - 1) / 7);
    }

    function rangoDeSemanaDelMes(anyo, mes, semana) {
        var primer = (new Date(anyo, mes, 1).getDay() + 6) % 7;
        var inicio = new Date(anyo, mes, 1 + (semana * 7) - primer);
        var fin    = new Date(inicio.getTime() + 6 * 86400000);
        return { desde: toYmd(inicio), hasta: toYmd(fin) };
    }

    function esHoy(anyo, mes, dia) {
        var h = new Date();
        return h.getFullYear() === anyo && h.getMonth() === mes && h.getDate() === dia;
    }

    function fechaCorta(ymdStr) {
        var d = parseYmd(ymdStr);
        return d.getDate() + ' ' + ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];
    }

    function fechaCortaStr(ymdStr) {
        if (!ymdStr) return '—';
        return fechaCorta(ymdStr);
    }

    function fechaLarga(d) {
        var dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' ' + d.getFullYear();
    }

    // ── HELPERS GENERALES ────────────────────────────────────────────────────

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function escHtml(s) {
        return (s == null ? '' : String(s))
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function imgPorTipo(tipo) {
        var imgs = (typeof TIPO_IMAGES !== 'undefined' && TIPO_IMAGES[tipo]) || [];
        return imgs[0] || '/images/normal-1.jpg';
    }

})();
