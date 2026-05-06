// ── ADMIN · DETALLE DE EMPLEADO ───────────────────────────────────────────────
// Modal premium con info del usuario/empleado + calendario de cuadrante (anual,
// mensual, semanal). Click en un día permite override del perfil de jornada.
(function () {

    var MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var DIAS_CAB   = ['L','M','X','J','V','S','D'];
    var NOMBRES_DIA= ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

    var _state = null;
    var _perfiles = [];
    var _planes = [];

    function pad(n){ return n<10?'0'+n:''+n; }
    function diasEnMes(a,m){ return new Date(a,m+1,0).getDate(); }
    function ymd(a,m,d){ return a+'-'+pad(m+1)+'-'+pad(d); }
    function parseYmd(s){ var p=s.split('-'); return new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2])); }
    function toYmd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
    function semanasDelMes(a,m){ var p=(new Date(a,m,1).getDay()+6)%7; return Math.ceil((p+diasEnMes(a,m))/7); }
    function semanaActualDelMes(a,m){ var h=new Date(); if(h.getFullYear()!==a||h.getMonth()!==m) return 0; var p=(new Date(a,m,1).getDay()+6)%7; return Math.floor((p+h.getDate()-1)/7); }
    function rangoSemana(a,m,sem){ var p=(new Date(a,m,1).getDay()+6)%7; var ini=new Date(a,m,1+(sem*7)-p); var fin=new Date(ini.getTime()+6*86400000); return { desde:toYmd(ini), hasta:toYmd(fin) }; }
    function escHtml(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function fechaLarga(s){ var d=parseYmd(s); return NOMBRES_DIA[(d.getDay()+6)%7]+', '+d.getDate()+' de '+MESES_FULL[d.getMonth()].toLowerCase()+' de '+d.getFullYear(); }

    // ── ENTRADA PRINCIPAL ────────────────────────────────────────────────────
    window.adminAbrirDetalleUsuario = async function (userId) {
        var old = document.getElementById('aud-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'aud-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(4px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;animation:audFadeIn .18s ease-out;';
        overlay.innerHTML = '<div style="color:#c9a84c;font-size:0.85rem;letter-spacing:0.2em;">CARGANDO…</div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) cerrarDetalle(); });

        try {
            var [resDet, resPerf, resPlan] = await Promise.all([
                fetch('/api/admin/usuarios/' + userId + '/detalle'),
                fetch('/api/perfiles-turno'),
                fetch('/api/planes-turno')
            ]);
            if (!resDet.ok) { overlay.innerHTML = '<div style="color:#e74c3c;">No se pudo cargar el detalle.</div>'; return; }
            var data = await resDet.json();
            _perfiles = resPerf.ok ? await resPerf.json() : [];
            _planes   = resPlan.ok ? await resPlan.json() : [];

            _state = {
                userId:    userId,
                usuario:   data.usuario,
                empleado:  data.empleado || null,
                vista:     'anual',
                anyo:      new Date().getFullYear(),
                mes:       new Date().getMonth(),
                semana:    semanaActualDelMes(new Date().getFullYear(), new Date().getMonth()),
                cacheCal:  {}
            };

            overlay.innerHTML = renderModal();
            attachHandlers();
            renderCalendario();
        } catch (_) {
            overlay.innerHTML = '<div style="color:#e74c3c;">Error de conexión.</div>';
        }
    };

    function cerrarDetalle() {
        var ov = document.getElementById('aud-overlay');
        if (ov) ov.remove();
        _state = null;
    }
    window.audCerrar = cerrarDetalle;

    // ── HEADER + BODY ────────────────────────────────────────────────────────
    function renderModal() {
        var u = _state.usuario;
        var e = _state.empleado;
        var roles = u.roles || [];
        var initials = (u.nombre || u.email || '?').trim().split(/\s+/).map(function(p){return p[0];}).slice(0,2).join('').toUpperCase();
        var rolesHtml = roles.length === 0
            ? '<span class="admin-badge admin-badge--muted">SIN ROL</span>'
            : roles.map(function(r){
                var lbl = window.ENUMS && ENUMS.rolLabel ? ENUMS.rolLabel(r) : r.replace(/^ROLE_/,'');
                var cls = window.ENUMS && ENUMS.rolBadgeClass ? ENUMS.rolBadgeClass(r) : '';
                return '<span class="admin-badge ' + cls + '">' + escHtml(lbl) + '</span>';
            }).join(' ');

        var esStaff = roles.some(function(r){ return r !== 'ROLE_CLIENTE'; });

        return [
            '<style>',
                '@keyframes audFadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }',
                '.aud-tab{background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;padding:14px 22px 12px;font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.42);transition:all .15s;font-weight:600;}',
                '.aud-tab:hover{color:rgba(255,255,255,0.7);}',
                '.aud-tab--active{color:#c9a84c;border-bottom-color:#c9a84c;}',
                '.aud-info-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:18px 20px;}',
                '.aud-info-row{display:flex;justify-content:space-between;align-items:flex-start;padding:7px 0;border-bottom:1px dashed rgba(255,255,255,0.05);gap:12px;}',
                '.aud-info-row:last-child{border-bottom:none;}',
                '.aud-info-key{font-size:0.66rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:600;flex-shrink:0;}',
                '.aud-info-val{color:#e8e0c8;font-size:0.83rem;text-align:right;}',
                '.aud-section-title{font-family:Playfair Display,Georgia,serif;color:#c9a84c;font-size:0.82rem;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px;display:flex;align-items:center;gap:10px;}',
                '.aud-section-title::before{content:"";width:4px;height:14px;background:#c9a84c;border-radius:2px;display:inline-block;}',
                '.aud-pill-tab{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.55);font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;padding:6px 14px;border-radius:20px;cursor:pointer;transition:all .15s;font-weight:600;}',
                '.aud-pill-tab:hover{border-color:rgba(201,168,76,0.4);color:#c9a84c;}',
                '.aud-pill-tab--active{background:rgba(201,168,76,0.15);border-color:#c9a84c;color:#c9a84c;}',
                '.aud-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}',
                '.aud-cal-grid--lg{gap:6px;}',
                '.aud-cal-cab{font-size:0.62rem;color:rgba(255,255,255,0.35);text-align:center;padding:6px 0;letter-spacing:0.08em;font-weight:600;}',
                '.aud-cal-cell{height:34px;border:1px solid rgba(255,255,255,0.06);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.55);background:rgba(255,255,255,0.015);position:relative;transition:all .15s;padding:0;overflow:hidden;}',
                '.aud-cal-cell:hover{border-color:#c9a84c;background:rgba(201,168,76,0.08);color:#c9a84c;transform:translateY(-1px);}',
                '.aud-cal-cell--vacia{visibility:hidden;}',
                '.aud-cal-cell--hoy{outline:2px solid rgba(201,168,76,0.7);outline-offset:-2px;color:#c9a84c;font-weight:700;}',
                '.aud-cal-cell--lg{height:auto;min-height:84px;justify-content:flex-start;align-items:flex-start;padding:8px 10px;overflow:visible;}',
                '.aud-cal-cell--libre{background:rgba(231,76,60,0.07);}',
                '.aud-cal-cell--libre .aud-cal-num{color:#e74c3c;}',
                '.aud-cal-cell--libre.aud-cal-cell--lg .aud-cal-perfil{color:#e74c3c;font-weight:700;}',
                '.aud-cal-num{font-weight:600;font-size:0.78rem;line-height:1;}',
                '.aud-cal-dot{width:4px;height:4px;border-radius:50%;margin-top:3px;background:#c9a96e;}',
                '.aud-cal-cell--libre .aud-cal-dot{background:#e74c3c;}',
                '.aud-cal-cell--lg .aud-cal-num{font-size:0.95rem;font-weight:700;color:#e8e0c8;}',
                '.aud-cal-perfil{font-size:0.66rem;letter-spacing:0.03em;color:rgba(255,255,255,0.6);margin-top:6px;text-align:left;width:100%;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
                '.aud-cal-tramos{font-family:Menlo,monospace;color:rgba(201,168,76,0.7);font-size:0.62rem;margin-top:3px;letter-spacing:0;line-height:1.3;}',
                '.aud-cal-cell--override{box-shadow:inset 0 0 0 1.5px rgba(201,168,76,0.55);}',
                '.aud-cal-mini-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px;}',
                '.aud-cal-mini-card-hdr{font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:#c9a84c;text-align:center;margin-bottom:8px;font-weight:700;}',
                '.aud-cal-anual{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}',
                '.aud-mes-grande-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;}',
                '.aud-mes-grande-hdr{font-family:Playfair Display,Georgia,serif;font-size:1rem;letter-spacing:0.16em;text-transform:uppercase;color:#c9a84c;text-align:center;margin-bottom:14px;}',
                '.aud-sem-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;}',
                '.aud-sem-list{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;}',
                '.aud-sem-day{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 12px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;min-height:160px;}',
                '.aud-sem-day:hover{border-color:#c9a84c;transform:translateY(-2px);}',
                '.aud-sem-day--hoy{outline:2px solid rgba(201,168,76,0.6);outline-offset:-2px;}',
                '.aud-sem-day-name{font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:700;}',
                '.aud-sem-day-num{font-family:Playfair Display,Georgia,serif;font-size:1.6rem;color:#c9a84c;line-height:1;margin:6px 0 12px;}',
                '.aud-sem-day-perfil{font-size:0.7rem;color:#e8e0c8;margin-top:auto;line-height:1.3;}',
                '.aud-sem-day-libre .aud-sem-day-perfil{color:#e74c3c;font-weight:700;letter-spacing:0.05em;}',
                '.aud-sem-day-tramos{font-size:0.62rem;color:rgba(255,255,255,0.5);margin-top:4px;font-family:Menlo,monospace;}',
                '.aud-sel{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);color:#fff;font-size:0.82rem;padding:8px 12px;border-radius:6px;cursor:pointer;outline:none;}',
                '.aud-btn{background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.32);color:#c9a84c;cursor:pointer;padding:8px 18px;border-radius:6px;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;transition:all .15s;}',
                '.aud-btn:hover{background:rgba(201,168,76,0.22);border-color:#c9a84c;}',
                '.aud-btn--primary{background:#c9a84c;border-color:#c9a84c;color:#0d1117;}',
                '.aud-btn--primary:hover{background:#d6b75d;}',
                '.aud-btn--danger{background:rgba(192,57,43,0.12);border-color:rgba(231,76,60,0.4);color:#e74c3c;}',
                '.aud-btn--danger:hover{background:rgba(192,57,43,0.22);border-color:#e74c3c;}',
                '.aud-empty{text-align:center;color:rgba(255,255,255,0.35);font-size:0.85rem;padding:40px 20px;font-style:italic;}',
            '</style>',
            '<div style="background:linear-gradient(180deg,#13181f 0%,#0d1117 100%);border:1px solid rgba(201,168,76,0.25);border-radius:14px;width:100%;max-width:1080px;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 30px 90px rgba(0,0,0,0.85);overflow:hidden;">',

                // ── HEADER ───────────────────────────────────────────────
                '<div style="padding:24px 32px 18px;border-bottom:1px solid rgba(201,168,76,0.12);display:flex;align-items:center;justify-content:space-between;gap:18px;flex-shrink:0;background:linear-gradient(180deg,rgba(201,168,76,0.04) 0%,transparent 100%);">',
                    '<div style="display:flex;align-items:center;gap:18px;">',
                        '<div style="width:56px;height:56px;background:linear-gradient(135deg,#c9a84c,#9d7e2e);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0d1117;font-family:Playfair Display,serif;font-size:1.3rem;font-weight:700;letter-spacing:0.04em;box-shadow:0 4px 14px rgba(201,168,76,0.3);">' + initials + '</div>',
                        '<div>',
                            '<div style="font-family:Playfair Display,serif;font-size:1.35rem;letter-spacing:0.02em;color:#f5f0e8;line-height:1.1;">' + escHtml(u.nombre || '—') + (e && e.apellidos ? ' ' + escHtml(e.apellidos) : '') + '</div>',
                            '<div style="font-size:0.78rem;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:0.02em;">' + escHtml(u.email) + '</div>',
                            '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' + rolesHtml + '</div>',
                        '</div>',
                    '</div>',
                    '<button onclick="audCerrar()" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.45);font-size:1.5rem;padding:6px 12px;line-height:1;border-radius:6px;transition:all .15s;" onmouseover="this.style.color=\'#c9a84c\';this.style.background=\'rgba(201,168,76,0.08)\'" onmouseout="this.style.color=\'rgba(255,255,255,0.45)\';this.style.background=\'none\'">✕</button>',
                '</div>',

                // ── TABS (solo si es staff) ─────────────────────────────
                (esStaff ? (
                    '<div style="display:flex;padding:0 32px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;background:rgba(0,0,0,0.2);">' +
                        '<button id="aud-tab-info" class="aud-tab aud-tab--active" onclick="audMostrarTab(\'info\')">Información</button>' +
                        '<button id="aud-tab-cal"  class="aud-tab" onclick="audMostrarTab(\'cal\')">Cuadrante</button>' +
                    '</div>'
                ) : ''),

                // ── BODY ─────────────────────────────────────────────────
                '<div id="aud-body" style="flex:1;overflow-y:auto;padding:24px 32px;">',
                    renderInfoPanel(),
                    (esStaff ? '<div id="aud-panel-cal" style="display:none;">' + renderCalSkeleton() + '</div>' : ''),
                '</div>',

            '</div>'
        ].join('');
    }

    // ── PANEL: INFORMACIÓN ───────────────────────────────────────────────────
    function renderInfoPanel() {
        var u = _state.usuario;
        var e = _state.empleado;
        var roles = u.roles || [];

        function row(k, v) {
            if (v == null || v === '') return '';
            return '<div class="aud-info-row"><span class="aud-info-key">' + k + '</span><span class="aud-info-val">' + escHtml(v) + '</span></div>';
        }

        var esCliente = roles.some(function(r){ return r === 'ROLE_CLIENTE'; });

        var personalHtml;
        if (e) {
            personalHtml = row('Nombre', u.nombre)
                + row('Email', u.email)
                + row('Apellidos', e.apellidos)
                + row('Género', e.genero)
                + row('Fecha de nacimiento', e.fechaNacimiento)
                + row('Lugar de nacimiento', e.lugarNacimiento)
                + row('País', e.pais)
                + row('Documento', (e.tipoDocumento ? e.tipoDocumento + ' · ' : '') + (e.numDocumento || ''))
                + row('Teléfono', e.telefono);
        } else if (esCliente) {
            personalHtml = row('Nombre', u.nombre)
                + row('Email', u.email)
                + row('Fecha de nacimiento', u.fechaNacimiento)
                + row('Documento', (u.tipoDocumento ? u.tipoDocumento + ' · ' : '') + (u.numDocumento || ''))
                + row('Teléfono', (u.telefonoPrefijo ? u.telefonoPrefijo + ' ' : '') + (u.telefono || ''));
        } else {
            personalHtml = '<div class="aud-empty">Este usuario no tiene ficha de empleado asociada.</div>';
        }

        var laboralHtml = e
            ? row('Cargo', e.cargo)
              + row('Departamento', e.departamento || u.departamento)
              + row('Tipo de empleado', e.tipoEmpleado)
              + row('Tipo de contratación', e.tipoContratacion)
              + row('Fecha de contratación', e.fechaContratacion)
              + row('Cuadrante asignado', e.turnoPlanNombre)
            : '';

        var contactoHtml = e
            ? row('Teléfono de casa', e.telefonoCasa)
              + row('Dirección de casa', e.direccionCasa)
              + row('Teléfono de oficina', e.telefonoOficina)
              + row('Dirección de oficina', e.direccionOficina)
            : '';

        var editBtn = e ? (
            '<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">'
          +   '<button class="aud-btn aud-btn--primary" onclick="audAbrirEditar()" style="display:inline-flex;align-items:center;gap:6px;">'
          +     '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
          +     'Editar'
          +   '</button>'
          + '</div>'
        ) : '';

        return '<div id="aud-panel-info">' + editBtn
            + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;">'
            +   '<div>'
            +     '<h3 class="aud-section-title">Datos personales</h3>'
            +     '<div class="aud-info-card">' + personalHtml + '</div>'
            +   '</div>'
            + (e ? (
                '<div>'
            +     '<h3 class="aud-section-title">Información laboral</h3>'
            +     '<div class="aud-info-card">' + (laboralHtml || '<div class="aud-empty">Sin datos.</div>') + '</div>'
            +   '</div>'
            +   (contactoHtml ? (
                '<div style="grid-column:1/-1;">'
            +     '<h3 class="aud-section-title">Contacto adicional</h3>'
            +     '<div class="aud-info-card">' + contactoHtml + '</div>'
            +   '</div>'
              ) : '')
            ) : '')
            + '</div>'
            + '</div>';
    }

    function renderCalSkeleton() {
        var planOpts = '<option value="">— Sin cuadrante —</option>'
            + _planes.map(function(p){ return '<option value="' + p.id + '">' + escHtml(p.nombre) + '</option>'; }).join('');
        var planActual = _state.empleado && _state.empleado.turnoPlanId ? _state.empleado.turnoPlanId : '';
        return [
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:16px;">',
                '<div style="display:flex;gap:6px;">',
                    '<button class="aud-pill-tab aud-pill-tab--active" data-vista="anual"   onclick="audSetVista(\'anual\')">Anual</button>',
                    '<button class="aud-pill-tab"                       data-vista="mensual" onclick="audSetVista(\'mensual\')">Mensual</button>',
                    '<button class="aud-pill-tab"                       data-vista="semanal" onclick="audSetVista(\'semanal\')">Semanal</button>',
                '</div>',
                '<div style="display:flex;align-items:center;gap:8px;">',
                    '<button class="aud-btn" onclick="audNav(-1)" style="padding:6px 14px;">‹</button>',
                    '<span id="aud-ctx-label" style="color:#c9a84c;font-size:0.85rem;letter-spacing:0.1em;font-weight:600;min-width:160px;text-align:center;"></span>',
                    '<button class="aud-btn" onclick="audNav(1)"  style="padding:6px 14px;">›</button>',
                '</div>',
                '<div style="display:flex;align-items:center;gap:10px;">',
                    '<span style="font-size:0.66rem;letter-spacing:0.1em;color:rgba(255,255,255,0.45);text-transform:uppercase;font-weight:600;">Cuadrante</span>',
                    '<select id="aud-plan-sel" class="aud-sel" onchange="audCambiarPlan(this.value)">' + planOpts + '</select>',
                '</div>',
            '</div>',
            '<div id="aud-cal-content" style="min-height:340px;"></div>'
        ].join('');
    }

    function attachHandlers() {
        var sel = document.getElementById('aud-plan-sel');
        if (sel && _state.empleado && _state.empleado.turnoPlanId) sel.value = _state.empleado.turnoPlanId;
    }

    window.audMostrarTab = function (tab) {
        ['info','cal'].forEach(function(t){
            var btn = document.getElementById('aud-tab-' + t);
            if (btn) btn.classList.toggle('aud-tab--active', t === tab);
        });
        var pInfo = document.getElementById('aud-panel-info');
        var pCal  = document.getElementById('aud-panel-cal');
        if (pInfo) pInfo.style.display = tab === 'info' ? '' : 'none';
        if (pCal)  pCal.style.display  = tab === 'cal'  ? '' : 'none';
        if (tab === 'cal') renderCalendario();
    };

    // ── CALENDARIO ───────────────────────────────────────────────────────────
    window.audSetVista = function (v) {
        _state.vista = v;
        document.querySelectorAll('#aud-panel-cal .aud-pill-tab').forEach(function(b){
            b.classList.toggle('aud-pill-tab--active', b.dataset.vista === v);
        });
        if (v === 'semanal') _state.semana = semanaActualDelMes(_state.anyo, _state.mes);
        renderCalendario();
    };

    window.audNav = function (delta) {
        if (_state.vista === 'anual') _state.anyo += delta;
        else if (_state.vista === 'mensual') {
            _state.mes += delta;
            if (_state.mes < 0) { _state.mes = 11; _state.anyo--; }
            if (_state.mes > 11) { _state.mes = 0; _state.anyo++; }
        } else {
            var total = semanasDelMes(_state.anyo, _state.mes);
            _state.semana += delta;
            if (_state.semana < 0) {
                _state.mes--;
                if (_state.mes < 0) { _state.mes = 11; _state.anyo--; }
                _state.semana = semanasDelMes(_state.anyo, _state.mes) - 1;
            } else if (_state.semana >= total) {
                _state.mes++;
                if (_state.mes > 11) { _state.mes = 0; _state.anyo++; }
                _state.semana = 0;
            }
        }
        renderCalendario();
    };

    window.audCambiarPlan = async function (planId) {
        if (!_state.empleado) return;
        try {
            var res = await fetch('/api/empleados/' + _state.empleado.id + '/plan', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId ? parseInt(planId) : null, departamento: _state.empleado.departamento })
            });
            if (!res.ok) throw new Error();
            _state.empleado.turnoPlanId = planId ? parseInt(planId) : null;
            var p = _planes.find(function(x){ return String(x.id) === String(planId); });
            _state.empleado.turnoPlanNombre = p ? p.nombre : null;
            _state.cacheCal = {};
            renderCalendario();
        } catch (_) { alert('No se pudo cambiar el cuadrante.'); }
    };

    async function cargarCalendario(planId, desde, hasta) {
        var key = planId + '_' + desde + '_' + hasta;
        if (_state.cacheCal[key]) return _state.cacheCal[key];
        try {
            var r = await fetch('/api/planes-turno/' + planId + '/calendario?from=' + desde + '&to=' + hasta);
            if (!r.ok) return {};
            var arr = await r.json();
            var map = {};
            arr.forEach(function(d){ map[d.fecha] = d; });
            _state.cacheCal[key] = map;
            return map;
        } catch (_) { return {}; }
    }

    async function renderCalendario() {
        var content = document.getElementById('aud-cal-content');
        var ctxLbl  = document.getElementById('aud-ctx-label');
        if (!content) return;

        var planId = _state.empleado && _state.empleado.turnoPlanId;
        if (!planId) {
            content.innerHTML = '<div class="aud-empty">Asigna un cuadrante para ver el calendario.</div>';
            if (ctxLbl) ctxLbl.textContent = '';
            return;
        }

        if (_state.vista === 'anual')        ctxLbl.textContent = String(_state.anyo);
        else if (_state.vista === 'mensual') ctxLbl.textContent = MESES_FULL[_state.mes].toUpperCase() + ' ' + _state.anyo;
        else                                 ctxLbl.textContent = 'Sem. ' + (_state.semana + 1) + ' · ' + MESES_FULL[_state.mes].toUpperCase() + ' ' + _state.anyo;

        content.innerHTML = '<div class="aud-empty">Cargando…</div>';

        if (_state.vista === 'anual') {
            var cal = await cargarCalendario(planId, ymd(_state.anyo,0,1), ymd(_state.anyo,11,31));
            var html = '<div class="aud-cal-anual">';
            for (var m = 0; m < 12; m++) {
                html += '<div class="aud-cal-mini-card">'
                      + '<div class="aud-cal-mini-card-hdr">' + MESES_FULL[m] + '</div>'
                      + renderGridMes(_state.anyo, m, cal, false)
                      + '</div>';
            }
            html += '</div>';
            content.innerHTML = html;
            attachCellClicks(content);
        } else if (_state.vista === 'mensual') {
            var totalDias = diasEnMes(_state.anyo, _state.mes);
            var cal2 = await cargarCalendario(planId, ymd(_state.anyo,_state.mes,1), ymd(_state.anyo,_state.mes,totalDias));
            content.innerHTML = '<div class="aud-mes-grande-card">'
                + '<div class="aud-mes-grande-hdr">' + MESES_FULL[_state.mes] + ' ' + _state.anyo + '</div>'
                + renderGridMes(_state.anyo, _state.mes, cal2, true)
                + '</div>';
            attachCellClicks(content);
        } else {
            var rango = rangoSemana(_state.anyo, _state.mes, _state.semana);
            var cal3 = await cargarCalendario(planId, rango.desde, rango.hasta);
            renderSemanal(content, cal3, rango);
        }
    }

    function renderGridMes(a, m, cal, lg) {
        var primer = (new Date(a, m, 1).getDay() + 6) % 7;
        var dias   = diasEnMes(a, m);
        var hoy    = new Date();
        var html   = '<div class="aud-cal-grid' + (lg ? ' aud-cal-grid--lg' : '') + '">';
        DIAS_CAB.forEach(function(d){ html += '<div class="aud-cal-cab">' + d + '</div>'; });
        for (var i = 0; i < primer; i++) html += '<div class="aud-cal-cell aud-cal-cell--vacia"></div>';
        for (var d = 1; d <= dias; d++) {
            var f    = ymd(a, m, d);
            var info = cal[f];
            var libre = info && info.libre;
            var perfilNombre = info && info.perfil_nombre ? info.perfil_nombre : '';
            var override = info && info.override;
            var color = info && info.color ? info.color : '#c9a96e';
            var cls = 'aud-cal-cell' + (lg ? ' aud-cal-cell--lg' : '')
                   + (libre ? ' aud-cal-cell--libre' : '')
                   + (override ? ' aud-cal-cell--override' : '')
                   + (a === hoy.getFullYear() && m === hoy.getMonth() && d === hoy.getDate() ? ' aud-cal-cell--hoy' : '');

            var inner;
            if (lg) {
                // Vista mensual: número arriba + perfil + tramos
                var perfilHtml = libre
                    ? '<span class="aud-cal-perfil" style="color:#e74c3c;font-weight:700;letter-spacing:0.08em;">LIBRE</span>'
                    : (perfilNombre ? '<span class="aud-cal-perfil" style="color:' + color + ';">' + escHtml(perfilNombre) + '</span>' : '');
                var tramosHtml = '';
                if (!libre && info && info.slots && info.slots.length > 0) {
                    tramosHtml = '<span class="aud-cal-tramos">'
                              + info.slots.slice(0,2).map(function(s){ return s.from + '–' + s.to; }).join('<br>')
                              + (info.slots.length > 2 ? '<br>+' + (info.slots.length-2) : '')
                              + '</span>';
                }
                inner = '<span class="aud-cal-num">' + d + '</span>' + perfilHtml + tramosHtml;
            } else {
                // Vista anual: solo número + dot de color del perfil (sin texto que se solape)
                var dotHtml = info ? '<span class="aud-cal-dot" style="background:' + (libre ? '#e74c3c' : color) + ';"></span>' : '';
                inner = '<span class="aud-cal-num">' + d + '</span>' + dotHtml;
            }
            var titleAttr = info && perfilNombre ? ' title="' + escHtml(perfilNombre) + (info.slots && info.slots.length > 0 ? ' · ' + info.slots.map(function(s){return s.from+'-'+s.to;}).join(', ') : '') + '"' : (libre ? ' title="Libre"' : '');
            html += '<div class="' + cls + '" data-fecha="' + f + '"' + titleAttr + '>' + inner + '</div>';
        }
        return html + '</div>';
    }

    function renderSemanal(content, cal, rango) {
        var cur = parseYmd(rango.desde);
        var fin = parseYmd(rango.hasta);
        var dates = [];
        while (cur <= fin) { dates.push(toYmd(cur)); cur = new Date(cur.getTime() + 86400000); }

        var html = '<div class="aud-sem-card"><div class="aud-sem-list">';
        dates.forEach(function (f) {
            var d = parseYmd(f);
            var dow = (d.getDay() + 6) % 7;
            var info = cal[f] || {};
            var libre = info.libre;
            var hoy = new Date();
            var esHoy = d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
            var cls = 'aud-sem-day'
                   + (libre ? ' aud-sem-day-libre' : '')
                   + (esHoy ? ' aud-sem-day--hoy' : '')
                   + (info.override ? ' aud-cal-cell--override' : '');
            var tramosHtml = '';
            if (info.slots && info.slots.length > 0 && !libre) {
                tramosHtml = '<div class="aud-sem-day-tramos">'
                    + info.slots.map(function(s){ return (s.from||'') + '–' + (s.to||''); }).join('<br>')
                    + '</div>';
            }
            var perfilColor = info.color || '#e8e0c8';
            html += '<div class="' + cls + '" data-fecha="' + f + '">'
                  + '<div class="aud-sem-day-name">' + NOMBRES_DIA[dow] + '</div>'
                  + '<div class="aud-sem-day-num">' + d.getDate() + '</div>'
                  + '<div class="aud-sem-day-perfil"' + (libre ? '' : ' style="color:' + perfilColor + ';"') + '>' + (libre ? 'LIBRE' : escHtml(info.perfil_nombre || '—')) + '</div>'
                  + tramosHtml
                  + '</div>';
        });
        html += '</div></div>';
        content.innerHTML = html;
        attachCellClicks(content);
    }

    function attachCellClicks(root) {
        root.querySelectorAll('[data-fecha]').forEach(function(el){
            el.addEventListener('click', function(){ audAbrirEditarDia(el.dataset.fecha); });
        });
    }

    // ── EDITAR DÍA ───────────────────────────────────────────────────────────
    window.audAbrirEditarDia = async function (fecha) {
        if (!_state.empleado || !_state.empleado.turnoPlanId) return;
        var planId = _state.empleado.turnoPlanId;

        // Cargar info actual del día + tramos guardados
        var actual = null;
        var tramosGuardados = [];
        try {
            var [rCal, rTram] = await Promise.all([
                fetch('/api/planes-turno/' + planId + '/calendario?from=' + fecha + '&to=' + fecha),
                fetch('/api/planes-turno/' + planId + '/dia/' + fecha + '/tramos')
            ]);
            if (rCal.ok)  { var arr = await rCal.json(); actual = arr[0] || null; }
            if (rTram.ok) { tramosGuardados = await rTram.json() || []; }
        } catch (_) {}

        // Tramos a mostrar: los custom guardados, si no los del perfil actual del día
        var tramosIniciales = [];
        if (tramosGuardados.length > 0) {
            tramosIniciales = tramosGuardados.map(function(t){
                return { from: (t.hora_inicio || t.from || '').substring(0,5), to: (t.hora_fin || t.to || '').substring(0,5) };
            });
        } else if (actual && actual.slots && actual.slots.length > 0) {
            tramosIniciales = actual.slots.map(function(s){ return { from: s.from, to: s.to }; });
        }

        var perfilOpts = '<option value="">— Usar el del cuadrante —</option>'
            + _perfiles.map(function(p){ return '<option value="' + p.id + '"' + (actual && actual.perfil_id === p.id ? ' selected' : '') + '>' + escHtml(p.nombre) + '</option>'; }).join('');
        var libreSel = actual && actual.libre ? 'checked' : '';

        var dlg = document.createElement('div');
        dlg.id = 'aud-edit-dia';
        dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(4px);z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;animation:audFadeIn .15s;';
        dlg.innerHTML = [
            '<style>',
                '#aud-edit-dia .aud-dia-sel{width:100%;background:#1a2030;border:1px solid rgba(255,255,255,0.12);color:#e8e0c8;font-size:0.88rem;padding:10px 14px;border-radius:6px;cursor:pointer;outline:none;color-scheme:dark;appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23c9a84c\' stroke-width=\'2.5\'><polyline points=\'6 9 12 15 18 9\'/></svg>");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;transition:border-color .15s;}',
                '#aud-edit-dia .aud-dia-sel:focus{border-color:#c9a84c;}',
                '#aud-edit-dia .aud-dia-sel option{background:#1a2030;color:#e8e0c8;padding:8px;}',
                '#aud-edit-dia .aud-tramo-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}',
                '#aud-edit-dia .aud-tramo-input{flex:1;background:#1a2030;border:1px solid rgba(255,255,255,0.12);color:#e8e0c8;font-size:0.85rem;padding:8px 12px;border-radius:6px;outline:none;font-family:Menlo,monospace;letter-spacing:0.04em;color-scheme:dark;text-align:center;transition:border-color .15s;}',
                '#aud-edit-dia .aud-tramo-input:focus{border-color:#c9a84c;}',
                '#aud-edit-dia .aud-tramo-arrow{color:rgba(201,168,76,0.55);font-size:0.85rem;flex-shrink:0;}',
                '#aud-edit-dia .aud-tramo-del{background:rgba(192,57,43,0.12);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;cursor:pointer;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.95rem;line-height:1;flex-shrink:0;transition:all .15s;}',
                '#aud-edit-dia .aud-tramo-del:hover{background:rgba(192,57,43,0.22);border-color:#e74c3c;}',
                '#aud-edit-dia .aud-tramo-add{background:rgba(201,168,76,0.08);border:1px dashed rgba(201,168,76,0.4);color:#c9a84c;cursor:pointer;padding:8px 14px;border-radius:6px;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;width:100%;margin-top:4px;transition:all .15s;}',
                '#aud-edit-dia .aud-tramo-add:hover{background:rgba(201,168,76,0.18);border-style:solid;}',
                '#aud-edit-dia .aud-edit-section{padding-top:16px;margin-top:16px;border-top:1px dashed rgba(255,255,255,0.08);}',
                '#aud-edit-dia .aud-edit-section--first{padding-top:0;margin-top:0;border-top:none;}',
                '#aud-edit-dia .aud-edit-label{font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.42);font-weight:700;display:block;margin-bottom:8px;}',
                '#aud-edit-dia .aud-edit-hint{font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:6px;font-style:italic;}',
                '#aud-edit-dia .aud-libre-toggle{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:0.85rem;color:#e8e0c8;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;transition:all .15s;}',
                '#aud-edit-dia .aud-libre-toggle:hover{border-color:rgba(231,76,60,0.4);background:rgba(231,76,60,0.05);}',
                '#aud-edit-dia .aud-libre-toggle input{accent-color:#e74c3c;width:16px;height:16px;cursor:pointer;}',
            '</style>',
            '<div style="background:linear-gradient(180deg,#13181f 0%,#0d1117 100%);border:1px solid rgba(201,168,76,0.3);border-radius:14px;width:100%;max-width:520px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 30px 90px rgba(0,0,0,0.85);overflow:hidden;">',
                '<div style="padding:22px 26px;border-bottom:1px solid rgba(201,168,76,0.14);display:flex;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(180deg,rgba(201,168,76,0.06) 0%,transparent 100%);flex-shrink:0;">',
                    '<div>',
                        '<div style="font-family:Playfair Display,Georgia,serif;font-size:1rem;letter-spacing:0.1em;color:#c9a84c;text-transform:uppercase;">Modificar día</div>',
                        '<div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-top:4px;">' + escHtml(fechaLarga(fecha)) + '</div>',
                    '</div>',
                    '<button onclick="audCerrarDia()" style="background:none;border:none;color:rgba(255,255,255,0.45);cursor:pointer;font-size:1.4rem;padding:6px 12px;line-height:1;border-radius:6px;transition:all .15s;" onmouseover="this.style.color=\'#c9a84c\';this.style.background=\'rgba(201,168,76,0.08)\'" onmouseout="this.style.color=\'rgba(255,255,255,0.45)\';this.style.background=\'none\'">✕</button>',
                '</div>',
                '<div style="flex:1;overflow-y:auto;padding:24px 26px;">',
                    '<div class="aud-edit-section aud-edit-section--first">',
                        '<label class="aud-edit-label">Tipo de jornada</label>',
                        '<select id="aud-dia-perfil" class="aud-dia-sel">' + perfilOpts + '</select>',
                        '<div class="aud-edit-hint">Sustituye temporalmente el perfil del cuadrante para este día.</div>',
                    '</div>',
                    '<div class="aud-edit-section">',
                        '<label class="aud-edit-label">Horario personalizado del día</label>',
                        '<div id="aud-tramos-list"></div>',
                        '<button class="aud-tramo-add" onclick="audAddTramo()">＋ Añadir tramo</button>',
                        '<div class="aud-edit-hint">Si dejas la lista vacía, se usará el horario del tipo de jornada.</div>',
                    '</div>',
                    '<div class="aud-edit-section">',
                        '<label class="aud-libre-toggle">',
                            '<input type="checkbox" id="aud-dia-libre" ' + libreSel + '>',
                            '<span>Marcar como día libre (anula el horario)</span>',
                        '</label>',
                    '</div>',
                    '<div id="aud-dia-err" style="color:#e74c3c;font-size:0.78rem;margin-top:14px;display:none;"></div>',
                '</div>',
                '<div style="padding:16px 26px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(0,0,0,0.25);flex-shrink:0;">',
                    '<button class="aud-btn aud-btn--danger" onclick="audResetearDia(\'' + fecha + '\')">Quitar override</button>',
                    '<div style="display:flex;gap:8px;">',
                        '<button class="aud-btn" onclick="audCerrarDia()">Cancelar</button>',
                        '<button class="aud-btn aud-btn--primary" onclick="audGuardarDia(\'' + fecha + '\')">Guardar</button>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('');
        dlg.addEventListener('click', function(e){ if (e.target === dlg) audCerrarDia(); });
        document.body.appendChild(dlg);

        // Render tramos iniciales
        _audTramos = tramosIniciales.length > 0 ? tramosIniciales : [];
        renderTramosList();

        // Si está marcado libre, deshabilitar tramos
        var chkLibre = document.getElementById('aud-dia-libre');
        if (chkLibre) {
            chkLibre.addEventListener('change', actualizarEstadoLibre);
            actualizarEstadoLibre();
        }
    };

    var _audTramos = [];

    function actualizarEstadoLibre() {
        var libre = document.getElementById('aud-dia-libre').checked;
        var list = document.getElementById('aud-tramos-list');
        var addBtn = document.querySelector('#aud-edit-dia .aud-tramo-add');
        var perfilSel = document.getElementById('aud-dia-perfil');
        if (list)      list.style.opacity = libre ? '0.4' : '1';
        if (list)      list.style.pointerEvents = libre ? 'none' : 'auto';
        if (addBtn)    addBtn.style.opacity = libre ? '0.4' : '1';
        if (addBtn)    addBtn.style.pointerEvents = libre ? 'none' : 'auto';
        if (perfilSel) perfilSel.style.opacity = libre ? '0.4' : '1';
        if (perfilSel) perfilSel.disabled = libre;
    }

    function renderTramosList() {
        var list = document.getElementById('aud-tramos-list');
        if (!list) return;
        if (_audTramos.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:14px;color:rgba(255,255,255,0.35);font-size:0.78rem;font-style:italic;border:1px dashed rgba(255,255,255,0.1);border-radius:6px;margin-bottom:8px;">Sin tramos personalizados</div>';
            return;
        }
        list.innerHTML = _audTramos.map(function(t, i){
            return '<div class="aud-tramo-row">'
                +    '<input type="time" class="aud-tramo-input" value="' + (t.from || '') + '" onchange="audSetTramo(' + i + ',\'from\',this.value)">'
                +    '<span class="aud-tramo-arrow">→</span>'
                +    '<input type="time" class="aud-tramo-input" value="' + (t.to || '') + '" onchange="audSetTramo(' + i + ',\'to\',this.value)">'
                +    '<button class="aud-tramo-del" onclick="audDelTramo(' + i + ')" title="Eliminar tramo">✕</button>'
                + '</div>';
        }).join('');
    }

    window.audAddTramo = function () {
        _audTramos.push({ from: '09:00', to: '13:00' });
        renderTramosList();
    };

    window.audDelTramo = function (i) {
        _audTramos.splice(i, 1);
        renderTramosList();
    };

    window.audSetTramo = function (i, key, val) {
        if (_audTramos[i]) _audTramos[i][key] = val;
    };

    window.audCerrarDia = function () {
        var d = document.getElementById('aud-edit-dia');
        if (d) d.remove();
    };

    window.audGuardarDia = async function (fecha) {
        var planId = _state.empleado.turnoPlanId;
        var sel = document.getElementById('aud-dia-perfil');
        var lib = document.getElementById('aud-dia-libre');
        var err = document.getElementById('aud-dia-err');
        var libre = lib.checked;
        // Si está marcado libre, ignoramos el perfil seleccionado (prioridad: libre)
        var perfilId = libre ? null : (sel.value ? parseInt(sel.value) : null);

        // Validar tramos antes de guardar
        var tramosFiltrados = _audTramos.filter(function(t){ return t.from && t.to; });
        for (var i = 0; i < tramosFiltrados.length; i++) {
            if (tramosFiltrados[i].from >= tramosFiltrados[i].to) {
                if (err) { err.textContent = 'En cada tramo, la hora de inicio debe ser anterior a la de fin.'; err.style.display = 'block'; }
                return;
            }
        }

        try {
            // 1) Guardar perfil/libre
            var res = await fetch('/api/planes-turno/' + planId + '/dia/' + fecha + '/perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ perfil_id: perfilId, libre: libre })
            });
            if (!res.ok) {
                var msg = await res.text();
                if (err) { err.textContent = msg || 'No se pudo guardar.'; err.style.display = 'block'; }
                return;
            }
            // 2) Guardar tramos personalizados (vacío = usar los del perfil)
            var tramosBody = libre ? [] : tramosFiltrados.map(function(t){ return { hora_inicio: t.from, hora_fin: t.to }; });
            var resT = await fetch('/api/planes-turno/' + planId + '/dia/' + fecha + '/tramos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tramos: tramosBody })
            });
            if (!resT.ok) {
                var msgT = await resT.text();
                if (err) { err.textContent = msgT || 'No se pudieron guardar los tramos.'; err.style.display = 'block'; }
                return;
            }
            audCerrarDia();
            _state.cacheCal = {};
            renderCalendario();
        } catch (_) {
            if (err) { err.textContent = 'Error de conexión.'; err.style.display = 'block'; }
        }
    };

    window.audResetearDia = async function (fecha) {
        var planId = _state.empleado.turnoPlanId;
        try {
            await fetch('/api/planes-turno/' + planId + '/dia/' + fecha + '/perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ perfil_id: null, libre: false })
            });
            await fetch('/api/planes-turno/' + planId + '/dia/' + fecha + '/tramos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tramos: [] })
            });
            audCerrarDia();
            _state.cacheCal = {};
            renderCalendario();
        } catch (_) { alert('No se pudo resetear.'); }
    };

    // ── EDITAR EMPLEADO (datos personales / laborales / contacto) ─────────────
    window.audAbrirEditar = function () {
        if (!_state || !_state.empleado) return;
        var u = _state.usuario;
        var e = _state.empleado;
        var dlg = document.createElement('div');
        dlg.id = 'aud-edit-emp';
        dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(4px);z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;animation:audFadeIn .15s;';

        function inp(id, label, type, val) {
            return '<div>'
                + '<label style="font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:700;display:block;margin-bottom:5px;">' + label + '</label>'
                + '<input id="' + id + '" type="' + (type||'text') + '" value="' + escHtml(val || '') + '" '
                + 'style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:0.85rem;padding:9px 12px;border-radius:6px;outline:none;" '
                + 'onfocus="this.style.borderColor=\'rgba(201,168,76,0.5)\'" onblur="this.style.borderColor=\'rgba(255,255,255,0.12)\'">'
                + '</div>';
        }

        dlg.innerHTML = [
            '<div style="background:linear-gradient(180deg,#13181f 0%,#0d1117 100%);border:1px solid rgba(201,168,76,0.3);border-radius:14px;width:100%;max-width:780px;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 30px 90px rgba(0,0,0,0.85);overflow:hidden;">',
                '<div style="padding:22px 28px;border-bottom:1px solid rgba(201,168,76,0.14);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-shrink:0;background:linear-gradient(180deg,rgba(201,168,76,0.06) 0%,transparent 100%);">',
                    '<div>',
                        '<div style="font-family:Playfair Display,Georgia,serif;font-size:1.05rem;letter-spacing:0.1em;color:#c9a84c;text-transform:uppercase;">Editar empleado</div>',
                        '<div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-top:4px;">' + escHtml(u.nombre || '') + ' · ' + escHtml(u.email) + '</div>',
                    '</div>',
                    '<button onclick="audCerrarEditar()" style="background:none;border:none;color:rgba(255,255,255,0.45);cursor:pointer;font-size:1.4rem;padding:6px 12px;line-height:1;border-radius:6px;" onmouseover="this.style.color=\'#c9a84c\'" onmouseout="this.style.color=\'rgba(255,255,255,0.45)\'">✕</button>',
                '</div>',
                '<div style="flex:1;overflow-y:auto;padding:24px 28px;">',
                    '<h4 style="font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(201,168,76,0.7);font-weight:700;margin:0 0 12px;">Datos personales</h4>',
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">',
                        inp('aue-nombre',     'Nombre',        'text', u.nombre),
                        inp('aue-apellidos',  'Apellidos',     'text', e.apellidos),
                        inp('aue-email',      'Email',         'email', u.email),
                        inp('aue-telefono',   'Teléfono',      'tel',  e.telefono),
                        inp('aue-genero',     'Género',        'text', e.genero),
                        inp('aue-fechaNac',   'Fecha de nacimiento', 'date', e.fechaNacimiento),
                        inp('aue-tipoDoc',    'Tipo de documento', 'text', e.tipoDocumento),
                        inp('aue-numDoc',     'Número de documento', 'text', e.numDocumento),
                        inp('aue-lugarNac',   'Lugar de nacimiento', 'text', e.lugarNacimiento),
                        inp('aue-pais',       'País',          'text', e.pais),
                    '</div>',
                    '<h4 style="font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(201,168,76,0.7);font-weight:700;margin:24px 0 12px;">Información laboral</h4>',
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">',
                        inp('aue-cargo',            'Cargo',                 'text', e.cargo),
                        inp('aue-departamento',     'Departamento',          'text', e.departamento),
                        inp('aue-tipoEmpleado',     'Tipo de empleado',      'text', e.tipoEmpleado),
                        inp('aue-tipoContratacion', 'Tipo de contratación',  'text', e.tipoContratacion),
                        inp('aue-fechaCont',        'Fecha de contratación', 'date', e.fechaContratacion),
                    '</div>',
                    '<h4 style="font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(201,168,76,0.7);font-weight:700;margin:24px 0 12px;">Contacto adicional</h4>',
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">',
                        inp('aue-telCasa',     'Teléfono de casa',    'tel',  e.telefonoCasa),
                        inp('aue-dirCasa',     'Dirección de casa',   'text', e.direccionCasa),
                        inp('aue-telOficina',  'Teléfono de oficina', 'tel',  e.telefonoOficina),
                        inp('aue-dirOficina',  'Dirección de oficina','text', e.direccionOficina),
                    '</div>',
                    '<div id="aue-error" style="color:#e74c3c;font-size:0.82rem;margin-top:14px;display:none;"></div>',
                '</div>',
                '<div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:flex-end;gap:10px;background:rgba(0,0,0,0.25);flex-shrink:0;">',
                    '<button class="aud-btn" onclick="audCerrarEditar()">Cancelar</button>',
                    '<button class="aud-btn aud-btn--primary" onclick="audGuardarEdicion()">Guardar cambios</button>',
                '</div>',
            '</div>'
        ].join('');
        dlg.addEventListener('click', function (ev) { if (ev.target === dlg) audCerrarEditar(); });
        document.body.appendChild(dlg);
    };

    window.audCerrarEditar = function () {
        var d = document.getElementById('aud-edit-emp');
        if (d) d.remove();
    };

    window.audGuardarEdicion = async function () {
        var u = _state.usuario;
        var err = document.getElementById('aue-error');
        function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

        var body = {
            nombre:            val('aue-nombre'),
            apellidos:         val('aue-apellidos'),
            email:             val('aue-email'),
            telefono:          val('aue-telefono'),
            genero:            val('aue-genero'),
            fechaNacimiento:   val('aue-fechaNac'),
            tipoDocumento:     val('aue-tipoDoc'),
            numDocumento:      val('aue-numDoc'),
            lugarNacimiento:   val('aue-lugarNac'),
            pais:              val('aue-pais'),
            cargo:             val('aue-cargo'),
            departamento:      val('aue-departamento'),
            tipoEmpleado:      val('aue-tipoEmpleado'),
            tipoContratacion:  val('aue-tipoContratacion'),
            fechaContratacion: val('aue-fechaCont'),
            telefonoCasa:      val('aue-telCasa'),
            direccionCasa:     val('aue-dirCasa'),
            telefonoOficina:   val('aue-telOficina'),
            direccionOficina:  val('aue-dirOficina')
        };

        try {
            var res = await fetch('/api/admin/empleados/' + u.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                var msg = await res.text();
                if (err) { err.textContent = msg || 'No se pudo guardar.'; err.style.display = 'block'; }
                return;
            }
            audCerrarEditar();
            // Recargar el detalle
            adminAbrirDetalleUsuario(u.id);
            if (typeof loadAdminUsuarios === 'function') loadAdminUsuarios();
        } catch (_) {
            if (err) { err.textContent = 'Error de conexión.'; err.style.display = 'block'; }
        }
    };

})();
