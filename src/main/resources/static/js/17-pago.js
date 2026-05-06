// ── PAGO ──────────────────────────────────────────────────────────────────────

window._pagoState = {
    reservaId: null,
    metodoSeleccionadoId: null,
    codigoDescuento: '',
    descuentoValidado: false,
    resumen: null,
    metodos: []
};

window.abrirPago = async (reservaId) => {
    window._pagoState = {
        reservaId,
        metodoSeleccionadoId: null,
        codigoDescuento: '',
        descuentoValidado: false,
        resumen: null,
        metodos: []
    };
    if (!document.getElementById('pago-overlay')) crearModalPago();
    document.getElementById('pago-overlay').classList.add('is-open');

    await cargarDatosPago();
};

function crearModalPago() {
    var div = document.createElement('div');
    div.className = 'pago-overlay';
    div.id = 'pago-overlay';
    div.onclick = (e) => { if (e.target.id === 'pago-overlay') cerrarPago(); };
    div.innerHTML = `
        <div class="pago-modal" id="pago-modal-content">
            <button class="pago-modal-close" onclick="cerrarPago()">&times;</button>
            <h3 class="pago-titulo">Finaliza tu reserva</h3>
            <p class="pago-subtitulo">Resumen y pago seguro</p>
            <div id="pago-body">
                <div style="padding:3rem 0;text-align:center;">
                    <div style="width:40px;height:40px;border:3px solid rgba(201,168,76,0.2);border-top-color:var(--gold);border-radius:50%;animation:pago-spin 0.8s linear infinite;margin:0 auto;"></div>
                </div>
            </div>
        </div>
        <style>@keyframes pago-spin { to { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(div);
}

window.cerrarPago = () => {
    var el = document.getElementById('pago-overlay');
    if (el) el.classList.remove('is-open');
};

async function cargarDatosPago() {
    try {
        var [rResumen, rMetodos] = await Promise.all([
            fetch('/api/pagos/resumen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservaId: window._pagoState.reservaId, codigoDescuento: '' })
            }),
            fetch('/api/perfil/metodos-pago')
        ]);
        if (!rResumen.ok) {
            var msg = await rResumen.text();
            document.getElementById('pago-body').innerHTML = `<div class="pago-alert pago-alert--err" style="display:block;">${msg || 'Error al cargar.'}</div>`;
            return;
        }
        window._pagoState.resumen = await rResumen.json();
        window._pagoState.metodos = rMetodos.ok ? await rMetodos.json() : [];
        var def = window._pagoState.metodos.find(m => m.esDefault);
        if (def) window._pagoState.metodoSeleccionadoId = def.id;
        else if (window._pagoState.metodos.length > 0) window._pagoState.metodoSeleccionadoId = window._pagoState.metodos[0].id;
        renderPago();
    } catch (_) {
        document.getElementById('pago-body').innerHTML = `<div class="pago-alert pago-alert--err" style="display:block;">Error de conexión.</div>`;
    }
}

function renderPago() {
    var s = window._pagoState.resumen;
    var metodos = window._pagoState.metodos;
    var body = document.getElementById('pago-body');
    if (!body || !s) return;

    var metodosHTML = metodos.length > 0
        ? metodos.map(m => {
            var sel = m.id === window._pagoState.metodoSeleccionadoId ? 'is-selected' : '';
            var titulo, sub;
            if (m.tipo === 'TARJETA') {
                titulo = `${m.marca || 'Tarjeta'} •••• ${m.ultimosCuatro || '----'}`;
                sub    = m.titular || '';
            } else if (m.tipo === 'BIZUM') {
                titulo = 'Bizum';
                sub    = m.telefono || '';
            } else {
                titulo = 'Cuenta bancaria';
                sub    = m.iban || '';
            }
            return `
                <div class="pago-metodo ${sel}" onclick="seleccionarMetodoPago(${m.id})">
                    <div class="pago-metodo-radio"></div>
                    <div class="pago-metodo-icon">${m.tipo === 'BIZUM' ? 'B' : (m.tipo === 'CUENTA_BANCARIA' ? '🏦' : '💳')}</div>
                    <div class="pago-metodo-body">
                        <div class="pago-metodo-title">${titulo}</div>
                        <div class="pago-metodo-sub">${sub}</div>
                    </div>
                </div>
            `;
        }).join('')
        : `<div class="pago-metodo-empty">
               No tienes métodos de pago guardados.
               <br><a href="/perfil" style="color:var(--gold);">Añadir uno en tu perfil →</a>
           </div>`;

    var descuentoRow = (s.descuento && parseFloat(s.descuento) > 0) ? `
        <div class="pago-row pago-row--descuento">
            <span>Descuento</span>
            <span>– ${parseFloat(s.descuento).toFixed(2)} €</span>
        </div>` : '';

    var serviciosBlock = '';
    if (s.servicios && s.servicios.length > 0) {
        var rows = s.servicios.map(srv => {
            var cant = parseInt(srv.cantidad) || 0;
            var sub  = parseFloat(srv.subtotal) || 0;
            var unit = parseFloat(srv.precio)   || 0;
            return `
                <div class="pago-row pago-row--servicio">
                    <span class="pago-servicio-nombre">${escapePagoHtml(srv.nombre)} <span class="pago-servicio-cant">× ${cant}</span></span>
                    <span class="pago-servicio-precio">
                        <span class="pago-servicio-unit">${unit.toFixed(2)} €/u</span>
                        ${sub.toFixed(2)} €
                    </span>
                </div>`;
        }).join('');
        serviciosBlock = `
            <div class="pago-subseccion">
                <div class="pago-subseccion-titulo">Servicios extra</div>
                ${rows}
            </div>`;
    }

    body.innerHTML = `
        <div class="pago-section">
            <div class="pago-section-title">Resumen</div>
            <div class="pago-row pago-row--muted">
                <span>${s.habitacionTipo}${s.habitacionNumero ? ' · Nº ' + s.habitacionNumero : ''}</span>
                <span>${s.fechaEntrada} → ${s.fechaSalida}</span>
            </div>
            <div class="pago-row pago-row--muted" style="font-size:0.78rem;">
                <span>Check-in</span><span>${s.fechaEntrada} · ${s.horaCheckin || '15:00'} h</span>
            </div>
            <div class="pago-row pago-row--muted" style="font-size:0.78rem;">
                <span>Check-out</span><span>${s.fechaSalida} · ${s.horaCheckout || '11:00'} h</span>
            </div>
            ${serviciosBlock}
            <div class="pago-row">
                <span>Subtotal</span>
                <span>${parseFloat(s.subtotal).toFixed(2)} €</span>
            </div>
            ${descuentoRow}
            <div class="pago-row pago-row--total">
                <span>Total</span>
                <span>${parseFloat(s.total).toFixed(2)} €</span>
            </div>
        </div>

        <div class="pago-section">
            <div class="pago-section-title">Código de descuento</div>
            <div class="pago-desc-group">
                <input type="text" id="pago-input-codigo" class="pago-desc-input"
                       placeholder="Introduce tu código" value="${window._pagoState.codigoDescuento}" maxlength="40">
                <button class="pago-desc-btn" onclick="aplicarCodigoDescuento()">Aplicar</button>
            </div>
            <div id="pago-desc-msg" class="pago-desc-msg"></div>
        </div>

        <div class="pago-section">
            <div class="pago-section-title">Método de pago</div>
            ${metodosHTML}
        </div>

        <button class="pago-btn-primary" id="pago-btn-pagar" onclick="confirmarPago()" ${metodos.length === 0 ? 'disabled' : ''}>
            Pagar ${parseFloat(s.total).toFixed(2)} €
        </button>
        <div id="pago-disp-msg" style="font-size:0.75rem; letter-spacing:1px; margin-top:10px; display:none;"></div>
        <div id="pago-alert" class="pago-alert"></div>
    `;

    var msg = document.getElementById('pago-desc-msg');
    if (msg && s.codigoMensaje && window._pagoState.codigoDescuento) {
        msg.textContent = s.codigoMensaje;
        msg.className = 'pago-desc-msg ' + (s.codigoValido ? 'pago-desc-msg--ok' : 'pago-desc-msg--err');
    }

    // Comprobar disponibilidad al renderizar
    comprobarDisponibilidadPago();
}

window.seleccionarMetodoPago = (id) => {
    window._pagoState.metodoSeleccionadoId = id;
    renderPago();
};

async function comprobarDisponibilidadPago() {
    var s = window._pagoState.resumen;
    if (!s) return;
    var btn = document.getElementById('pago-btn-pagar');
    var dispMsg = document.getElementById('pago-disp-msg');
    try {
        var r = await fetch('/api/habitaciones/disponibles?fechaEntrada=' + s.fechaEntrada + '&fechaSalida=' + s.fechaSalida);
        if (!r.ok) return;
        var disp = await r.json();
        var tipo = s.habitacionTipo;
        var libres = disp[tipo] !== undefined ? parseInt(disp[tipo]) : 0;
        if (dispMsg) {
            dispMsg.style.display = 'block';
            if (libres > 0) {
                dispMsg.style.color = 'var(--gold)';
                dispMsg.textContent = '🏨 ' + libres + (libres === 1 ? ' habitación disponible' : ' habitaciones disponibles') + ' para estas fechas';
                if (btn && btn.dataset.metodoOk !== 'false') { btn.disabled = false; btn.style.opacity = '1'; }
            } else {
                dispMsg.style.color = '#e74c3c';
                dispMsg.textContent = '❌ Habitación ya no disponible. Otro usuario acaba de confirmar el pago.';
                if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
            }
        }
    } catch (_) {}
}

window.aplicarCodigoDescuento = async () => {
    var input = document.getElementById('pago-input-codigo');
    var msg   = document.getElementById('pago-desc-msg');
    var codigo = input ? input.value.trim() : '';
    window._pagoState.codigoDescuento = codigo;

    try {
        var r = await fetch('/api/pagos/resumen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservaId: window._pagoState.reservaId, codigoDescuento: codigo })
        });
        if (!r.ok) {
            if (msg) { msg.textContent = 'Error al aplicar código.'; msg.className = 'pago-desc-msg pago-desc-msg--err'; }
            return;
        }
        window._pagoState.resumen = await r.json();
        renderPago();
    } catch (_) {
        if (msg) { msg.textContent = 'Error de conexión.'; msg.className = 'pago-desc-msg pago-desc-msg--err'; }
    }
};

window.confirmarPago = async () => {
    var alertEl = document.getElementById('pago-alert');
    if (!window._pagoState.metodoSeleccionadoId) {
        if (alertEl) { alertEl.textContent = 'Selecciona un método de pago.'; alertEl.className = 'pago-alert pago-alert--err'; alertEl.style.display = 'block'; }
        return;
    }
    mostrarProcesandoPago();
    try {
        var r = await fetch('/api/pagos/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reservaId:       window._pagoState.reservaId,
                metodoPagoId:    window._pagoState.metodoSeleccionadoId,
                codigoDescuento: window._pagoState.codigoDescuento
            })
        });
        if (!r.ok) {
            var t = await r.text();
            ocultarProcesandoPago();
            if (alertEl) { alertEl.textContent = t || 'No se pudo procesar el pago.'; alertEl.className = 'pago-alert pago-alert--err'; alertEl.style.display = 'block'; }
            return;
        }
        var data = await r.json();
        ocultarProcesandoPago();
        renderExito(data);
        // Refrescar habitaciones guardadas en el perfil si está abierto
        if (typeof cargarHabitacionesGuardadas === 'function') {
            setTimeout(() => cargarHabitacionesGuardadas(), 500);
        }
    } catch (_) {
        ocultarProcesandoPago();
        if (alertEl) { alertEl.textContent = 'Error de conexión.'; alertEl.className = 'pago-alert pago-alert--err'; alertEl.style.display = 'block'; }
    }
};

function mostrarProcesandoPago() {
    if (document.getElementById('pago-processing')) return;
    var modal = document.getElementById('pago-modal-content');
    if (!modal) return;
    var ov = document.createElement('div');
    ov.id = 'pago-processing';
    ov.className = 'pago-processing';
    ov.innerHTML = `
        <div class="pago-processing-spinner"></div>
        <div class="pago-processing-title">Procesando pago</div>
        <div class="pago-processing-sub">No cierres ni recargues esta ventana</div>
    `;
    modal.appendChild(ov);
}

function ocultarProcesandoPago() {
    var ov = document.getElementById('pago-processing');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
}

function escapePagoHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderExito(pago) {
    var body = document.getElementById('pago-body');
    if (!body) return;
    body.innerHTML = `
        <div class="pago-success">
            <div class="pago-success-icon">✓</div>
            <h3>Pago confirmado</h3>
            <p>Hemos enviado la factura a tu correo electrónico.</p>
            <div class="pago-success-ref">${pago.referencia}</div>
            <div class="pago-row pago-row--total" style="justify-content:center;gap:1rem;border:none;">
                <span>Total pagado</span>
                <span>${parseFloat(pago.total).toFixed(2)} €</span>
            </div>
            <a href="/api/pagos/${pago.id}/factura.pdf" class="pago-btn-descarga" download>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:-3px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar factura (PDF)
            </a>
            <button class="pago-btn-primary" style="margin-top:0.75rem;" onclick="cerrarPago(); location.href='/mis-reservas';">
                Ver mis reservas
            </button>
        </div>
    `;
}
