// ── SVGs de marcas de tarjeta (global, usado por pago y perfil) ──────────────
window.cardBrandSVG = function(marca, size) {
    var s = size || 40;
    if (marca === 'Visa') {
        return '<svg viewBox="0 0 780 500" width="' + s + '" height="' + Math.round(s*500/780) + '" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8zM538.3 156.2c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.7-.3 28.2 26.5 43.9 46.8 53.3 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-32 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 44c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-66.7.2-22.2-14-39.1-44.6-53.1-18.6-9-30-15-29.9-24.2 0-8.1 9.6-16.8 30.4-16.8 17.4-.3 30 3.5 39.7 7.5l4.8 2.2 7.3-43.4zM676.3 152.9h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.3 179.5h56.1s9.2-24.1 11.2-29.4c6.1 0 60.7.1 68.5.1 1.6 6.9 6.5 29.3 6.5 29.3h49.6l-43.3-195.8zm-65.9 126.3c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.6h-44.6zM250.4 152.9l-52.3 133.5-5.6-27.1c-9.7-31.3-40-65.2-73.9-82.2l47.8 171.4 56.6-.1 84.2-195.5h-56.8z" fill="#1a1f71"/>' +
            '<path d="M146.9 152.9H60.8l-.7 3.8c67.1 16.3 111.5 55.5 129.9 102.7L171.8 169c-3.2-12.4-12.7-15.7-24.9-16.1z" fill="#f9a533"/>' +
            '</svg>';
    }
    if (marca === 'Mastercard') {
        return '<svg viewBox="0 0 780 500" width="' + s + '" height="' + Math.round(s*500/780) + '" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="312" cy="250" r="170" fill="#eb001b"/>' +
            '<circle cx="468" cy="250" r="170" fill="#f79e1b"/>' +
            '<path d="M390 120.8a169.7 169.7 0 0 0-62.4 129.2A169.7 169.7 0 0 0 390 379.2a169.7 169.7 0 0 0 62.4-129.2A169.7 169.7 0 0 0 390 120.8z" fill="#ff5f00"/>' +
            '</svg>';
    }
    if (marca === 'American Express') {
        return '<svg viewBox="0 0 780 500" width="' + s + '" height="' + Math.round(s*500/780) + '" xmlns="http://www.w3.org/2000/svg">' +
            '<rect width="780" height="500" rx="40" fill="#2e77bc"/>' +
            '<text x="390" y="280" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="120" fill="#fff" letter-spacing="4">AMEX</text>' +
            '</svg>';
    }
    return '<svg width="' + s + '" height="' + Math.round(s*0.65) + '" viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="1" y="1" width="22" height="14" rx="2"/><line x1="1" y1="5" x2="23" y2="5"/>' +
        '</svg>';
};
window.bizumSVG = function(size) {
    var s = size || 40;
    return '<svg viewBox="0 0 200 200" width="' + s + '" height="' + s + '" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="200" height="200" rx="40" fill="#05c0b8"/>' +
        '<text x="100" y="130" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="72" fill="#fff">B</text>' +
        '</svg>';
};
window.bankSVG = function(size) {
    var s = size || 40;
    return '<svg width="' + s + '" height="' + Math.round(s*0.8) + '" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M12 10v8M19 10v8M3 20h18"/>' +
        '</svg>';
};

// ── PAGO ──────────────────────────────────────────────────────────────────────

window._pagoState = {
    reservaId: null,
    reservaDatos: null,
    metodoSeleccionadoId: null,
    codigoDescuento: '',
    descuentoValidado: false,
    resumen: null,
    metodos: []
};

window.abrirPago = async (reservaId) => {
    window._pagoState = {
        reservaId,
        reservaDatos: null,
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

// Flujo nuevo: reserva + pago atómico (sin crear la reserva antes del pago)
window.abrirPagoNuevo = (reservaDatos) => {
    window._pagoState = {
        reservaId: null,
        reservaDatos,
        metodoSeleccionadoId: null,
        codigoDescuento: '',
        descuentoValidado: false,
        resumen: reservaDatos.resumenPreview,
        metodos: []
    };
    if (!document.getElementById('pago-overlay')) crearModalPago();
    document.getElementById('pago-overlay').classList.add('is-open');
    cargarDatosPago();
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
    var btnConf = document.getElementById('btn-confirmar-reserva');
    if (btnConf) {
        btnConf.disabled    = false;
        btnConf.textContent = typeof t === 'function' ? t('detail_confirm') : 'Confirmar Reserva';
    }
    var msg = document.getElementById('reserva-msg');
    if (msg) msg.style.display = 'none';
};

async function cargarDatosPago() {
    try {
        var rMetodos = await fetch('/api/perfil/metodos-pago');
        window._pagoState.metodos = rMetodos.ok ? await rMetodos.json() : [];
        var def = window._pagoState.metodos.find(m => m.esDefault);
        if (def) window._pagoState.metodoSeleccionadoId = def.id;
        else if (window._pagoState.metodos.length > 0) window._pagoState.metodoSeleccionadoId = window._pagoState.metodos[0].id;

        if (window._pagoState.reservaId !== null) {
            // Flujo existente: obtener resumen del servidor
            var rResumen = await fetch('/api/pagos/resumen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservaId: window._pagoState.reservaId, codigoDescuento: '' })
            });
            if (!rResumen.ok) {
                var errMsg = await rResumen.text();
                document.getElementById('pago-body').innerHTML = `<div class="pago-alert pago-alert--err" style="display:block;">${errMsg || 'Error al cargar.'}</div>`;
                return;
            }
            window._pagoState.resumen = await rResumen.json();
        }
        // Flujo nuevo: resumen ya establecido desde el cliente (resumenPreview)
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
                <div class="pago-metodo ${sel}" onclick="seleccionarMetodoPago(${m.id})" style="position:relative;">
                    <div class="pago-metodo-radio"></div>
                    <div class="pago-metodo-icon">${m.tipo === 'BIZUM' ? bizumSVG(28) : (m.tipo === 'CUENTA_BANCARIA' ? bankSVG(28) : cardBrandSVG(m.marca, 36))}</div>
                    <div class="pago-metodo-body">
                        <div class="pago-metodo-title">${titulo}</div>
                        <div class="pago-metodo-sub">${sub}</div>
                    </div>
                    <button onclick="event.stopPropagation();pagoEliminarMetodo(${m.id})" title="Eliminar" style="position:absolute;top:8px;right:8px;background:none;border:none;color:#999;cursor:pointer;font-size:1rem;padding:4px 6px;border-radius:4px;transition:color .2s;" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#999'">&times;</button>
                </div>
            `;
        }).join('')
        : `<div class="pago-metodo-empty">
               No tienes métodos de pago guardados.
               <br><button onclick="pagoAbrirModalTipo()" style="background:none;border:none;color:var(--gold);cursor:pointer;font-size:inherit;text-decoration:underline;margin-top:6px;">+ Añadir método de pago</button>
           </div>`;

    // Botón de añadir extra si ya hay métodos
    if (metodos.length > 0) {
        metodosHTML += `<button onclick="pagoAbrirModalTipo()" style="display:block;margin-top:10px;background:none;border:1px solid rgba(185,149,77,0.3);color:var(--gold);padding:8px 16px;border-radius:6px;font-size:0.75rem;letter-spacing:1px;cursor:pointer;width:100%;transition:border-color .2s;" onmouseover="this.style.borderColor='rgba(185,149,77,0.7)'" onmouseout="this.style.borderColor='rgba(185,149,77,0.3)'">+ Añadir otro método</button>`;
    }

    // Asegurar que los modales de pago inline existen
    if (!document.getElementById('pago-modal-tipo')) _inyectarModalesPagoInline();

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

    var habPrecio = s.precioNoche ? parseFloat(s.precioNoche) : 0;
    var habNoches = s.noches ? parseInt(s.noches) : 0;
    var habSubtotal = s.subtotalHab ? parseFloat(s.subtotalHab) : (habPrecio * habNoches);
    var habRow = habPrecio > 0 ? `
            <div class="pago-row pago-row--servicio">
                <span class="pago-servicio-nombre">Habitación ${s.habitacionTipo} <span class="pago-servicio-cant">× ${habNoches} noche${habNoches !== 1 ? 's' : ''}</span></span>
                <span class="pago-servicio-precio">
                    <span class="pago-servicio-unit">${habPrecio.toFixed(2)} €/noche</span>
                    ${habSubtotal.toFixed(2)} €
                </span>
            </div>` : '';

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
            ${habRow}
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
        if (libres > 0) {
            if (dispMsg) dispMsg.style.display = 'none';
            if (btn && btn.dataset.metodoOk !== 'false') { btn.disabled = false; btn.style.opacity = '1'; }
        } else {
            if (dispMsg) {
                dispMsg.style.display = 'block';
                dispMsg.style.color = '#e74c3c';
                dispMsg.textContent = 'Habitación ya no disponible. Otro usuario acaba de confirmar el pago.';
            }
            if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
        }
    } catch (_) {}
}

window.aplicarCodigoDescuento = async () => {
    var input = document.getElementById('pago-input-codigo');
    var msg   = document.getElementById('pago-desc-msg');
    var codigo = input ? input.value.trim() : '';
    window._pagoState.codigoDescuento = codigo;

    try {
        if (window._pagoState.reservaId !== null) {
            // Flujo existente
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
        } else {
            // Flujo nuevo: validar descuento sobre subtotal del preview
            var subtotal = window._pagoState.reservaDatos.resumenPreview.subtotal;
            var r = await fetch('/api/pagos/validar-descuento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subtotal, codigoDescuento: codigo })
            });
            if (!r.ok) {
                if (msg) { msg.textContent = 'Error al aplicar código.'; msg.className = 'pago-desc-msg pago-desc-msg--err'; }
                return;
            }
            var data = await r.json();
            var resumen = Object.assign({}, window._pagoState.reservaDatos.resumenPreview);
            resumen.descuento    = parseFloat(data.descuento) || 0;
            resumen.total        = parseFloat(data.total);
            resumen.codigoValido  = data.valido;
            resumen.codigoMensaje = data.mensaje;
            window._pagoState.resumen = resumen;
        }
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
        var r;
        if (window._pagoState.reservaId !== null) {
            // Flujo existente (ej. pagar desde Mis Reservas)
            r = await fetch('/api/pagos/confirmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservaId:       window._pagoState.reservaId,
                    metodoPagoId:    window._pagoState.metodoSeleccionadoId,
                    codigoDescuento: window._pagoState.codigoDescuento
                })
            });
        } else {
            // Flujo nuevo: crear reserva + pago en un solo paso atómico
            var datos = window._pagoState.reservaDatos;
            r = await fetch('/api/pagos/reservar-y-pagar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo:             datos.tipo,
                    fechaEntrada:     datos.fechaEntrada,
                    fechaSalida:      datos.fechaSalida,
                    servicios:        datos.servicios,
                    peticionEspecial: datos.peticionEspecial,
                    roomServiceItems: datos.roomServiceItems,
                    metodoPagoId:     window._pagoState.metodoSeleccionadoId,
                    codigoDescuento:  window._pagoState.codigoDescuento
                })
            });
        }
        if (!r.ok) {
            var errText = await r.text();
            ocultarProcesandoPago();
            if (alertEl) { alertEl.textContent = errText || 'No se pudo procesar el pago.'; alertEl.className = 'pago-alert pago-alert--err'; alertEl.style.display = 'block'; }
            // Si no hay disponibilidad, volver a habilitar el botón de reserva
            if (r.status === 409) {
                var btnConf = document.getElementById('btn-confirmar-reserva');
                if (btnConf) { btnConf.disabled = false; btnConf.textContent = typeof t === 'function' ? t('detail_confirm') : 'Confirmar Reserva'; }
            }
            return;
        }
        var data = await r.json();
        ocultarProcesandoPago();
        renderExito(data);
        if (typeof loadRooms === 'function') loadRooms();
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

// ── MODALES INLINE PARA AÑADIR MÉTODO DE PAGO DESDE CHECKOUT ─────────────

function _inyectarModalesPagoInline() {
    if (document.getElementById('pago-modal-tipo')) return;
    var html = `
    <div class="mp-modal-overlay" id="pago-modal-tipo" onclick="pagoCerrarModales(event)" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;align-items:center;justify-content:center;">
        <div class="mp-modal" onclick="event.stopPropagation()" style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:28px 24px;max-width:400px;width:90%;position:relative;">
            <button onclick="pagoCerrarModalesForzar()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#999;font-size:1.4rem;cursor:pointer;">&times;</button>
            <h3 style="color:var(--cream);font-family:Georgia,serif;font-size:1.1rem;margin-bottom:1.2rem;">Método de Pago</h3>
            <button class="mp-tipo-btn" onclick="pagoAbrirForm('TARJETA')" style="display:flex;align-items:center;gap:12px;width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(185,149,77,0.2);border-radius:8px;padding:14px;cursor:pointer;margin-bottom:8px;color:var(--cream);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <div style="flex:1;text-align:left;"><div style="font-weight:600;font-size:0.88rem;">Tarjeta</div><div style="font-size:0.7rem;color:#999;">Crédito o débito</div></div>
            </button>
            <button class="mp-tipo-btn" onclick="pagoAbrirForm('BIZUM')" style="display:flex;align-items:center;gap:12px;width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(185,149,77,0.2);border-radius:8px;padding:14px;cursor:pointer;margin-bottom:8px;color:var(--cream);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="color:#00bcd4;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5"/></svg>
                <div style="flex:1;text-align:left;"><div style="font-weight:600;font-size:0.88rem;">Bizum</div><div style="font-size:0.7rem;color:#999;">Pago instantáneo</div></div>
            </button>
            <button class="mp-tipo-btn" onclick="pagoAbrirForm('CUENTA_BANCARIA')" style="display:flex;align-items:center;gap:12px;width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(185,149,77,0.2);border-radius:8px;padding:14px;cursor:pointer;color:var(--cream);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 10v11M12 10v11M19 10v11M3 7l9-4 9 4"/></svg>
                <div style="flex:1;text-align:left;"><div style="font-weight:600;font-size:0.88rem;">Cuenta Bancaria</div><div style="font-size:0.7rem;color:#999;">Transferencia SEPA</div></div>
            </button>
        </div>
    </div>
    <div class="mp-modal-overlay" id="pago-modal-form" onclick="pagoCerrarModales(event)" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100000;align-items:center;justify-content:center;">
        <div class="mp-modal" onclick="event.stopPropagation()" style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:28px 24px;max-width:420px;width:90%;position:relative;">
            <button onclick="pagoVolverTipo()" style="position:absolute;top:12px;left:16px;background:none;border:none;color:#999;font-size:1.2rem;cursor:pointer;">←</button>
            <button onclick="pagoCerrarModalesForzar()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#999;font-size:1.4rem;cursor:pointer;">&times;</button>
            <h3 id="pago-mp-title" style="color:var(--cream);font-family:Georgia,serif;font-size:1.1rem;margin-bottom:1.2rem;">Añadir método</h3>
            <div id="pago-mp-content"></div>
            <button onclick="pagoGuardarMetodo()" style="width:100%;background:var(--gold);color:#0d0d0d;border:none;padding:12px;border-radius:6px;font-weight:700;font-size:0.85rem;letter-spacing:1px;cursor:pointer;margin-top:8px;">Añadir Método</button>
            <div id="pago-mp-alert" style="font-size:0.8rem;margin-top:10px;display:none;padding:8px 12px;border-radius:6px;"></div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

window._pagoMpTipo = null;

window.pagoAbrirModalTipo = () => {
    _inyectarModalesPagoInline();
    var el = document.getElementById('pago-modal-tipo');
    el.style.display = 'flex';
};

window.pagoVolverTipo = () => {
    document.getElementById('pago-modal-form').style.display = 'none';
    document.getElementById('pago-modal-tipo').style.display = 'flex';
};

window.pagoCerrarModalesForzar = () => {
    var t = document.getElementById('pago-modal-tipo');
    var f = document.getElementById('pago-modal-form');
    if (t) t.style.display = 'none';
    if (f) f.style.display = 'none';
};

window.pagoCerrarModales = (ev) => {
    if (ev && ev.target && ev.target.id !== 'pago-modal-tipo' && ev.target.id !== 'pago-modal-form') return;
    pagoCerrarModalesForzar();
};

window.pagoAbrirForm = (tipo) => {
    window._pagoMpTipo = tipo;
    document.getElementById('pago-modal-tipo').style.display = 'none';

    var title = document.getElementById('pago-mp-title');
    var cont  = document.getElementById('pago-mp-content');
    var labelStyle = 'display:block;font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;color:#999;margin-bottom:4px;';
    var inputStyle = 'width:100%;background:#111;border:1px solid #333;color:#f5f0e8;padding:10px 12px;border-radius:6px;font-size:0.88rem;';

    if (tipo === 'TARJETA') {
        title.textContent = 'Añadir tarjeta';
        cont.innerHTML = `
            <div style="margin-bottom:12px;"><label style="${labelStyle}">Número de tarjeta *</label><input type="text" id="pmp-numero" style="${inputStyle}" placeholder="1234 5678 9012 3456" maxlength="23"></div>
            <div style="display:flex;gap:12px;margin-bottom:12px;">
                <div style="flex:1;"><label style="${labelStyle}">Vencimiento (MM/AA) *</label><input type="text" id="pmp-caducidad" style="${inputStyle}" placeholder="MM/AA" maxlength="5" oninput="var v=this.value.replace(/[^0-9]/g,'');if(v.length>=2)v=v.slice(0,2)+'/'+v.slice(2);this.value=v;"></div>
                <div style="flex:1;"><label style="${labelStyle}">CVV *</label><input type="text" id="pmp-cvv" style="${inputStyle}" placeholder="123" maxlength="4"></div>
            </div>
            <div style="margin-bottom:12px;"><label style="${labelStyle}">Nombre en la tarjeta *</label><input type="text" id="pmp-titular" style="${inputStyle}" placeholder="Nombre completo" maxlength="80"></div>
            <div style="margin-bottom:12px;"><label style="${labelStyle}">Dirección de facturación</label><input type="text" id="pmp-direccion" style="${inputStyle}" placeholder="Calle, número, ciudad, CP" maxlength="200"></div>`;
    } else if (tipo === 'BIZUM') {
        title.textContent = 'Añadir Bizum';
        cont.innerHTML = `
            <div style="margin-bottom:12px;"><label style="${labelStyle}">Teléfono *</label><input type="text" id="pmp-telefono" style="${inputStyle}" placeholder="+34 600 000 000" maxlength="20"></div>
            <div style="margin-bottom:12px;"><label style="${labelStyle}">Nombre del titular *</label><input type="text" id="pmp-titular" style="${inputStyle}" placeholder="Nombre completo" maxlength="80"></div>`;
    } else {
        title.textContent = 'Añadir cuenta bancaria';
        cont.innerHTML = `
            <div style="margin-bottom:12px;"><label style="${labelStyle}">IBAN *</label><input type="text" id="pmp-iban" style="${inputStyle}" placeholder="ES00 0000 0000 00 0000000000" maxlength="34"></div>
            <div style="margin-bottom:12px;"><label style="${labelStyle}">Titular *</label><input type="text" id="pmp-titular" style="${inputStyle}" placeholder="Nombre completo" maxlength="80"></div>`;
    }

    document.getElementById('pago-modal-form').style.display = 'flex';
};

window.pagoGuardarMetodo = async () => {
    var tipo = window._pagoMpTipo;
    var alertEl = document.getElementById('pago-mp-alert');
    var titular = (document.getElementById('pmp-titular') || {}).value || '';

    function showErr(msg) {
        alertEl.textContent = msg;
        alertEl.style.display = 'block';
        alertEl.style.background = 'rgba(220,53,69,0.15)';
        alertEl.style.color = '#eb5757';
    }

    if (!titular || titular.trim().length < 2) { showErr('Introduce el nombre del titular.'); return; }

    var payload = { tipo: tipo, titular: titular };

    if (tipo === 'TARJETA') {
        payload.numero = (document.getElementById('pmp-numero') || {}).value || '';
        payload.caducidad = (document.getElementById('pmp-caducidad') || {}).value || '';
        payload.direccionFacturacion = (document.getElementById('pmp-direccion') || {}).value || '';
        if (payload.numero.replace(/\s+/g, '').length < 13) { showErr('Número de tarjeta inválido.'); return; }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payload.caducidad)) { showErr('Vencimiento inválido (MM/AA).'); return; }
        var parts = payload.caducidad.split('/');
        var expMonth = parseInt(parts[0]);
        var expYear = 2000 + parseInt(parts[1]);
        var now = new Date();
        if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) { showErr('La tarjeta está caducada.'); return; }
    } else if (tipo === 'BIZUM') {
        payload.telefono = (document.getElementById('pmp-telefono') || {}).value || '';
        if (payload.telefono.trim().length < 6) { showErr('Teléfono inválido.'); return; }
    } else if (tipo === 'CUENTA_BANCARIA') {
        payload.iban = (document.getElementById('pmp-iban') || {}).value || '';
        if (payload.iban.replace(/\s+/g, '').length < 16) { showErr('IBAN inválido.'); return; }
    }

    try {
        var r = await fetch('/api/perfil/metodos-pago', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!r.ok) { showErr(await r.text() || 'Error al guardar.'); return; }
        var nuevo = await r.json();
        // Cerrar modales y recargar datos de pago
        pagoCerrarModalesForzar();
        // Recargar métodos y seleccionar el nuevo
        var rMetodos = await fetch('/api/perfil/metodos-pago');
        window._pagoState.metodos = rMetodos.ok ? await rMetodos.json() : [];
        if (nuevo && nuevo.id) window._pagoState.metodoSeleccionadoId = nuevo.id;
        else if (window._pagoState.metodos.length > 0) window._pagoState.metodoSeleccionadoId = window._pagoState.metodos[0].id;
        renderPago();
    } catch (_) {
        showErr('Error de conexión.');
    }
};

window.pagoEliminarMetodo = async (id) => {
    if (!confirm('¿Eliminar este método de pago?')) return;
    try {
        var r = await fetch('/api/perfil/metodos-pago/' + id, { method: 'DELETE' });
        if (r.ok || r.status === 204) {
            var rMetodos = await fetch('/api/perfil/metodos-pago');
            window._pagoState.metodos = rMetodos.ok ? await rMetodos.json() : [];
            if (window._pagoState.metodoSeleccionadoId === id) {
                var def = window._pagoState.metodos.find(function(m) { return m.esDefault; });
                window._pagoState.metodoSeleccionadoId = def ? def.id : (window._pagoState.metodos.length > 0 ? window._pagoState.metodos[0].id : null);
            }
            renderPago();
        }
    } catch (_) {}
};
