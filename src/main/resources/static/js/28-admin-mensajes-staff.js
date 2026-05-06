// ── ADMIN · BANDEJA DE MENSAJES STAFF ─────────────────────────────────────────
(function () {

    var _convActiva = null;

    function escHtml(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'})[c]); }
    function fmt(s) {
        if (!s) return '';
        try { var d = new Date(s); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+' · '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }
        catch(_) { return s; }
    }
    function rolLabel(rol) {
        var map = {
            'ROLE_RECEPCION':'Recepción','ROLE_LIMPIEZA':'Limpieza',
            'ROLE_GIMNASIO':'Gimnasio','ROLE_SPA':'Spa','ROLE_COCHE':'Coche',
            'ROLE_HOSTELERIA':'Hostelería','ROLE_ROOMSERVICE':'Room Service'
        };
        return map[rol] || rol.replace(/^ROLE_/,'');
    }
    function rolBadgeClass(rol) {
        var map = {
            'ROLE_RECEPCION':'admin-badge--recepcion','ROLE_LIMPIEZA':'admin-badge--limpieza',
            'ROLE_GIMNASIO':'admin-badge--gimnasio','ROLE_SPA':'admin-badge--spa',
            'ROLE_COCHE':'admin-badge--coche','ROLE_HOSTELERIA':'admin-badge--hosteleria',
            'ROLE_ROOMSERVICE':'admin-badge--roomservice'
        };
        return map[rol] || '';
    }

    window.loadAdminMensajesStaff = async function () {
        var body = document.getElementById('admin-tab-body');
        if (!body) return;
        body.innerHTML = '<div style="color:rgba(255,255,255,0.5);padding:20px;">Cargando bandeja…</div>';
        try {
            var r = await fetch('/api/admin/mensajes-staff/conversaciones');
            if (!r.ok) throw new Error();
            var convs = await r.json();
            renderBandeja(body, convs);
        } catch (_) {
            body.innerHTML = '<div style="color:#e74c3c;padding:20px;">No se pudieron cargar las conversaciones.</div>';
        }
    };

    function renderBandeja(body, convs) {
        body.innerHTML = `
            <style>
                .ams-shell { display:grid; grid-template-columns: 360px 1fr; gap:18px; height: calc(100vh - 180px); min-height:520px; }
                .ams-list  { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:12px; overflow-y:auto; }
                .ams-item  { padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.06); cursor:pointer; transition: background .15s; display:flex; flex-direction:column; gap:4px; }
                .ams-item:hover { background:rgba(201,168,76,0.06); }
                .ams-item.active { background:rgba(201,168,76,0.12); border-left:3px solid #c9a84c; padding-left:15px; }
                .ams-item-name { color:#e8e0c8; font-weight:600; font-size:0.92rem; display:flex; align-items:center; gap:8px; }
                .ams-item-meta { color:rgba(255,255,255,0.45); font-size:0.72rem; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
                .ams-item-time { color:rgba(255,255,255,0.4); font-size:0.7rem; }
                .ams-unread { background:#c9a84c; color:#0d1117; font-size:0.62rem; padding:2px 7px; border-radius:10px; font-weight:700; letter-spacing:0.04em; }
                .ams-chat  { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:12px; display:flex; flex-direction:column; overflow:hidden; }
                .ams-chat-empty { display:flex; align-items:center; justify-content:center; flex:1; color:rgba(255,255,255,0.35); font-style:italic; }
                .ams-chat-hdr { padding:18px 22px; border-bottom:1px solid rgba(201,168,76,0.15); background: linear-gradient(180deg,rgba(201,168,76,0.05) 0%,transparent 100%); flex-shrink:0; }
                .ams-msgs  { flex:1; overflow-y:auto; padding:18px 22px; display:flex; flex-direction:column; gap:10px; }
                .ams-input-row { padding:14px 18px; border-top:1px solid rgba(255,255,255,0.06); display:flex; gap:10px; background:rgba(0,0,0,0.2); flex-shrink:0; }
                .ams-input { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); color:#fff; padding:10px 14px; border-radius:8px; font-size:0.88rem; outline:none; }
                .ams-send  { background:#c9a84c; color:#0d1117; border:none; padding:10px 18px; border-radius:8px; font-size:0.78rem; font-weight:700; letter-spacing:0.08em; cursor:pointer; }
                @media (max-width: 900px) { .ams-shell { grid-template-columns: 1fr; height:auto; } }
            </style>
            <div class="ams-shell">
                <div class="ams-list" id="ams-list">${renderLista(convs)}</div>
                <div class="ams-chat" id="ams-chat">
                    <div class="ams-chat-empty">Selecciona una conversación para ver los mensajes.</div>
                </div>
            </div>
        `;
    }

    function renderLista(convs) {
        if (!convs.length) return '<div style="padding:30px 20px;color:rgba(255,255,255,0.35);text-align:center;font-style:italic;">Sin conversaciones todavía.</div>';
        return convs.map(c => {
            var nombreCompleto = (c.nombre || '') + (c.apellidos ? ' ' + c.apellidos : '');
            var unread = c.noLeidos > 0 ? `<span class="ams-unread">${c.noLeidos}</span>` : '';
            var rolBadge = c.rol ? `<span class="admin-badge ${rolBadgeClass(c.rol)}" style="font-size:0.6rem;padding:2px 8px;">${rolLabel(c.rol)}</span>` : '';
            var docTexto = '';
            if (c.numDocumento) {
                docTexto = (c.tipoDocumento ? escHtml(c.tipoDocumento) + ' · ' : '') + escHtml(c.numDocumento);
            }
            return `<div class="ams-item" data-conv-id="${c.conversacionId}" onclick="amsSeleccionar(${c.conversacionId}, this)">
                        <div class="ams-item-name">${escHtml(nombreCompleto || '—')} ${unread}</div>
                        <div class="ams-item-meta">${rolBadge} ${docTexto ? '<span>' + docTexto + '</span>' : ''}</div>
                        <div class="ams-item-time">${c.ultimoMensajeEn ? 'Último: ' + fmt(c.ultimoMensajeEn) : 'Sin mensajes'}</div>
                    </div>`;
        }).join('');
    }

    window.amsSeleccionar = async function (convId, itemEl) {
        document.querySelectorAll('.ams-item').forEach(i => i.classList.remove('active'));
        if (itemEl) itemEl.classList.add('active');
        _convActiva = convId;

        var chat = document.getElementById('ams-chat');
        chat.innerHTML = '<div class="ams-chat-empty">Cargando…</div>';
        try {
            var r = await fetch('/api/admin/mensajes-staff/conversaciones/' + convId);
            if (!r.ok) throw new Error();
            var data = await r.json();
            renderChat(chat, data);
        } catch (_) {
            chat.innerHTML = '<div class="ams-chat-empty" style="color:#e74c3c;">No se pudo cargar.</div>';
        }
    };

    function renderChat(chat, data) {
        var nombreCompleto = (data.nombre || '') + (data.apellidos ? ' ' + data.apellidos : '');
        var rolBadge = data.rol ? `<span class="admin-badge ${rolBadgeClass(data.rol)}" style="font-size:0.6rem;padding:3px 9px;margin-left:8px;">${rolLabel(data.rol)}</span>` : '';
        var msgsHtml = data.mensajes && data.mensajes.length
            ? data.mensajes.map(bubble).join('')
            : '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:2rem;font-style:italic;">Sin mensajes en esta conversación.</div>';
        var docHdr = '';
        if (data.numDocumento) {
            docHdr = 'Documento: ' + (data.tipoDocumento ? escHtml(data.tipoDocumento) + ' · ' : '') + escHtml(data.numDocumento);
        }
        chat.innerHTML = `
            <div class="ams-chat-hdr">
                <div style="font-family:'Playfair Display',serif;font-size:1.05rem;color:#c9a84c;letter-spacing:0.06em;display:flex;align-items:center;flex-wrap:wrap;">${escHtml(nombreCompleto || '—')} ${rolBadge}</div>
                <div style="font-size:0.74rem;color:rgba(255,255,255,0.5);margin-top:4px;">${docHdr}</div>
            </div>
            <div class="ams-msgs" id="ams-msgs">${msgsHtml}</div>
            <div class="ams-input-row">
                <input id="ams-input" class="ams-input" type="text" placeholder="Escribe un mensaje…" onkeydown="if(event.key==='Enter') amsEnviar()">
                <button class="ams-send" onclick="amsEnviar()">Enviar</button>
            </div>
        `;
        var msgsBox = document.getElementById('ams-msgs');
        if (msgsBox) msgsBox.scrollTop = msgsBox.scrollHeight;
    }

    function bubble(m) {
        var fromAdmin = !!m.autorEsAdmin;
        var styleBase = 'max-width:70%;padding:10px 14px;border-radius:14px;font-size:0.88rem;line-height:1.4;word-wrap:break-word;white-space:pre-wrap;';
        var fechaTxt = fmt(m.creadoEn);
        if (fromAdmin) {
            return `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                       <div style="${styleBase}background:rgba(201,168,76,0.15);color:#f5e9c8;border:1px solid rgba(201,168,76,0.25);border-bottom-right-radius:4px;">${escHtml(m.texto)}</div>
                       <div style="font-size:0.66rem;color:rgba(201,168,76,0.7);letter-spacing:0.04em;padding-right:6px;">Tú · ${fechaTxt}</div>
                    </div>`;
        }
        return `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;">
                   <div style="${styleBase}background:rgba(255,255,255,0.06);color:#e8e0c8;border:1px solid rgba(255,255,255,0.1);border-bottom-left-radius:4px;">${escHtml(m.texto)}</div>
                   <div style="font-size:0.66rem;color:rgba(255,255,255,0.4);letter-spacing:0.04em;padding-left:6px;">Staff · ${fechaTxt}</div>
                </div>`;
    }

    window.amsEnviar = async function () {
        if (!_convActiva) return;
        var inp = document.getElementById('ams-input');
        var texto = inp.value.trim();
        if (!texto) return;
        inp.disabled = true;
        try {
            var r = await fetch('/api/admin/mensajes-staff/conversaciones/' + _convActiva, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });
            if (!r.ok) { alert(await r.text() || 'Error al enviar.'); return; }
            inp.value = '';
            // Recargar la conversación y la lista (para refrescar timestamp)
            await amsSeleccionar(_convActiva, document.querySelector('.ams-item.active'));
            // Refrescar bandeja sin perder selección
            try {
                var r2 = await fetch('/api/admin/mensajes-staff/conversaciones');
                if (r2.ok) {
                    var convs = await r2.json();
                    var listEl = document.getElementById('ams-list');
                    if (listEl) listEl.innerHTML = renderLista(convs);
                    var sel = document.querySelector('.ams-item[data-conv-id="' + _convActiva + '"]');
                    if (sel) sel.classList.add('active');
                }
            } catch(_){}
        } catch (_) { alert('Error de conexión.'); }
        finally { inp.disabled = false; inp.focus(); }
    };

})();
