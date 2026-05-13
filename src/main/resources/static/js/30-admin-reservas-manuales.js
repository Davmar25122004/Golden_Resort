// ── ADMIN: RESERVAS MANUALES ──────────────────────────────────────────────────

(function () {

    // ── State ──────────────────────────────────────────────────────────────────
    var _state = {
        year: new Date().getFullYear(),
        month: new Date().getMonth(),  // 0-11
        view: 'anual',                 // 'anual' | 'mensual'
        rangeStart: null,   // Date
        rangeEnd:   null,   // Date
        clientes:   [],
        clienteSel: null,   // { id, nombre, email }
        rooms:      [],     // from API
        peticion:   ''
    };

    var ROOM_IMAGES = {
        SUITE:  '/images/suite-1.jpg',
        LUJO:   '/images/Lujo_1.jpg',
        DOBLE:  '/images/doble-1.jpg',
        NORMAL: '/images/normal-1.jpg'
    };

    var TIPO_LABEL = { SUITE: 'Suite', LUJO: 'Lujo', DOBLE: 'Doble', NORMAL: 'Normal' };

    var MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                       'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // ── Entry point ────────────────────────────────────────────────────────────
    window.loadAdminReservasManuales = async function () {
        var body = document.getElementById('admin-tab-body');
        body.innerHTML = _buildShell();
        _attachStyles();
        _renderCalendar();

        try {
            var res = await fetch('/api/admin/usuarios');
            if (res.ok) {
                var todos = await res.json();
                _state.clientes = todos.filter(u => {
                    var roles = u.roles || (u.rol ? [u.rol] : []);
                    return roles.includes('ROLE_CLIENTE') || roles.length === 0;
                });
            }
        } catch (_) {}
    };

    // ── Shell HTML ─────────────────────────────────────────────────────────────
    function _buildShell() {
        return `
<div id="rm-root">
  <div class="rm-header">
    <div>
      <h4 class="rm-title">Reserva manual</h4>
      <p class="rm-subtitle">Selecciona un rango de fechas · elige habitación · asigna al cliente</p>
    </div>
  </div>

  <div class="rm-layout">

    <!-- ── Columna izquierda: Calendario ── -->
    <div class="rm-col-left">
      <div class="rm-card rm-cal-card">
        <div class="rm-cal-view-tabs">
          <button class="rm-cal-tab rm-cal-tab--active" data-view="anual" onclick="rmCalSetView('anual')">Calendario</button>
          <button class="rm-cal-tab" data-view="mensual" onclick="rmCalSetView('mensual')">Mes</button>
        </div>
        <div class="rm-cal-nav">
          <button class="rm-icon-btn" onclick="rmCalPrev()">&#8249;</button>
          <span id="rm-cal-year" class="rm-cal-year-label"></span>
          <button class="rm-icon-btn" onclick="rmCalNext()">&#8250;</button>
        </div>
        <div id="rm-cal-grid" class="rm-cal-grid"></div>
        <div id="rm-range-label" class="rm-range-label">Pulsa un día para iniciar la selección</div>
      </div>
    </div>

    <!-- ── Columna derecha: Disponibilidad + Cliente ── -->
    <div class="rm-col-right">

      <!-- Estado vacío -->
      <div id="rm-right-empty" class="rm-right-empty">
        <div class="rm-right-empty-icon">&#8635;</div>
        <div class="rm-right-empty-txt">Selecciona un rango de fechas en el calendario para ver la disponibilidad de habitaciones</div>
      </div>

      <!-- ─ Availability ─ -->
      <div id="rm-avail-section" class="rm-avail-section d-none">
        <div class="rm-avail-header">
          <span id="rm-avail-title" class="rm-avail-title"></span>
          <button class="rm-clear-btn" onclick="rmClearRange()">✕ Limpiar</button>
        </div>
        <div id="rm-avail-groups"></div>
      </div>

      <!-- ─ Client Search ─ -->
      <div id="rm-cli-section" class="rm-card rm-cli-card d-none">
        <div class="rm-cli-title">Buscar cliente</div>
        <div class="rm-cli-search-wrap">
          <input id="rm-cli-input" type="text" class="rm-cli-input" placeholder="Nombre o email..." autocomplete="off" oninput="rmFiltrarClientes()">
          <div id="rm-cli-dropdown" class="rm-cli-dropdown d-none"></div>
        </div>
        <div id="rm-cli-selected" class="rm-cli-selected d-none"></div>
      </div>

      <!-- ─ Peticion especial + Confirm ─ -->
      <div id="rm-confirm-section" class="rm-card d-none" style="margin-top:0;">
        <label class="rm-label">Petición especial <span style="color:var(--text-muted-custom)">(opcional)</span></label>
        <textarea id="rm-peticion" class="rm-textarea" rows="2" placeholder="Ej: cuna, planta alta, alergias..."></textarea>
        <div style="display:flex;flex-direction:column;gap:.5rem;">
          <button id="rm-btn-guardar" class="rm-btn-ghost" onclick="rmConfirmarReserva(false)">GUARDAR COMO PENDIENTE</button>
          <button id="rm-btn-confirmar" class="rm-btn-gold" onclick="rmConfirmarReserva(true)">✓ CONFIRMAR · PAGAR EN RECEPCIÓN</button>
        </div>
      </div>

      <div id="rm-msg" class="rm-msg d-none"></div>
    </div>

  </div><!-- /.rm-layout -->
</div>`;
    }

    // ── Calendar render ────────────────────────────────────────────────────────
    function _renderCalendar() {
        var label = document.getElementById('rm-cal-year');
        var grid  = document.getElementById('rm-cal-grid');
        grid.innerHTML = '';

        if (_state.view === 'mensual') {
            label.textContent = MONTH_NAMES[_state.month] + ' ' + _state.year;
            grid.className = 'rm-cal-grid rm-cal-grid--mensual';
            grid.appendChild(_buildMonth(_state.month, true));
        } else {
            label.textContent = _state.year;
            grid.className = 'rm-cal-grid';
            for (var m = 0; m < 12; m++) {
                grid.appendChild(_buildMonth(m, false));
            }
        }
        _updateRangeLabel();
    }

    function _buildMonth(monthIdx, large) {
        var year  = _state.year;
        var wrap  = document.createElement('div');
        wrap.className = 'rm-month' + (large ? ' rm-month--lg' : '');

        var title = document.createElement('div');
        title.className = 'rm-month-title';
        title.textContent = MONTH_NAMES[monthIdx];
        wrap.appendChild(title);

        // Day headers
        var hdr = document.createElement('div');
        hdr.className = 'rm-week-hdr';
        ['Lu','Ma','Mi','Ju','Vi','Sá','Do'].forEach(function(d) {
            var s = document.createElement('span'); s.textContent = d; hdr.appendChild(s);
        });
        wrap.appendChild(hdr);

        var daysWrap = document.createElement('div');
        daysWrap.className = 'rm-days';

        // First day of month (0=Sun..6=Sat) → convert to Mon-based
        var firstDay = new Date(year, monthIdx, 1).getDay();
        var offset   = (firstDay + 6) % 7; // Mon=0
        for (var i = 0; i < offset; i++) {
            var blank = document.createElement('span');
            blank.className = 'rm-day rm-day--blank';
            daysWrap.appendChild(blank);
        }

        var daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
        var today = new Date(); today.setHours(0,0,0,0);

        for (var d = 1; d <= daysInMonth; d++) {
            var date = new Date(year, monthIdx, d);
            var cell = document.createElement('span');
            cell.className = 'rm-day';
            cell.textContent = d;
            cell.dataset.date = _isoDate(date);

            var cls = [];
            if (date < today) cls.push('rm-day--past');
            if (date.toDateString() === today.toDateString()) cls.push('rm-day--today');

            if (_state.rangeStart && _state.rangeEnd) {
                var s = _state.rangeStart, e = _state.rangeEnd;
                if (_isoDate(date) === _isoDate(s)) cls.push('rm-day--range-start');
                if (_isoDate(date) === _isoDate(e)) cls.push('rm-day--range-end');
                if (date > s && date < e)            cls.push('rm-day--in-range');
            } else if (_state.rangeStart && _isoDate(date) === _isoDate(_state.rangeStart)) {
                cls.push('rm-day--range-start');
            }

            if (cls.length) cell.className += ' ' + cls.join(' ');

            if (date >= today) {
                cell.style.cursor = 'pointer';
                cell.addEventListener('click', _onDayClick);
            }

            daysWrap.appendChild(cell);
        }

        wrap.appendChild(daysWrap);
        return wrap;
    }

    function _onDayClick(e) {
        var iso = e.currentTarget.dataset.date;
        if (!iso) return;
        var clicked = new Date(iso + 'T00:00:00');

        if (!_state.rangeStart || _state.rangeEnd) {
            // Start fresh
            _state.rangeStart = clicked;
            _state.rangeEnd   = null;
        } else if (clicked <= _state.rangeStart) {
            _state.rangeStart = clicked;
            _state.rangeEnd   = null;
        } else {
            _state.rangeEnd = clicked;
            _loadAvailability();
        }

        _renderCalendar();
    }

    function _updateRangeLabel() {
        var el = document.getElementById('rm-range-label');
        if (!el) return;
        if (_state.rangeStart && _state.rangeEnd) {
            el.textContent = _fmtDate(_state.rangeStart) + '  →  ' + _fmtDate(_state.rangeEnd);
        } else if (_state.rangeStart) {
            el.textContent = _fmtDate(_state.rangeStart) + '  →  selecciona salida';
        } else {
            el.textContent = 'Pulsa un día para iniciar la selección';
        }
    }

    // ── Availability ───────────────────────────────────────────────────────────
    async function _loadAvailability() {
        if (!_state.rangeStart || !_state.rangeEnd) return;

        // Hide empty state, show availability panel
        var emptyEl = document.getElementById('rm-right-empty');
        if (emptyEl) emptyEl.classList.add('d-none');

        var section = document.getElementById('rm-avail-section');
        var groups  = document.getElementById('rm-avail-groups');
        section.classList.remove('d-none');

        var noches = Math.round((_state.rangeEnd - _state.rangeStart) / 86400000);
        document.getElementById('rm-avail-title').textContent =
            _fmtDate(_state.rangeStart) + ' → ' + _fmtDate(_state.rangeEnd) + ' · ' + noches + ' noche' + (noches > 1 ? 's' : '');

        groups.innerHTML = '<div class="rm-loading">Cargando disponibilidad...</div>';

        // Reset client section
        document.getElementById('rm-cli-section').classList.add('d-none');
        document.getElementById('rm-confirm-section').classList.add('d-none');
        _state.clienteSel = null;
        _state.rooms = [];
        _hideMsg();

        try {
            var res = await fetch('/api/admin/habitaciones/disponibilidad?fechaEntrada=' +
                _isoDate(_state.rangeStart) + '&fechaSalida=' + _isoDate(_state.rangeEnd));
            if (!res.ok) throw new Error();
            _state.rooms = await res.json();
        } catch (_) {
            groups.innerHTML = '<div class="rm-error-inline">Error al cargar disponibilidad.</div>';
            return;
        }

        _renderAvailability(noches);
    }

    function _renderAvailability(noches) {
        var groups = document.getElementById('rm-avail-groups');
        groups.innerHTML = '';

        var byType = {};
        _state.rooms.forEach(function(r) {
            if (!byType[r.tipo]) byType[r.tipo] = [];
            byType[r.tipo].push(r);
        });

        var order = ['SUITE', 'LUJO', 'DOBLE', 'NORMAL'];
        order.forEach(function(tipo) {
            var rooms = byType[tipo];
            if (!rooms || !rooms.length) return;

            var section = document.createElement('div');
            section.className = 'rm-tipo-section';

            var avail  = rooms.filter(r => r.disponible).length;
            var header = document.createElement('div');
            header.className = 'rm-tipo-header';
            header.innerHTML = `
                <span class="rm-tipo-name">${TIPO_LABEL[tipo]}</span>
                <span class="rm-tipo-count ${avail > 0 ? 'rm-count--avail' : 'rm-count--full'}">
                    ${avail} disponible${avail !== 1 ? 's' : ''} de ${rooms.length}
                </span>`;
            section.appendChild(header);

            var cards = document.createElement('div');
            cards.className = 'rm-cards';
            rooms.forEach(function(room) {
                cards.appendChild(_buildRoomCard(room, noches));
            });
            section.appendChild(cards);
            groups.appendChild(section);
        });
    }

    function _buildRoomCard(room, noches) {
        var card = document.createElement('div');
        card.className = 'rm-room-card' + (room.disponible ? '' : ' rm-room-card--taken');

        var totalPrice = room.precioNoche ? (room.precioNoche * noches).toFixed(2) : '—';

        if (room.disponible) {
            card.innerHTML = `
                <div class="rm-room-img-wrap">
                    <img src="${ROOM_IMAGES[room.tipo]}" alt="${TIPO_LABEL[room.tipo]}" class="rm-room-img" onerror="this.style.display='none'">
                    <span class="rm-avail-badge rm-avail-badge--free">Libre</span>
                </div>
                <div class="rm-room-info">
                    <div class="rm-room-num">Habitación ${room.numero}</div>
                    <div class="rm-room-price">${room.precioNoche ? room.precioNoche + ' €/noche' : ''}</div>
                    <div class="rm-room-total">${noches} noche${noches !== 1 ? 's' : ''} · <strong>${totalPrice} €</strong></div>
                    <button class="rm-btn-asignar-room" onclick="rmSeleccionarHabitacion(this, ${room.id}, '${room.numero}', '${room.tipo}', '${totalPrice}')">
                        Asignar
                    </button>
                </div>`;
        } else {
            card.innerHTML = `
                <div class="rm-room-img-wrap">
                    <img src="${ROOM_IMAGES[room.tipo]}" alt="${TIPO_LABEL[room.tipo]}" class="rm-room-img rm-room-img--dim" onerror="this.style.display='none'">
                    <span class="rm-avail-badge rm-avail-badge--taken">Ocupada</span>
                </div>
                <div class="rm-room-info">
                    <div class="rm-room-num">Habitación ${room.numero}</div>
                    <div class="rm-room-client">${room.clienteNombre || ''}</div>
                    <div class="rm-room-dates">${_fmtIso(room.reservaEntrada)} → ${_fmtIso(room.reservaSalida)}</div>
                </div>`;
        }

        return card;
    }

    // ── Client search ──────────────────────────────────────────────────────────
    window.rmSeleccionarHabitacion = function(btn, id, numero, tipo, total) {
        // Highlight selected card
        document.querySelectorAll('.rm-btn-asignar-room').forEach(function(b) {
            b.classList.remove('rm-btn--active');
        });
        btn.classList.add('rm-btn--active');

        _state.habitacionSel = { id, numero, tipo, total };

        // Show client search
        var cliSection = document.getElementById('rm-cli-section');
        cliSection.classList.remove('d-none');
        cliSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        document.getElementById('rm-cli-input').focus();
    };

    window.rmFiltrarClientes = function() {
        var q   = (document.getElementById('rm-cli-input').value || '').toLowerCase().trim();
        var dd  = document.getElementById('rm-cli-dropdown');
        if (!q) { dd.classList.add('d-none'); return; }

        var matches = _state.clientes.filter(function(u) {
            return (u.nombre || '').toLowerCase().includes(q) ||
                   (u.email  || '').toLowerCase().includes(q);
        }).slice(0, 8);

        if (!matches.length) {
            dd.innerHTML = '<div class="rm-dd-empty">Sin resultados</div>';
            dd.classList.remove('d-none');
            return;
        }

        dd.innerHTML = matches.map(function(u) {
            var nombre = u.nombre || u.email;
            var initials = nombre.slice(0,2).toUpperCase();
            return `<div class="rm-dd-item" onclick="rmElegirCliente(${u.id}, '${_esc(nombre)}', '${_esc(u.email)}')">
                <span class="rm-dd-avatar">${initials}</span>
                <span class="rm-dd-info">
                    <span class="rm-dd-name">${_esc(nombre)}</span>
                    <span class="rm-dd-email">${_esc(u.email)}</span>
                </span>
            </div>`;
        }).join('');
        dd.classList.remove('d-none');
    };

    window.rmElegirCliente = function(id, nombre, email) {
        _state.clienteSel = { id, nombre, email };

        document.getElementById('rm-cli-input').value = '';
        document.getElementById('rm-cli-dropdown').classList.add('d-none');

        var sel = document.getElementById('rm-cli-selected');
        var initials = nombre.slice(0,2).toUpperCase();
        sel.innerHTML = `
            <div class="rm-sel-client">
                <span class="rm-dd-avatar rm-dd-avatar--lg">${initials}</span>
                <span class="rm-sel-info">
                    <span class="rm-sel-name">${nombre}</span>
                    <span class="rm-sel-email">${email}</span>
                </span>
                <button class="rm-sel-clear" onclick="rmLimpiarCliente()" title="Cambiar cliente">✕</button>
            </div>`;
        sel.classList.remove('d-none');

        document.getElementById('rm-confirm-section').classList.remove('d-none');
    };

    window.rmLimpiarCliente = function() {
        _state.clienteSel = null;
        document.getElementById('rm-cli-selected').classList.add('d-none');
        document.getElementById('rm-confirm-section').classList.add('d-none');
        document.getElementById('rm-cli-input').value = '';
        document.getElementById('rm-cli-dropdown').classList.add('d-none');
    };

    // ── Confirm reservation ────────────────────────────────────────────────────
    window.rmConfirmarReserva = async function(confirmar) {
        _hideMsg();
        if (!_state.clienteSel)        { _showMsg('Selecciona un cliente.',          'error'); return; }
        if (!_state.habitacionSel)     { _showMsg('Selecciona una habitación.',       'error'); return; }
        if (!_state.rangeStart || !_state.rangeEnd) { _showMsg('Selecciona un rango de fechas.', 'error'); return; }

        var btnGuardar   = document.getElementById('rm-btn-guardar');
        var btnConfirmar = document.getElementById('rm-btn-confirmar');
        btnGuardar.disabled   = true;
        btnConfirmar.disabled = true;
        if (confirmar) { btnConfirmar.textContent = 'PROCESANDO...'; }
        else           { btnGuardar.textContent   = 'GUARDANDO...'; }

        var peticion = (document.getElementById('rm-peticion').value || '').trim();

        try {
            var res = await fetch('/api/admin/reservas/manual/habitacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clienteId:        _state.clienteSel.id,
                    habitacionId:     _state.habitacionSel.id,
                    fechaEntrada:     _isoDate(_state.rangeStart),
                    fechaSalida:      _isoDate(_state.rangeEnd),
                    peticionEspecial: peticion || null,
                    confirmar:        confirmar
                })
            });

            if (res.ok) {
                var sufijo = confirmar
                    ? ' · Pagada en recepción ✓'
                    : ' · Guardada como pendiente';
                _showMsg('✓ Reserva para ' + _state.clienteSel.nombre + ' · Hab. ' + _state.habitacionSel.numero + sufijo, 'ok');
                _state.rangeStart    = null;
                _state.rangeEnd      = null;
                _state.clienteSel    = null;
                _state.habitacionSel = null;
                _renderCalendar();
                document.getElementById('rm-avail-section').classList.add('d-none');
                document.getElementById('rm-cli-section').classList.add('d-none');
                document.getElementById('rm-confirm-section').classList.add('d-none');
                document.getElementById('rm-peticion').value = '';
                var emptyEl = document.getElementById('rm-right-empty');
                if (emptyEl) emptyEl.classList.remove('d-none');
            } else {
                var msg = await res.text();
                _showMsg(msg || 'No se pudo crear la reserva.', 'error');
            }
        } catch (_) {
            _showMsg('Error de conexión.', 'error');
        } finally {
            btnGuardar.disabled   = false;
            btnConfirmar.disabled = false;
            btnGuardar.textContent   = 'GUARDAR COMO PENDIENTE';
            btnConfirmar.textContent = '✓ CONFIRMAR · PAGAR EN RECEPCIÓN';
        }
    };

    // ── Clear ──────────────────────────────────────────────────────────────────
    window.rmClearRange = function() {
        _state.rangeStart    = null;
        _state.rangeEnd      = null;
        _state.clienteSel    = null;
        _state.habitacionSel = null;
        _renderCalendar();
        document.getElementById('rm-avail-section').classList.add('d-none');
        document.getElementById('rm-cli-section').classList.add('d-none');
        document.getElementById('rm-confirm-section').classList.add('d-none');
        var emptyEl = document.getElementById('rm-right-empty');
        if (emptyEl) emptyEl.classList.remove('d-none');
        _hideMsg();
    };

    window.rmCalPrev = function() {
        if (_state.view === 'mensual') {
            _state.month--;
            if (_state.month < 0) { _state.month = 11; _state.year--; }
        } else { _state.year--; }
        _renderCalendar();
    };
    window.rmCalNext = function() {
        if (_state.view === 'mensual') {
            _state.month++;
            if (_state.month > 11) { _state.month = 0; _state.year++; }
        } else { _state.year++; }
        _renderCalendar();
    };
    window.rmCalSetView = function(v) {
        _state.view = v;
        document.querySelectorAll('.rm-cal-tab').forEach(function(b) {
            b.classList.toggle('rm-cal-tab--active', b.dataset.view === v);
        });
        _renderCalendar();
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    function _isoDate(d) {
        var m = String(d.getMonth() + 1).padStart(2,'0');
        var day = String(d.getDate()).padStart(2,'0');
        return d.getFullYear() + '-' + m + '-' + day;
    }

    function _fmtDate(d) {
        return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()].slice(0,3) + ' ' + d.getFullYear();
    }

    function _fmtIso(iso) {
        if (!iso) return '—';
        var parts = iso.split('-');
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    function _esc(s) {
        return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function _showMsg(msg, type) {
        var el = document.getElementById('rm-msg');
        el.textContent = msg;
        el.className = 'rm-msg rm-msg--' + type;
        el.classList.remove('d-none');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function _hideMsg() {
        var el = document.getElementById('rm-msg');
        if (el) el.classList.add('d-none');
    }

    // ── Styles ─────────────────────────────────────────────────────────────────
    function _attachStyles() {
        var existing = document.getElementById('rm-styles');
        if (existing) existing.remove(); // always refresh styles
        var s = document.createElement('style');
        s.id = 'rm-styles';
        s.textContent = `
#rm-root { display:flex; flex-direction:column; gap:1rem; padding-bottom:2rem; }

/* Header */
.rm-header { display:flex; align-items:flex-start; }
.rm-title { font-family:'Cormorant Garamond',Georgia,serif; color:#c9a84c; font-size:1.5rem; letter-spacing:1px; margin:0 0 .2rem; }
.rm-subtitle { font-size:.75rem; color:var(--text-muted-custom,#6c757d); letter-spacing:.5px; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* Two-column layout */
.rm-layout { display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:1.25rem; align-items:start; }
@media(max-width:1100px){ .rm-layout{ grid-template-columns:1fr 320px; } }
@media(max-width:820px){ .rm-layout{ grid-template-columns:1fr; } }

.rm-col-left { min-width:0; }
.rm-col-right { display:flex; flex-direction:column; gap:1rem; }

/* Cards */
.rm-card { background:rgba(255,255,255,.03); border:1px solid rgba(201,168,76,.15); border-radius:10px; padding:1.25rem 1.5rem; }
.rm-cal-card { padding:1.25rem; }

/* Empty state */
.rm-right-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; min-height:260px; background:rgba(255,255,255,.02); border:1px dashed rgba(201,168,76,.2); border-radius:10px; padding:2rem; text-align:center; }
.rm-right-empty-icon { font-size:2.5rem; color:rgba(201,168,76,.3); }
.rm-right-empty-txt { font-size:.8rem; color:#6c757d; line-height:1.6; letter-spacing:.3px; }

/* Calendar view tabs */
.rm-cal-view-tabs { display:flex; gap:0; margin-bottom:.75rem; border:1px solid rgba(201,168,76,.2); border-radius:6px; overflow:hidden; }
.rm-cal-tab { flex:1; background:none; border:none; color:#6c757d; font-size:.65rem; letter-spacing:2px; text-transform:uppercase; padding:.45rem .5rem; cursor:pointer; transition:all .2s; }
.rm-cal-tab--active { background:rgba(201,168,76,.15); color:#c9a84c; }
.rm-cal-tab:hover:not(.rm-cal-tab--active) { color:#c8bfa8; }

/* Calendar nav */
.rm-cal-nav { display:flex; align-items:center; justify-content:center; gap:1.5rem; margin-bottom:1rem; }
.rm-cal-year-label { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.3rem; color:#c9a84c; letter-spacing:2px; min-width:60px; text-align:center; }
.rm-icon-btn { background:none; border:1px solid rgba(201,168,76,.3); color:#c9a84c; width:32px; height:32px; border-radius:50%; font-size:1.3rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.rm-icon-btn:hover { background:rgba(201,168,76,.15); }

/* Calendar grid — 3 cols to fit left column */
.rm-cal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; }
@media(max-width:820px){ .rm-cal-grid{ grid-template-columns:repeat(4,1fr); } }
@media(max-width:600px){ .rm-cal-grid{ grid-template-columns:repeat(2,1fr); } }
.rm-cal-grid--mensual { grid-template-columns:1fr !important; }
.rm-month--lg { padding:1rem; }
.rm-month--lg .rm-month-title { font-size:.85rem; margin-bottom:.6rem; }
.rm-month--lg .rm-week-hdr span { font-size:.72rem; }
.rm-month--lg .rm-day { font-size:.88rem; padding:8px 0; }

.rm-month { background:rgba(0,0,0,.2); border:1px solid rgba(201,168,76,.08); border-radius:8px; padding:.6rem .5rem; }
.rm-month-title { text-align:center; font-size:.72rem; letter-spacing:2px; text-transform:uppercase; color:#c9a84c; margin-bottom:.4rem; font-weight:600; }
.rm-week-hdr { display:grid; grid-template-columns:repeat(7,1fr); text-align:center; margin-bottom:.2rem; }
.rm-week-hdr span { font-size:.6rem; color:#6c757d; letter-spacing:.5px; }
.rm-days { display:grid; grid-template-columns:repeat(7,1fr); gap:1px; }

.rm-day { text-align:center; font-size:.7rem; padding:3px 0; border-radius:4px; line-height:1.6; color:#c8bfa8; transition:background .15s,color .15s; user-select:none; }
.rm-day--blank { visibility:hidden; }
.rm-day--past { color:#2e2e2e; cursor:default !important; pointer-events:none; }
.rm-day--today { color:#fff; font-weight:700; outline:1px solid rgba(201,168,76,.5); outline-offset:-1px; border-radius:4px; }
.rm-day:not(.rm-day--past):not(.rm-day--blank):hover { background:rgba(201,168,76,.2); color:#c9a84c; }
.rm-day--range-start, .rm-day--range-end { background:#c9a84c !important; color:#0d0d0d !important; font-weight:700; border-radius:4px; }
.rm-day--in-range { background:rgba(201,168,76,.18); color:#f5f0e8; border-radius:0; }

/* Range label */
.rm-range-label { text-align:center; font-size:.78rem; color:#9a9a9a; margin-top:.75rem; letter-spacing:.5px; padding:.5rem; border-radius:6px; background:rgba(255,255,255,.03); }

/* Availability section */
.rm-avail-section { display:flex; flex-direction:column; gap:.85rem; }
.rm-avail-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.5rem; }
.rm-avail-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:1rem; color:#c9a84c; }
.rm-clear-btn { background:none; border:1px solid rgba(201,168,76,.25); color:#9a9a9a; font-size:.65rem; letter-spacing:1px; padding:.25rem .6rem; border-radius:20px; cursor:pointer; transition:all .2s; }
.rm-clear-btn:hover { border-color:#c9a84c; color:#c9a84c; }

.rm-tipo-section { margin-bottom:.25rem; }
.rm-tipo-header { display:flex; align-items:center; gap:.6rem; margin-bottom:.5rem; padding:.3rem 0; border-bottom:1px solid rgba(201,168,76,.12); }
.rm-tipo-name { font-family:'Cormorant Garamond',Georgia,serif; font-size:1rem; color:#f5f0e8; letter-spacing:1px; }
.rm-tipo-count { font-size:.65rem; letter-spacing:1px; padding:.15rem .5rem; border-radius:20px; }
.rm-count--avail { background:rgba(40,167,69,.15); color:#5cdd7a; border:1px solid rgba(40,167,69,.3); }
.rm-count--full  { background:rgba(201,168,76,.1); color:#9a9a9a; border:1px solid rgba(201,168,76,.2); }

/* Room cards — 1 col on right panel */
.rm-cards { display:grid; grid-template-columns:1fr; gap:.6rem; }
.rm-room-card { background:rgba(255,255,255,.03); border:1px solid rgba(201,168,76,.15); border-radius:10px; overflow:hidden; transition:border-color .2s; display:flex; }
.rm-room-card:hover { border-color:rgba(201,168,76,.4); }
.rm-room-card--taken { opacity:.6; }
.rm-room-img-wrap { position:relative; width:90px; min-width:90px; overflow:hidden; }
.rm-room-img { width:100%; height:100%; object-fit:cover; transition:transform .3s; }
.rm-room-card:hover .rm-room-img { transform:scale(1.05); }
.rm-room-img--dim { filter:brightness(.45) grayscale(.4); }
.rm-avail-badge { position:absolute; top:6px; left:6px; font-size:.55rem; letter-spacing:1px; text-transform:uppercase; padding:.2rem .4rem; border-radius:4px; font-weight:700; }
.rm-avail-badge--free  { background:rgba(40,167,69,.9); color:#fff; }
.rm-avail-badge--taken { background:rgba(100,100,100,.9); color:#fff; }
.rm-room-info { padding:.6rem .75rem; flex:1; display:flex; flex-direction:column; justify-content:center; gap:.15rem; }
.rm-room-num  { font-size:.82rem; color:#f5f0e8; font-weight:600; }
.rm-room-price { font-size:.68rem; color:#9a9a9a; }
.rm-room-total { font-size:.68rem; color:#c8bfa8; }
.rm-room-client { font-size:.72rem; color:#c9a84c; }
.rm-room-dates  { font-size:.65rem; color:#6c757d; }

.rm-btn-asignar-room { margin-top:.4rem; width:100%; background:rgba(201,168,76,.12); border:1px solid rgba(201,168,76,.35); color:#c9a84c; font-size:.65rem; letter-spacing:2px; text-transform:uppercase; padding:.35rem; border-radius:5px; cursor:pointer; transition:all .2s; }
.rm-btn-asignar-room:hover, .rm-btn-asignar-room.rm-btn--active { background:rgba(201,168,76,.25); border-color:#c9a84c; }

/* Client search */
.rm-cli-card { padding:1rem 1.25rem; }
.rm-cli-title { font-size:.72rem; color:#c9a84c; letter-spacing:2px; text-transform:uppercase; margin-bottom:.6rem; }
.rm-cli-search-wrap { position:relative; }
.rm-cli-input { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(201,168,76,.25); border-radius:8px; color:#f5f0e8; font-size:.82rem; padding:.55rem .85rem; outline:none; transition:border-color .2s; box-sizing:border-box; }
.rm-cli-input:focus { border-color:#c9a84c; }
.rm-cli-input::placeholder { color:#555; }
.rm-cli-dropdown { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#1a1a1a; border:1px solid rgba(201,168,76,.25); border-radius:8px; z-index:200; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.5); }
.rm-dd-item { display:flex; align-items:center; gap:.65rem; padding:.55rem .85rem; cursor:pointer; transition:background .15s; }
.rm-dd-item:hover { background:rgba(201,168,76,.1); }
.rm-dd-avatar { width:30px; height:30px; min-width:30px; border-radius:50%; background:rgba(201,168,76,.2); border:1px solid rgba(201,168,76,.35); color:#c9a84c; font-size:.65rem; font-weight:700; display:flex; align-items:center; justify-content:center; }
.rm-dd-avatar--lg { width:36px; height:36px; min-width:36px; font-size:.72rem; }
.rm-dd-info { display:flex; flex-direction:column; gap:.1rem; }
.rm-dd-name  { font-size:.78rem; color:#f5f0e8; }
.rm-dd-email { font-size:.68rem; color:#6c757d; }
.rm-dd-empty { padding:.65rem .85rem; font-size:.75rem; color:#6c757d; text-align:center; }

/* Selected client */
.rm-cli-selected { margin-top:.65rem; }
.rm-sel-client { display:flex; align-items:center; gap:.65rem; background:rgba(201,168,76,.06); border:1px solid rgba(201,168,76,.2); border-radius:8px; padding:.65rem .85rem; }
.rm-sel-info { flex:1; display:flex; flex-direction:column; gap:.1rem; }
.rm-sel-name  { font-size:.8rem; color:#f5f0e8; font-weight:600; }
.rm-sel-email { font-size:.68rem; color:#6c757d; }
.rm-sel-clear { background:none; border:none; color:#6c757d; cursor:pointer; font-size:.95rem; padding:.2rem .35rem; border-radius:4px; transition:color .2s; }
.rm-sel-clear:hover { color:#c9a84c; }

/* Confirm section */
.rm-label { display:block; font-size:.68rem; color:#9a9a9a; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:.45rem; }
.rm-textarea { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(201,168,76,.2); border-radius:8px; color:#f5f0e8; font-size:.82rem; padding:.55rem .85rem; outline:none; resize:vertical; transition:border-color .2s; margin-bottom:.85rem; box-sizing:border-box; }
.rm-textarea:focus { border-color:#c9a84c; }
.rm-btn-ghost { width:100%; background:none; border:1px solid rgba(255,255,255,.1); color:#9a9a9a; font-size:.72rem; letter-spacing:2px; text-transform:uppercase; padding:.7rem; border-radius:8px; cursor:pointer; transition:all .25s; }
.rm-btn-ghost:hover:not(:disabled) { border-color:rgba(255,255,255,.25); color:#f5f0e8; }
.rm-btn-ghost:disabled { opacity:.4; cursor:default; }
.rm-btn-gold { width:100%; background:rgba(201,168,76,.15); border:1px solid rgba(201,168,76,.4); color:#c9a84c; font-size:.72rem; letter-spacing:3px; text-transform:uppercase; padding:.7rem; border-radius:8px; cursor:pointer; transition:all .25s; }
.rm-btn-gold:hover:not(:disabled) { background:rgba(201,168,76,.3); border-color:#c9a84c; }
.rm-btn-gold:disabled { opacity:.5; cursor:default; }

/* Messages */
.rm-msg { border-radius:8px; padding:.65rem .9rem; font-size:.78rem; }
.rm-msg--ok    { background:rgba(40,167,69,.12); border:1px solid rgba(40,167,69,.3); color:#5cdd7a; }
.rm-msg--error { background:rgba(220,53,69,.1); border:1px solid rgba(220,53,69,.25); color:#f07070; }

.rm-loading { padding:1.25rem; text-align:center; color:#6c757d; font-size:.78rem; }
.rm-error-inline { padding:.85rem; color:#f07070; font-size:.78rem; }
        `;
        document.head.appendChild(s);
    }

})();
