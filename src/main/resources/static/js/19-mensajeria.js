// ── PANEL DE MENSAJERÍA (RECEPCIÓN/ADMIN) ────────────────────────────────────

window._msgState = {
    inbox: [],
    activaId: null,
    activa: null,
    ficha: null,
    pollingTimer: null,
    pollingMs: 5000,
    filtroTexto: '',
    filtroEstado: '',   // '' = todas
    puedeEliminar: false
};

// Iconos SVG (estilo Lucide / stroke=currentColor) — sin emojis
const MSG_ICON = {
    trash:    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    paperclip:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.93 8.8l-8.57 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    template: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" x2="15" y1="13" y2="13"/><line x1="9" x2="15" y1="17" y2="17"/></svg>',
    chat:     '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    refresh:  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>',
    close:    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    check1:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    check2:   '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 30 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 4 7 14 3 10"/><polyline points="20 4 14 14 12 12"/></svg>'
};

const MSG_PLANTILLAS = [
    { titulo: 'Saludo inicial',     texto: 'Buenos días, gracias por contactar con Golden Resort. ¿En qué podemos ayudarle?' },
    { titulo: 'En breve',           texto: 'Hemos recibido su mensaje. Le contestaremos en breve.' },
    { titulo: 'Cambio confirmado',  texto: 'Le confirmamos que el cambio ha sido aplicado correctamente.' },
    { titulo: 'Resuelto',           texto: 'Su petición ha sido atendida. Si necesita algo más, estamos a su disposición.' },
    { titulo: 'Despedida',          texto: 'Gracias por contar con nosotros. Que tenga un excelente día.' }
];

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('msg-root')) return;
    setTimeout(msgInit, 200);
});

function msgInit() {
    var root = document.getElementById('msg-root');
    if (!root) return;
    var mc = document.getElementById('main-content');
    if (mc) mc.style.display = 'block';

    var nav = document.getElementById('navbar');
    window._msgState.puedeEliminar = nav && nav.dataset.recepcion === 'true';

    root.innerHTML = `
        <div class="msg-wrap">
            <div class="msg-header d-flex justify-content-between align-items-end flex-wrap gap-2">
                <div>
                    <h1 class="msg-title">Mensajería</h1>
                    <div class="msg-sub">Inbox compartido del equipo de recepción</div>
                </div>
                <button class="btn-reservar msg-refresh-btn" onclick="msgRecargar()">${MSG_ICON.refresh}<span>Refrescar</span></button>
            </div>
            <div class="msg-grid">
                <div class="msg-col msg-inbox-col">
                    <div class="msg-col-title">Conversaciones</div>
                    <div class="msg-inbox-toolbar">
                        <input type="text" id="msg-buscar" class="msg-search" placeholder="Buscar nombre o email…" oninput="msgSetFiltroTexto(this.value)">
                        <div class="msg-filtro-estado">
                            <button class="msg-chip-filter active" data-estado="" onclick="msgSetFiltroEstado('')">Todas</button>
                            <button class="msg-chip-filter" data-estado="ABIERTA"   onclick="msgSetFiltroEstado('ABIERTA')">Abiertas</button>
                            <button class="msg-chip-filter" data-estado="PENDIENTE" onclick="msgSetFiltroEstado('PENDIENTE')">Pendientes</button>
                            <button class="msg-chip-filter" data-estado="RESUELTA"  onclick="msgSetFiltroEstado('RESUELTA')">Resueltas</button>
                        </div>
                    </div>
                    <div id="msg-inbox" class="msg-inbox-list">
                        <div class="msg-empty-state">Cargando…</div>
                    </div>
                </div>
                <div class="msg-col msg-chat-col">
                    <div class="msg-chat-header" id="msg-chat-header">
                        <div class="msg-col-title" id="msg-chat-title">Selecciona una conversación</div>
                    </div>
                    <div id="msg-chat-list" class="msg-chat-list">
                        <div class="msg-empty-state msg-empty-big">
                            <div class="msg-empty-icon">${MSG_ICON.chat}</div>
                            <div>Selecciona una conversación de la izquierda<br>o usa el buscador para encontrar un cliente.</div>
                        </div>
                    </div>
                    <div id="msg-chat-input" class="msg-chat-input-wrap" style="display:none;">
                        <div class="msg-chat-toolbar">
                            <div class="dropup">
                                <button class="msg-tool-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Plantillas de respuesta">${MSG_ICON.template}</button>
                                <ul class="dropdown-menu msg-plantillas-menu" id="msg-plantillas"></ul>
                            </div>
                            <button class="msg-tool-btn" type="button" onclick="document.getElementById('msg-file').click()" title="Adjuntar imagen">${MSG_ICON.paperclip}</button>
                            <input type="file" id="msg-file" accept="image/jpeg,image/png" style="display:none" onchange="msgPreviewAdjunto()">
                            <span id="msg-file-name" class="msg-file-name"></span>
                            <button class="msg-tool-btn msg-tool-btn--cancel" id="msg-file-clear" style="display:none" onclick="msgClearAdjunto()" title="Quitar adjunto">${MSG_ICON.close}</button>
                        </div>
                        <div class="msg-chat-input-row">
                            <textarea id="msg-input" maxlength="2000" placeholder="Escribir respuesta…" onkeydown="msgKey(event)"></textarea>
                            <button class="msg-send-btn" id="msg-send" onclick="msgEnviar()">Enviar</button>
                        </div>
                    </div>
                </div>
                <div class="msg-col msg-ficha-col">
                    <div class="msg-col-title">Ficha del cliente</div>
                    <div id="msg-ficha" class="msg-ficha-body">
                        <div class="msg-empty-state">—</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Plantillas en el dropdown
    var menu = document.getElementById('msg-plantillas');
    if (menu) {
        menu.innerHTML = MSG_PLANTILLAS.map((p, i) =>
            `<li><a class="dropdown-item" href="#" onclick="msgUsarPlantilla(${i});return false;">
                <strong>${escapeHtml(p.titulo)}</strong>
                <span class="msg-plantilla-preview">${escapeHtml(p.texto.substring(0, 90))}${p.texto.length > 90 ? '…' : ''}</span>
            </a></li>`
        ).join('');
    }

    msgRecargar();
    msgArrancarPolling();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) msgPararPolling();
        else { msgRecargar(); msgArrancarPolling(); }
    });
}

function msgArrancarPolling() {
    msgPararPolling();
    window._msgState.pollingTimer = setInterval(() => {
        msgRecargarInbox();
        if (window._msgState.activaId) msgCargarConversacion(window._msgState.activaId, true);
    }, window._msgState.pollingMs);
}

function msgPararPolling() {
    if (window._msgState.pollingTimer) {
        clearInterval(window._msgState.pollingTimer);
        window._msgState.pollingTimer = null;
    }
}

window.msgRecargar = async () => {
    await msgRecargarInbox();
    if (window._msgState.activaId) await msgCargarConversacion(window._msgState.activaId, true);
};

async function msgRecargarInbox() {
    try {
        var r = await fetch('/api/mensajeria/recepcion/conversaciones');
        if (!r.ok) return;
        window._msgState.inbox = await r.json();
        renderInbox();
    } catch (_) {}
}

window.msgSetFiltroTexto = (v) => {
    window._msgState.filtroTexto = (v || '').trim().toLowerCase();
    renderInbox();
};

window.msgSetFiltroEstado = (estado) => {
    window._msgState.filtroEstado = estado || '';
    document.querySelectorAll('#msg-filtro-estado .msg-chip-filter, .msg-filtro-estado .msg-chip-filter').forEach(b => {
        b.classList.toggle('active', (b.dataset.estado || '') === window._msgState.filtroEstado);
    });
    renderInbox();
};

function renderInbox() {
    var el = document.getElementById('msg-inbox');
    if (!el) return;
    var items = window._msgState.inbox || [];
    var q  = window._msgState.filtroTexto;
    var fe = window._msgState.filtroEstado;

    var filtrados = items.filter(c => {
        if (fe && (c.estado || 'ABIERTA') !== fe) return false;
        if (q) {
            var hay = ((c.clienteNombre || '') + ' ' + (c.clienteEmail || '')).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    if (filtrados.length === 0) {
        el.innerHTML = '<div class="msg-empty-state">No hay conversaciones con ese filtro.</div>';
        return;
    }
    el.innerHTML = filtrados.map(c => {
        var nombre = c.clienteNombre || c.clienteEmail || 'Cliente';
        var ultimo = c.ultimoTexto ? escapeHtml(c.ultimoTexto.substring(0, 80)) : '<i>(sin mensajes)</i>';
        var fecha = c.ultimaActividad ? formatRelative(c.ultimaActividad) : '';
        var unread = (c.noLeidosRecepcion && c.noLeidosRecepcion > 0)
            ? `<span class="msg-unread-pill">${c.noLeidosRecepcion}</span>` : '';
        var estado = c.estado || 'ABIERTA';
        var act = (window._msgState.activaId === c.conversacionId) ? 'active' : '';
        return `
            <div class="msg-conv ${act} msg-conv--${estado.toLowerCase()}" onclick="msgAbrir(${c.conversacionId}, ${c.clienteId})">
                <div class="msg-conv-top">
                    <span class="msg-conv-name">${escapeHtml(nombre)}</span>
                    <span class="msg-estado-chip msg-estado-chip--${estado.toLowerCase()}">${labelEstado(estado)}</span>
                </div>
                <div class="msg-conv-preview">${ultimo}</div>
                <div class="msg-conv-meta"><span>${fecha}</span>${unread}</div>
            </div>
        `;
    }).join('');
}

window.msgAbrir = async (conversacionId, clienteId) => {
    window._msgState.activaId = conversacionId;
    renderInbox();
    document.getElementById('msg-chat-input').style.display = 'flex';
    await Promise.all([
        msgCargarConversacion(conversacionId, false),
        msgCargarFicha(clienteId)
    ]);
    setTimeout(() => msgScrollToBottom(true), 30);
};

async function msgCargarConversacion(id, manteniendoScroll) {
    try {
        var r = await fetch('/api/mensajeria/recepcion/conversaciones/' + id);
        if (!r.ok) return;
        window._msgState.activa = await r.json();
        renderChat(manteniendoScroll);
        renderChatHeader();
    } catch (_) {}
}

function renderChatHeader() {
    var head = document.getElementById('msg-chat-header');
    if (!head) return;
    var c = window._msgState.activa;
    if (!c) return;
    var titleEl = document.getElementById('msg-chat-title');
    if (titleEl) titleEl.remove();

    var nombre = c.clienteNombre || c.clienteEmail || 'Conversación';
    var email  = c.clienteEmail || '';
    var estado = c.estado || 'ABIERTA';

    var btnEliminar = window._msgState.puedeEliminar
        ? `<button class="msg-action-btn msg-action-btn--danger" onclick="msgEliminarConversacion()" title="Eliminar conversación">${MSG_ICON.trash}<span>Eliminar</span></button>`
        : '';

    head.innerHTML = `
        <div class="msg-chat-head-info">
            <div class="msg-col-title" id="msg-chat-title">${escapeHtml(nombre)}</div>
            ${email ? `<a class="msg-chat-head-email" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : ''}
        </div>
        <div class="msg-chat-head-actions">
            <select class="msg-estado-select msg-estado-select--${estado.toLowerCase()}" onchange="msgCambiarEstado(this.value)">
                <option value="ABIERTA"   ${estado === 'ABIERTA'   ? 'selected' : ''}>Abierta</option>
                <option value="PENDIENTE" ${estado === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                <option value="RESUELTA"  ${estado === 'RESUELTA'  ? 'selected' : ''}>Resuelta</option>
            </select>
            ${btnEliminar}
        </div>
    `;
}

function renderChat(manteniendoScroll) {
    var lista = document.getElementById('msg-chat-list');
    if (!lista) return;
    var c = window._msgState.activa;
    if (!c) return;

    var prevTop = lista.scrollTop;
    var prevAtBottom = (lista.scrollHeight - lista.clientHeight - lista.scrollTop) < 20;

    if (!c.mensajes || c.mensajes.length === 0) {
        lista.innerHTML = '<div class="msg-empty-state">El cliente aún no ha escrito nada. Puedes escribir tú primero.</div>';
        return;
    }
    lista.innerHTML = c.mensajes.map(m => {
        var cls = m.autorRol === 'CLIENTE' ? 'msg-bubble--cliente' : 'msg-bubble--recepcion';
        var adjuntoHtml = m.adjuntoUrl
            ? `<div class="msg-bubble-adjunto">
                   <a href="${escapeHtml(m.adjuntoUrl)}" target="_blank" rel="noopener">
                       <img src="${escapeHtml(m.adjuntoUrl)}" alt="${escapeHtml(m.adjuntoNombre || 'Adjunto')}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'">
                       <span class="msg-bubble-adjunto-fallback" style="display:none">${MSG_ICON.paperclip}<span>${escapeHtml(m.adjuntoNombre || 'Adjunto')}</span></span>
                   </a>
               </div>`
            : '';
        var textoHtml = m.texto ? `<div>${escapeHtml(m.texto)}</div>` : '';
        // ticks solo en mensajes propios (RECEPCION)
        var ticksHtml = '';
        if (m.autorRol === 'RECEPCION') {
            var doble = !!m.leidoEn;
            ticksHtml = `<span class="msg-ticks ${doble ? 'msg-ticks--leido' : ''}" title="${doble ? 'Leído ' + formatFechaHora(m.leidoEn) : 'Enviado'}">${doble ? MSG_ICON.check2 : MSG_ICON.check1}</span>`;
        }
        return `
            <div class="msg-bubble ${cls}">
                ${adjuntoHtml}
                ${textoHtml}
                <div class="msg-bubble-meta">${formatRelativeFull(m.creadoEn)} ${ticksHtml}</div>
            </div>
        `;
    }).join('');

    if (manteniendoScroll && !prevAtBottom) lista.scrollTop = prevTop;
    else msgScrollToBottom(false);
}

function msgScrollToBottom(force) {
    var lista = document.getElementById('msg-chat-list');
    if (!lista) return;
    lista.scrollTop = lista.scrollHeight;
}

window.msgKey = (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        msgEnviar();
    }
};

window.msgEnviar = async () => {
    var btn = document.getElementById('msg-send');
    var input = document.getElementById('msg-input');
    var fileInput = document.getElementById('msg-file');
    if (!input || !btn) return;
    var texto = input.value.trim();
    var file  = fileInput && fileInput.files && fileInput.files[0];
    if (!texto && !file) return;
    if (!window._msgState.activaId) return;
    btn.disabled = true;
    try {
        var r;
        if (file) {
            var fd = new FormData();
            if (texto) fd.append('texto', texto);
            fd.append('file', file);
            r = await fetch('/api/mensajeria/recepcion/conversaciones/' + window._msgState.activaId + '/mensajes/multipart', {
                method: 'POST',
                body: fd
            });
        } else {
            r = await fetch('/api/mensajeria/recepcion/conversaciones/' + window._msgState.activaId + '/mensajes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto })
            });
        }
        if (!r.ok) {
            var t = await r.text();
            alert(t || 'No se pudo enviar.');
            return;
        }
        input.value = '';
        msgClearAdjunto();
        await msgCargarConversacion(window._msgState.activaId, false);
        msgRecargarInbox();
    } catch (_) {
    } finally {
        setTimeout(() => { btn.disabled = false; }, 800);
    }
};

window.msgUsarPlantilla = (i) => {
    var p = MSG_PLANTILLAS[i];
    if (!p) return;
    var input = document.getElementById('msg-input');
    if (!input) return;
    input.value = p.texto;
    input.focus();
};

window.msgPreviewAdjunto = () => {
    var f = document.getElementById('msg-file').files[0];
    var label = document.getElementById('msg-file-name');
    var clear = document.getElementById('msg-file-clear');
    if (f) {
        label.textContent = f.name + ' (' + (f.size / 1024).toFixed(0) + ' KB)';
        clear.style.display = 'inline-flex';
    } else {
        label.textContent = '';
        clear.style.display = 'none';
    }
};

window.msgClearAdjunto = () => {
    var fi = document.getElementById('msg-file');
    if (fi) fi.value = '';
    document.getElementById('msg-file-name').textContent = '';
    document.getElementById('msg-file-clear').style.display = 'none';
};

window.msgCambiarEstado = async (nuevo) => {
    if (!window._msgState.activaId) return;
    try {
        var r = await fetch('/api/mensajeria/recepcion/conversaciones/' + window._msgState.activaId + '/estado', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevo })
        });
        if (!r.ok) {
            alert(await r.text() || 'No se pudo cambiar el estado.');
            return;
        }
        await msgRecargar();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.msgEliminarConversacion = async () => {
    if (!window._msgState.activaId) return;
    if (!confirm('¿Eliminar esta conversación y todos sus mensajes? Esta acción no se puede deshacer.')) return;
    try {
        var r = await fetch('/api/mensajeria/recepcion/conversaciones/' + window._msgState.activaId, {
            method: 'DELETE'
        });
        if (!r.ok && r.status !== 204) {
            alert(await r.text() || 'No se pudo eliminar.');
            return;
        }
        window._msgState.activaId = null;
        window._msgState.activa = null;
        document.getElementById('msg-chat-input').style.display = 'none';
        document.getElementById('msg-chat-list').innerHTML =
            '<div class="msg-empty-state msg-empty-big"><div class="msg-empty-icon">' + MSG_ICON.chat + '</div><div>Conversación eliminada.</div></div>';
        var head = document.getElementById('msg-chat-header');
        if (head) head.innerHTML = '<div class="msg-col-title" id="msg-chat-title">Selecciona una conversación</div>';
        document.getElementById('msg-ficha').innerHTML = '<div class="msg-empty-state">—</div>';
        await msgRecargarInbox();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

async function msgCargarFicha(clienteId) {
    var el = document.getElementById('msg-ficha');
    if (!el) return;
    el.innerHTML = '<div class="msg-empty-state">Cargando…</div>';
    try {
        var r = await fetch('/api/mensajeria/recepcion/cliente/' + clienteId + '/ficha');
        if (!r.ok) {
            el.innerHTML = '<div class="msg-empty-state">No se pudo cargar la ficha.</div>';
            return;
        }
        window._msgState.ficha = await r.json();
        renderFicha();
    } catch (_) {
        el.innerHTML = '<div class="msg-empty-state">Error de conexión.</div>';
    }
}

function renderFicha() {
    var el = document.getElementById('msg-ficha');
    if (!el) return;
    var f = window._msgState.ficha;
    if (!f) return;

    function reservaCard(r, kind) {
        var dias = '';
        try {
            var d1 = new Date(r.fechaEntrada), d2 = new Date(r.fechaSalida);
            var n = Math.round((d2 - d1) / 86400000);
            if (n > 0) dias = n + ' noche' + (n === 1 ? '' : 's');
        } catch (_) {}
        return `
            <div class="msg-card msg-card--${kind}">
                <div class="msg-card-head">
                    <span class="msg-card-tag">${escapeHtml(r.habitacionTipo || '—')}</span>
                    <span class="msg-card-room">Hab. ${escapeHtml(r.habitacionNumero || '—')}</span>
                </div>
                <div class="msg-card-dates">${formatFecha(r.fechaEntrada)} → ${formatFecha(r.fechaSalida)}</div>
                ${dias ? `<div class="msg-card-meta">${dias}</div>` : ''}
            </div>
        `;
    }

    var activasHtml = (f.activas && f.activas.length > 0)
        ? f.activas.map(r => reservaCard(r, 'activa')).join('')
        : '<div class="msg-ficha-empty">Sin estancia activa.</div>';

    var proximasHtml = (f.proximas && f.proximas.length > 0)
        ? f.proximas.map(r => reservaCard(r, 'proxima')).join('')
        : '<div class="msg-ficha-empty">Sin reservas próximas.</div>';

    var pasadasHtml = (f.pasadasTop && f.pasadasTop.length > 0)
        ? f.pasadasTop.map(r => `
            <div class="msg-line">
                <span class="msg-line-key">Hab. ${escapeHtml(r.habitacionNumero || '—')} <em>${escapeHtml(r.habitacionTipo || '')}</em></span>
                <span class="msg-line-val">${formatFecha(r.fechaEntrada)} → ${formatFecha(r.fechaSalida)}</span>
            </div>`).join('')
        : '<div class="msg-ficha-empty">Sin reservas pasadas.</div>';

    var inicial = (f.nombre || f.email || '?').trim().charAt(0).toUpperCase();

    el.innerHTML = `
        <div class="msg-ficha-hero">
            <div class="msg-ficha-avatar">${escapeHtml(inicial)}</div>
            <div class="msg-ficha-id">
                <div class="msg-ficha-name">${escapeHtml(f.nombre || 'Sin nombre')}</div>
                <a class="msg-ficha-email" href="mailto:${escapeHtml(f.email || '')}">${escapeHtml(f.email || '')}</a>
            </div>
        </div>

        <div class="msg-ficha-stats">
            <div class="msg-stat-card">
                <div class="msg-stat-label">Reservas pasadas</div>
                <div class="msg-stat-value">${f.pasadasTotal || 0}</div>
            </div>
            <div class="msg-stat-card">
                <div class="msg-stat-label">Total gastado</div>
                <div class="msg-stat-value">${formatEur(f.totalGastado)}</div>
            </div>
        </div>

        <div class="msg-ficha-section">
            <div class="msg-ficha-section-title">▸ En estancia hoy</div>
            ${activasHtml}
        </div>
        <div class="msg-ficha-section">
            <div class="msg-ficha-section-title">▸ Próximas reservas</div>
            ${proximasHtml}
        </div>
        <div class="msg-ficha-section">
            <div class="msg-ficha-section-title">▸ Histórico (últimas 5)</div>
            ${pasadasHtml}
        </div>
    `;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function escapeHtml(s) {
    return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function labelEstado(e) {
    switch (e) {
        case 'ABIERTA':   return 'Abierta';
        case 'PENDIENTE': return 'Pendiente';
        case 'RESUELTA':  return 'Resuelta';
        default:          return e;
    }
}

function formatFecha(f) {
    if (!f) return '—';
    try { return new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch (_) { return f; }
}

function formatFechaHora(f) {
    if (!f) return '';
    try { return new Date(f).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return f; }
}

function formatRelative(f) {
    if (!f) return '';
    try {
        var d = new Date(f);
        var diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return 'ahora';
        if (diff < 3600) return Math.floor(diff / 60) + 'min';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd';
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    } catch (_) { return ''; }
}

function formatRelativeFull(f) {
    if (!f) return '';
    try {
        var d = new Date(f);
        var diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return 'ahora mismo';
        if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
        if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h';
        if (diff < 172800) return 'ayer ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (_) { return ''; }
}

function formatEur(v) {
    if (v == null) return '—';
    var n = parseFloat(v);
    if (isNaN(n)) return v;
    return n.toFixed(2) + ' €';
}
