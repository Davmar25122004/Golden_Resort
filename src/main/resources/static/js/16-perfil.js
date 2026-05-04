// ── PERFIL ────────────────────────────────────────────────────────────────────

window.showPerfil = async () => {
    var _mc = document.getElementById('main-content');
    var _dv = document.getElementById('dynamic-view');
    if (_mc) _mc.style.display = 'block';
    if (_dv && !document.getElementById('perfil-initial-loader')) {
        _dv.innerHTML = `<div class="container"><div class="perfil-loading" id="perfil-initial-loader"><div class="perfil-spinner"></div></div></div>`;
    }

    var res;
    try {
        res = await fetch('/api/perfil');
    } catch (_) {
        if (_dv) _dv.innerHTML = `<div style="padding:6rem 0;text-align:center;color:#e74c3c;">Error de conexión.</div>`;
        return;
    }

    if (res.status === 401) { window.location.href = '/'; return; }
    if (!res.ok) {
        if (_dv) _dv.innerHTML = `<div style="padding:6rem 0;text-align:center;color:#e74c3c;">Error al cargar el perfil.</div>`;
        return;
    }

    var data = await res.json();
    var initials = (data.nombre || data.email || '?').slice(0, 2).toUpperCase();
    var rolLabel = data.rol === 'ROLE_ADMIN'     ? 'Administrador'
                 : data.rol === 'ROLE_RECEPCION' ? 'Recepción'
                 : 'Cliente';
    var esOAuth   = data.esOAuth || false;
    var esCliente = data.rol === 'ROLE_CLIENTE';

    if (_dv) _dv.innerHTML = `
        <style>
        .perfil-dashboard {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 32px;
            margin-top: 2rem;
        }
        
        .perfil-sidebar {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .perfil-menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(185,149,77,0.1);
            border-radius: 12px;
            color: var(--text-muted-custom);
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            font-size: 0.82rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            position: relative;
            text-align: left;
            font-family: inherit;
        }
        
        .perfil-menu-item:hover {
            background: rgba(185,149,77,0.05);
            color: var(--gold);
            border-color: rgba(185,149,77,0.3);
            transform: translateX(4px);
        }
        
        .perfil-menu-item.active {
            background: linear-gradient(to right, rgba(185,149,77,0.15), transparent);
            color: var(--gold);
            border-color: var(--gold);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        .perfil-menu-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(185,149,77,0.1);
            color: var(--gold);
        }
        
        .perfil-menu-badge {
            margin-left: auto;
            background: var(--gold);
            color: var(--dark);
            font-size: 0.65rem;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 20px;
            min-width: 20px;
            text-align: center;
        }
        
        .perfil-tab-panel { display: none; }
        .perfil-tab-panel.active {
            display: block;
            animation: fadeInTab 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .perfil-msg-list {
            background: rgba(0,0,0,0.25);
            border: 1px solid rgba(201,168,76,0.15);
            border-radius: 6px;
            min-height: 320px;
            max-height: 460px;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 0.85rem;
        }
        .perfil-msg-bubble {
            max-width: 80%;
            padding: 0.55rem 0.85rem;
            border-radius: 8px;
            font-size: 0.9rem;
            line-height: 1.4;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        .perfil-msg-bubble--cliente {
            align-self: flex-end;
            background: rgba(201,168,76,0.18);
            border: 1px solid var(--gold);
            color: var(--cream);
            border-bottom-right-radius: 2px;
        }
        .perfil-msg-bubble--recepcion {
            align-self: flex-start;
            background: var(--dark-3);
            border: 1px solid rgba(201,168,76,0.2);
            color: var(--cream);
            border-bottom-left-radius: 2px;
        }
        .perfil-msg-meta {
            font-size: 0.65rem;
            color: var(--text-muted-custom);
            margin-top: 0.25rem;
            letter-spacing: 0.5px;
        }
        .perfil-msg-empty {
            color: var(--text-muted-custom);
            text-align: center;
            font-size: 0.85rem;
            margin: auto 0;
        }
        .perfil-msg-input-wrap {
            display: flex;
            gap: 0.5rem;
            align-items: flex-end;
        }
        .perfil-msg-input-wrap textarea {
            flex: 1;
            background: var(--dark-3);
            border: 1px solid rgba(201,168,76,0.25);
            color: var(--cream);
            padding: 0.55rem 0.7rem;
            border-radius: 4px;
            font-size: 0.9rem;
            resize: vertical;
            outline: none;
            min-height: 60px;
            max-height: 150px;
        }
        .perfil-msg-input-wrap textarea:focus { border-color: var(--gold); }
        
        @keyframes fadeInTab { 
            from { opacity: 0; transform: translateY(15px); } 
            to { opacity: 1; transform: none; } 
        }
        
        .guardada-card {
            display: flex;
            gap: 24px;
            padding: 24px;
            margin-bottom: 20px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(185,149,77,0.1);
            border-radius: 16px;
            transition: all 0.4s ease;
            position: relative;
        }
        
        .guardada-card:hover {
            border-color: var(--gold);
            background: rgba(255,255,255,0.05);
            transform: translateY(-4px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        
        .guardada-avail {
            font-size: 0.65rem;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 6px 14px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 12px;
            font-weight: 700;
        }
        
        @media (max-width: 992px) {
            .perfil-dashboard { grid-template-columns: 1fr; }
            .perfil-sidebar { 
                flex-direction: row; 
                overflow-x: auto; 
                padding-bottom: 12px;
                scrollbar-width: none;
                margin-bottom: 1rem;
            }
            .perfil-sidebar::-webkit-scrollbar { display: none; }
            .perfil-menu-item { white-space: nowrap; flex-shrink: 0; }
        }
        </style>
        
        <div class="perfil-page">
            <div class="container">
                <div class="perfil-header" style="text-align:center;padding:3rem 0;background:radial-gradient(circle at center, rgba(185,149,77,0.12) 0%, transparent 70%);border-radius:24px;margin-bottom:1rem;">
                    <div class="perfil-avatar" style="width:100px;height:100px;font-size:2.2rem;margin:0 auto 1.5rem;box-shadow:0 0 0 10px rgba(185,149,77,0.05);border:1px solid rgba(185,149,77,0.4);background:linear-gradient(135deg, #b9954d, #8e6d2f);color:#fff;">${initials}</div>
                    <h2 class="serif" style="color:var(--cream);font-size:2.8rem;margin-bottom:0.5rem;letter-spacing:1px;">${data.nombre || '\u2014'}</h2>
                    <p style="color:var(--text-muted-custom);font-size:1rem;margin-bottom:1.2rem;letter-spacing:1px;opacity:0.8;">${data.email}</p>
                    <span class="perfil-role-badge" style="background:rgba(185,149,77,0.2);color:var(--gold);padding:6px 20px;border-radius:30px;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;font-weight:700;border:1px solid var(--gold);">${rolLabel}</span>
                </div>

                <div class="perfil-dashboard">
                    <aside class="perfil-sidebar">
                        <button class="perfil-menu-item active" onclick="perfilShowTab('info',this)">
                            <span class="perfil-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                            Mi Perfil
                        </button>
                        ${esCliente ? `
                        <button class="perfil-menu-item" onclick="perfilShowTab('reservas',this)">
                            <span class="perfil-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
                            Mis Reservas
                        </button>
                        <button class="perfil-menu-item" onclick="perfilShowTab('guardadas',this)">
                            <span class="perfil-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>
                            Habitaciones Guardadas
                            <span id="guardadas-count-badge" class="perfil-menu-badge" style="display:none;"></span>
                        </button>
                        <button class="perfil-menu-item" onclick="perfilShowTab('pagos',this)">
                            <span class="perfil-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>
                            M\u00e9todos de Pago
                        </button>
                        <button class="perfil-menu-item" onclick="perfilShowTab('mensajes',this)">
                            <span class="perfil-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
                            Mensajes
                            <span id="perfil-mensajes-unread" class="perfil-menu-badge" style="display:none;"></span>
                        </button>` : ''}
                        ${data.planId ? `
                        <button class="perfil-menu-item" onclick="perfilShowTab('horario',this)">
                            <span class="perfil-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                            Mi Horario
                        </button>` : ''}
                        <button class="perfil-menu-item" onclick="perfilShowTab('seguridad',this)">
                            <span class="perfil-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                            Seguridad
                        </button>
                    </aside>

                    <main class="perfil-main" style="min-width:0;">
                        <!-- TAB: INFO -->
                        <div id="perfil-tab-info" class="perfil-tab-panel active">
                            <div class="perfil-card" style="margin-bottom:0;">
                                <div class="perfil-card-title">Detalles Personales</div>
                                <div class="perfil-info-row"><span class="perfil-field-label">Nombre</span><span class="perfil-field-value" id="perfil-nombre-display">${data.nombre || '\u2014'}</span></div>
                                <div class="perfil-info-row"><span class="perfil-field-label">Email</span><span class="perfil-field-value">${data.email}</span></div>
                                <div class="perfil-info-row"><span class="perfil-field-label">Estado de la cuenta</span><span class="perfil-field-value" style="color:#5cb85c;display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;background:#5cb85c;border-radius:50%;"></span> Activa</span></div>
                                <hr style="border-color:rgba(201,168,76,0.15);margin:2.5rem 0;">
                                <div class="perfil-card-title" style="font-size:1.1rem;margin-bottom:1.5rem;border-bottom:none;padding-bottom:0;">Actualizar Nombre</div>
                                <div class="mb-4">
                                    <input type="text" id="input-nombre" class="perfil-form-input" placeholder="Tu nombre" value="${data.nombre || ''}" maxlength="50" style="padding:12px 16px;">
                                </div>
                                <button class="perfil-btn" onclick="guardarNombre()" style="width:100%;max-width:200px;">Guardar Cambios</button>
                                <div id="alert-nombre" class="perfil-alert"></div>
                            </div>
                        </div>

                        ${esCliente ? `
<!-- TAB: RESERVAS -->
                        <div id="perfil-tab-reservas" class="perfil-tab-panel">
                            <div class="perfil-card" style="margin-bottom:0;">
                                <div class="perfil-card-title">Mis Reservas Confirmadas</div>
                                <p style="font-size:0.85rem;color:var(--text-muted-custom);margin-bottom:32px;line-height:1.6;">Aquí puedes gestionar tus estancias confirmadas y descargar tus facturas oficiales.</p>
                                <div id="reservas-lista"><div style="padding:4rem;text-align:center;"><div class="perfil-spinner" style="width:32px;height:32px;margin:0 auto;"></div></div></div>
                            </div>
                        </div>

                        <!-- TAB: GUARDADAS -->
                        <div id="perfil-tab-guardadas" class="perfil-tab-panel">
                            <div class="perfil-card" style="margin-bottom:0;">
                                <div class="perfil-card-title">Habitaciones Guardadas</div>
                                <p style="font-size:0.85rem;color:var(--text-muted-custom);margin-bottom:32px;line-height:1.6;">Estas habitaciones están reservadas temporalmente para ti. Completa el pago para asegurar tu estancia.</p>
                                <div id="guardadas-lista"><div style="padding:4rem;text-align:center;"><div class="perfil-spinner" style="width:32px;height:32px;margin:0 auto;"></div></div></div>
                            </div>
                        </div>

                        <!-- TAB: PAGOS -->
                        <div id="perfil-tab-pagos" class="perfil-tab-panel">
                            <div class="perfil-card" style="margin-bottom:0;">
                                <div class="mp-header">
                                    <div class="perfil-card-title" style="margin-bottom:0;border-bottom:none;padding-bottom:0;">M\u00e9todos de Pago</div>
                                    <button class="perfil-btn mp-btn-add" onclick="abrirModalTipoPago()" style="padding:8px 20px;">+ A\u00f1adir</button>
                                </div>
                                <div id="mp-lista" class="mp-lista"></div>
                                <div id="alert-mp" class="perfil-alert"></div>
                            </div>
                        </div>

                        <!-- TAB: MENSAJES -->
                        <div id="perfil-tab-mensajes" class="perfil-tab-panel">
                            <div class="perfil-card" style="margin-bottom:0;">
                                <div class="perfil-card-title">Mensajes con recepción</div>
                                <p style="color:var(--text-muted-custom);font-size:0.85rem;margin-bottom:1.5rem;">
                                    Escribe a recepción cualquier consulta sobre tu reserva, llegada, peticiones especiales, etc. Te responderemos lo antes posible.
                                </p>
                                <div id="perfil-msg-list" class="perfil-msg-list">
                                    <div style="text-align:center;color:var(--text-muted-custom);padding:2rem;">Cargando…</div>
                                </div>
                                <div class="perfil-msg-input-wrap">
                                    <textarea id="perfil-msg-input" maxlength="2000" placeholder="Escribe tu mensaje (máx. 2000 caracteres)…"></textarea>
                                    <button class="perfil-btn" id="perfil-msg-send" onclick="perfilEnviarMensaje()" style="white-space:nowrap;">Enviar</button>
                                </div>
                                <div id="perfil-msg-error" class="perfil-alert" style="display:none;"></div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- TAB: HORARIO -->
                        <div id="perfil-tab-horario" class="perfil-tab-panel">
                            <div class="perfil-card" style="margin-bottom:0;padding:0;overflow:hidden;">
                                <!-- Cabecera plan asignado -->
                                <div class="ph-plan-hdr">
                                    <span class="ph-plan-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                            <line x1="16" y1="2" x2="16" y2="6"/>
                                            <line x1="8" y1="2" x2="8" y2="6"/>
                                            <line x1="3" y1="10" x2="21" y2="10"/>
                                        </svg>
                                    </span>
                                    <div>
                                        <div class="ph-plan-label">Cuadrante asignado</div>
                                        <div class="ph-plan-name">${data.planNombre || '—'}</div>
                                    </div>
                                    <div class="ph-vista-tabs" style="margin-left:auto;">
                                        <button class="ph-vista-tab active" onclick="phSetVista('mes',this)">Mes</button>
                                        <button class="ph-vista-tab" onclick="phSetVista('anyo',this)">Año</button>
                                    </div>
                                </div>
                                <!-- Navegación mes/año -->
                                <div class="ph-nav">
                                    <button class="ph-nav-btn" onclick="phNavegar(-1)">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                                    </button>
                                    <span id="ph-nav-label" class="ph-nav-label">—</span>
                                    <button class="ph-nav-btn" onclick="phNavegar(1)">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                    </button>
                                </div>
                                <!-- Cuerpo del calendario -->
                                <div id="ph-cal-body" style="padding:16px;">
                                    <div style="text-align:center;color:#888;padding:3rem 0;">Cargando horario…</div>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: SEGURIDAD -->
                        <div id="perfil-tab-seguridad" class="perfil-tab-panel">
                            <div class="perfil-card" style="margin-bottom:0;">
                                <div class="perfil-card-title">Seguridad</div>
                                ${esOAuth
                                    ? `<div style="padding:3rem 2rem;text-align:center;background:rgba(255,255,255,0.02);border-radius:16px;border:1px dashed rgba(185,149,77,0.2);">
                                         <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" style="margin-bottom:1.5rem;">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                         </svg>
                                         <p style="color:var(--cream);font-size:1.1rem;margin-bottom:0.5rem;font-weight:600;">Autenticaci\u00f3n con Google</p>
                                         <p style="color:var(--text-muted-custom);font-size:0.9rem;line-height:1.6;max-width:400px;margin:0 auto;">Tu cuenta est\u00e1 protegida por Google. No es necesario gestionar una contrase\u00f1a local.</p>
                                       </div>`
                                    : `<div class="mb-3"><div class="perfil-field-label mb-2">Contrase\u00f1a actual</div><input type="password" id="input-pass-actual" class="perfil-form-input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" style="padding:12px 16px;"></div>
                                       <div class="mb-3"><div class="perfil-field-label mb-2">Nueva contrase\u00f1a</div><input type="password" id="input-pass-nueva" class="perfil-form-input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" style="padding:12px 16px;"></div>
                                       <div class="mb-4"><div class="perfil-field-label mb-2">Confirmar nueva contrase\u00f1a</div><input type="password" id="input-pass-confirm" class="perfil-form-input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" style="padding:12px 16px;"></div>
                                       <button class="perfil-btn" onclick="cambiarPassword()" style="width:100%;max-width:250px;">Actualizar Contrase\u00f1a</button>
                                       <div id="alert-pass" class="perfil-alert"></div>`
                                }
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>

        <!-- Modal: tipo -->
        <div class="mp-modal-overlay" id="mp-modal-tipo" onclick="cerrarModalesPago(event)">
            <div class="mp-modal" onclick="event.stopPropagation()">
                <button class="mp-modal-close" onclick="cerrarModalesPago()">&times;</button>
                <h3 class="mp-modal-title" style="margin-bottom:1.5rem;">M\u00e9todo de Pago</h3>
                
                <button class="mp-tipo-btn" onclick="abrirModalForm('TARJETA')">
                    <span class="mp-tipo-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </span>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:0.9rem;">Tarjeta</div>
                        <div style="font-size:0.7rem;color:var(--text-muted-custom);">Cr\u00e9dito o d\u00e9bito</div>
                    </div>
                    <span class="mp-tipo-arrow">\u203a</span>
                </button>

                <button class="mp-tipo-btn" onclick="abrirModalForm('BIZUM')">
                    <span class="mp-tipo-icon" style="background:rgba(0,188,212,0.1);color:#00bcd4;">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5"/></svg>
                    </span>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:0.9rem;">Bizum</div>
                        <div style="font-size:0.7rem;color:var(--text-muted-custom);">Pago instant\u00e1neo</div>
                    </div>
                    <span class="mp-tipo-arrow">\u203a</span>
                </button>

                <button class="mp-tipo-btn" onclick="abrirModalForm('CUENTA_BANCARIA')">
                    <span class="mp-tipo-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 10v11M12 10v11M19 10v11M3 7l9-4 9 4"/></svg>
                    </span>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:0.9rem;">Cuenta Bancaria</div>
                        <div style="font-size:0.7rem;color:var(--text-muted-custom);">Transferencia SEPA</div>
                    </div>
                    <span class="mp-tipo-arrow">\u203a</span>
                </button>
            </div>
        </div>
        <!-- Modal: form a\u00f1adir -->
        <div class="mp-modal-overlay" id="mp-modal-form" onclick="cerrarModalesPago(event)">
            <div class="mp-modal" onclick="event.stopPropagation()">
                <button class="mp-modal-back" onclick="volverModalTipo()">\u2190</button>
                <button class="mp-modal-close" onclick="cerrarModalesPago()">&times;</button>
                <h3 class="mp-modal-title" id="mp-form-title">A\u00f1adir m\u00e9todo de pago</h3>
                <div id="mp-form-content" style="margin:1.5rem 0;"></div>
                <button class="perfil-btn mp-btn-primary" onclick="guardarMetodoPago()" style="width:100%;">A\u00f1adir M\u00e9todo</button>
                <div id="alert-mp-form" class="perfil-alert"></div>
            </div>
        </div>
        <!-- Modal: editar m\u00e9todo -->
        <div class="mp-modal-overlay" id="mp-modal-editar" onclick="cerrarModalesPago(event)">
            <div class="mp-modal" onclick="event.stopPropagation()">
                <button class="mp-modal-close" onclick="cerrarModalesPago()">&times;</button>
                <h3 class="mp-modal-title">Editar m\u00e9todo de pago</h3>
                <div id="mp-editar-content" style="margin:1.5rem 0;"></div>
                <button class="perfil-btn mp-btn-primary" onclick="guardarEdicionMetodo()" style="width:100%;">Guardar Cambios</button>
                <div id="alert-mp-editar" class="perfil-alert"></div>
            </div>
        </div>
        <!-- Modal: editar reserva guardada -->
        <div class="mp-modal-overlay" id="modal-editar-guardada" onclick="if(event.target.id==='modal-editar-guardada')cerrarEditarGuardada()">
            <div class="mp-modal" onclick="event.stopPropagation()">
                <button class="mp-modal-close" onclick="cerrarEditarGuardada()">&times;</button>
                <h3 class="mp-modal-title">Modificar Fechas</h3>
                <div id="editar-guardada-content" style="margin:1.5rem 0;"></div>
                <button class="perfil-btn mp-btn-primary" onclick="guardarEdicionGuardada()" style="width:100%;">Actualizar Reserva</button>
                <div id="alert-editar-guardada" class="perfil-alert"></div>
            </div>
        </div>

    `;

    if (esCliente) {
        cargarMetodosPago();
        cargarHabitacionesGuardadas();
        cargarMisReservas();
    }
};

window.perfilShowTab = (tab, btn) => {
    document.querySelectorAll('.perfil-tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.perfil-menu-item').forEach(b => b.classList.remove('active'));
    var panel = document.getElementById('perfil-tab-' + tab);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');

    if (tab === 'mensajes') {
        perfilCargarMensajes(true);
        perfilArrancarPollingMensajes();
    } else {
        perfilPararPollingMensajes();
    }
    if (tab === 'horario') phCargarVista();
};

// ── MENSAJES (cliente ↔ recepción) ───────────────────────────────────────────

window._perfilMsgState = { conversacionId: null, pollingTimer: null };

window.perfilCargarMensajes = async (resetUnread) => {
    var cont = document.getElementById('perfil-msg-list');
    if (!cont) return;
    try {
        var r = await fetch('/api/mensajeria/mi-conversacion');
        if (!r.ok) {
            cont.innerHTML = '<div class="perfil-msg-empty">No se pudo cargar los mensajes.</div>';
            return;
        }
        var data = await r.json();
        window._perfilMsgState.conversacionId = data.id;
        var prevAtBottom = (cont.scrollHeight - cont.clientHeight - cont.scrollTop) < 20;
        if (!data.mensajes || data.mensajes.length === 0) {
            cont.innerHTML = '<div class="perfil-msg-empty">Aún no hay mensajes. Escribe al equipo de recepción.</div>';
        } else {
            cont.innerHTML = data.mensajes.map(m => {
                var cls = m.autorRol === 'CLIENTE' ? 'perfil-msg-bubble--cliente' : 'perfil-msg-bubble--recepcion';
                return `
                    <div class="perfil-msg-bubble ${cls}">
                        ${perfilEscapeHtml(m.texto)}
                        <div class="perfil-msg-meta">${perfilFormatFechaHora(m.creadoEn)}</div>
                    </div>
                `;
            }).join('');
            if (prevAtBottom || resetUnread) cont.scrollTop = cont.scrollHeight;
        }
        if (resetUnread) perfilActualizarBadgeMensajes(0);
    } catch (_) {
        cont.innerHTML = '<div class="perfil-msg-empty">Error de conexión.</div>';
    }
};

window.perfilEnviarMensaje = async () => {
    var btn = document.getElementById('perfil-msg-send');
    var input = document.getElementById('perfil-msg-input');
    var err = document.getElementById('perfil-msg-error');
    if (!btn || !input) return;
    var texto = input.value.trim();
    if (err) err.style.display = 'none';
    if (!texto) return;
    btn.disabled = true;
    try {
        var r = await fetch('/api/mensajeria/mi-conversacion/mensajes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        if (!r.ok) {
            var t = await r.text();
            if (err) { err.textContent = t || 'No se pudo enviar.'; err.style.display = 'block'; }
            return;
        }
        input.value = '';
        await perfilCargarMensajes(true);
    } catch (_) {
        if (err) { err.textContent = 'Error de conexión.'; err.style.display = 'block'; }
    } finally {
        setTimeout(() => { btn.disabled = false; }, 800);
    }
};

function perfilArrancarPollingMensajes() {
    perfilPararPollingMensajes();
    window._perfilMsgState.pollingTimer = setInterval(() => {
        if (document.hidden) return;
        perfilCargarMensajes(false);
    }, 8000);
}

function perfilPararPollingMensajes() {
    if (window._perfilMsgState.pollingTimer) {
        clearInterval(window._perfilMsgState.pollingTimer);
        window._perfilMsgState.pollingTimer = null;
    }
}

function perfilActualizarBadgeMensajes(n) {
    var el = document.getElementById('perfil-mensajes-unread');
    if (!el) return;
    if (n && n > 0) { el.textContent = n; el.style.display = 'inline-flex'; }
    else            { el.style.display = 'none'; }
}

function perfilEscapeHtml(s) {
    return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function perfilFormatFechaHora(f) {
    if (!f) return '';
    try { return new Date(f).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }
    catch (_) { return f; }
}

// ── MÉTODOS DE PAGO ───────────────────────────────────────────────────────────

window._mpTipoSeleccionado = null;
window._mpEditando         = null;

window.cargarMisReservas = async () => {
    var cont = document.getElementById('reservas-lista');
    if (!cont) return;
    try {
        var r = await fetch('/api/reservas/mis-reservas');
        if (!r.ok) { cont.innerHTML = ''; return; }
        var reservas = await r.json();

        if (!reservas.length) {
            cont.innerHTML = `<p style="color:var(--text-muted-custom);font-size:0.82rem;">A\u00fan no tienes ninguna reserva confirmada.</p>`;
            return;
        }

        var tipoLabels = { NORMAL: 'Normal', DOBLE: 'Doble', SUITE: 'Suite', LUJO: 'Lujo' };
        cont.innerHTML = reservas.map(rv => {
            var label = tipoLabels[rv.habitacionTipo] || rv.habitacionTipo;
            var img   = (TIPO_IMAGES[rv.habitacionTipo] || [])[0] || '';
            return `
            <div class="guardada-card" style="border-left:4px solid var(--gold);">
                ${img ? `<img src="${img}" style="width:88px;height:66px;object-fit:cover;border-radius:8px;flex-shrink:0;opacity:0.85;">` : ''}
                <div style="flex:1; min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                        <span style="color:var(--gold);font-size:0.6rem;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Confirmada</span>
                        <span style="width:4px;height:4px;background:rgba(185,149,77,0.3);border-radius:50%;"></span>
                        <span style="color:var(--text-muted-custom);font-size:0.65rem;">Ref: GR-${rv.id}</span>
                    </div>
                    <p style="color:var(--cream);font-size:0.92rem;font-weight:600;margin-bottom:3px;">${label} &middot; N&ordm; ${rv.habitacionNumero}</p>
                    <p style="color:var(--text-muted-custom);font-size:0.75rem;">${rv.fechaEntrada} &rarr; ${rv.fechaSalida}</p>
                </div>
            </div>`;
        }).join('');
    } catch (_) {
        if (cont) cont.innerHTML = `<p style="color:#e74c3c;font-size:0.8rem;">Error al cargar.</p>`;
    }
};

window.descargarFacturaReserva = async (reservaId) => {
    try {
        // Necesitamos el pagoId. Buscamos en el historial de pagos del usuario.
        var rp = await fetch('/api/pagos/mis-pagos');
        if (!rp.ok) throw new Error();
        var pagos = await rp.json();
        var pago = pagos.find(p => p.reservaId === reservaId && p.estado === 'COMPLETADO');
        if (!pago) { alert('No se encontr\u00f3 el registro de pago para esta reserva.'); return; }
        
        window.open('/api/pagos/' + pago.id + '/factura.pdf', '_blank');
    } catch (_) { alert('Error al obtener la factura.'); }
};

// ── HABITACIONES GUARDADAS ───────────────────────────────────────────────────────────────

window.cargarHabitacionesGuardadas = async () => {
    var cont  = document.getElementById('guardadas-lista');
    var badge = document.getElementById('guardadas-count-badge');
    if (!cont) return;
    try {
        var r = await fetch('/api/reservas/guardadas');
        if (!r.ok) { cont.innerHTML = ''; return; }
        var reservas = await r.json();

        if (badge) {
            if (reservas.length > 0) { badge.style.display = 'inline-block'; badge.textContent = reservas.length; }
            else { badge.style.display = 'none'; }
        }

        if (!reservas.length) {
            cont.innerHTML = `<p style="color:var(--text-muted-custom);font-size:0.82rem;">No tienes ninguna habitaci\u00f3n guardada pendiente de pago.</p>`;
            return;
        }

        var tipoLabels = { NORMAL: 'Normal', DOBLE: 'Doble', SUITE: 'Suite', LUJO: 'Lujo' };
        cont.innerHTML = reservas.map(rv => {
            var label = tipoLabels[rv.habitacionTipo] || rv.habitacionTipo;
            var img   = (TIPO_IMAGES[rv.habitacionTipo] || [])[0] || '';
            var noches = Math.max(1, Math.round(
                (new Date(rv.fechaSalida + 'T00:00:00') - new Date(rv.fechaEntrada + 'T00:00:00')) / 86400000
            ));
            var total = rv.total ? parseFloat(rv.total).toFixed(2) : (parseFloat(rv.precioNoche) * noches).toFixed(2);
            return `
            <div class="guardada-card">
                ${img ? `<img src="${img}" style="width:88px;height:66px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : ''}
                <div style="flex:1; min-width:0;">
                    <p style="color:var(--gold);font-size:0.68rem;letter-spacing:2px;margin-bottom:2px;">${rv.habitacionTipo}</p>
                    <p style="color:var(--cream);font-size:0.92rem;font-weight:600;margin-bottom:3px;">${label} &middot; N&ordm; ${rv.habitacionNumero}</p>
                    <p style="color:var(--text-muted-custom);font-size:0.75rem;">${rv.fechaEntrada} &rarr; ${rv.fechaSalida} &middot; ${noches} noche${noches > 1 ? 's' : ''}</p>
                    <p style="color:var(--gold);font-size:0.88rem;font-weight:700;margin-top:4px;">${total} &euro;</p>
                    <div id="avail-badge-${rv.id}" style="margin-top:5px;"></div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;flex-shrink:0;">
                    <button onclick="abrirPago(${rv.id})" style="background:var(--gold);color:var(--dark);border:none;padding:8px 18px;border-radius:6px;font-size:0.75rem;letter-spacing:1px;cursor:pointer;font-weight:700;">Pagar</button>
                    <button onclick="abrirEditarGuardada(${rv.id},'${rv.habitacionTipo}','${rv.fechaEntrada}','${rv.fechaSalida}')" style="background:transparent;color:var(--cream);border:1px solid rgba(185,149,77,0.4);padding:6px 14px;border-radius:6px;font-size:0.72rem;cursor:pointer;letter-spacing:1px;">Editar</button>
                    <button onclick="eliminarGuardada(${rv.id})" style="background:transparent;color:var(--text-muted-custom);border:1px solid rgba(154,154,154,0.2);padding:6px 14px;border-radius:6px;font-size:0.72rem;cursor:pointer;letter-spacing:1px;">Eliminar</button>
                </div>
            </div>`;
        }).join('');

        // Disponibilidad por cada reserva
        reservas.forEach(async (rv) => {
            var b2 = document.getElementById('avail-badge-' + rv.id);
            if (!b2) return;
            try {
                var dr = await fetch('/api/habitaciones/disponibles?fechaEntrada=' + rv.fechaEntrada + '&fechaSalida=' + rv.fechaSalida);
                if (!dr.ok) return;
                var disp = await dr.json();
                var libres = disp[rv.habitacionTipo] !== undefined ? parseInt(disp[rv.habitacionTipo]) : 0;
                b2.innerHTML = libres > 0
                    ? `<span class="guardada-avail" style="background:rgba(185,149,77,0.15);color:var(--gold);border:1px solid rgba(185,149,77,0.25);">${libres} habitaci${libres===1?'ó':'o'}n${libres===1?'':'es'} disponible${libres===1?'':'s'}</span>`
                    : `<span class="guardada-avail" style="background:rgba(139,26,26,0.2);color:#e74c3c;border:1px solid rgba(192,57,43,0.3);">Sin disponibilidad en estas fechas</span>`;
            } catch (_) {}
        });
    } catch (_) {
        if (cont) cont.innerHTML = `<p style="color:#e74c3c;font-size:0.8rem;">Error al cargar.</p>`;
    }
};

window.eliminarGuardada = async (id) => {
    if (!confirm('\u00bfEliminar esta reserva guardada?')) return;
    try {
        var r = await fetch('/api/reservas/' + id, { method: 'DELETE' });
        if (r.ok || r.status === 204) { cargarHabitacionesGuardadas(); }
        else { alert('No se pudo eliminar la reserva.'); }
    } catch (_) { alert('Error de conexi\u00f3n.'); }
};

window._editGuardadaId = null;

window.abrirEditarGuardada = (id, tipo, fechaEntrada, fechaSalida) => {
    window._editGuardadaId = id;
    var cont = document.getElementById('editar-guardada-content');
    if (!cont) return;
    cont.innerHTML = `
        <p style="font-size:0.7rem;letter-spacing:2px;color:var(--text-muted-custom);margin-bottom:12px;">${tipo}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <div>
                <div class="perfil-field-label mb-1">Fecha de entrada</div>
                <input type="text" id="eg-in" class="perfil-form-input" value="${fechaEntrada}" style="width:150px;">
            </div>
            <div>
                <div class="perfil-field-label mb-1">Fecha de salida</div>
                <input type="text" id="eg-out" class="perfil-form-input" value="${fechaSalida}" style="width:150px;">
            </div>
        </div>`;
    // Flatpickr si está disponible
    if (typeof flatpickr !== 'undefined' && typeof FP_CONFIG !== 'undefined') {
        flatpickr('#eg-in',  { ...FP_CONFIG, minDate: 'today' });
        flatpickr('#eg-out', { ...FP_CONFIG, minDate: 'today' });
    }
    document.getElementById('modal-editar-guardada').classList.add('is-open');
};

window.cerrarEditarGuardada = () => {
    var m = document.getElementById('modal-editar-guardada');
    if (m) m.classList.remove('is-open');
};

window.guardarEdicionGuardada = async () => {
    var id  = window._editGuardadaId;
    var inD = document.getElementById('eg-in')?.value;
    var outD= document.getElementById('eg-out')?.value;
    var alertEl = document.getElementById('alert-editar-guardada');
    if (!inD || !outD) { if(alertEl){alertEl.textContent='Selecciona ambas fechas.';alertEl.className='perfil-alert perfil-alert--err';alertEl.style.display='block';} return; }
    try {
        var r = await fetch('/api/reservas/' + id + '/fechas', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fechaEntrada: inD, fechaSalida: outD })
        });
        if (r.ok) {
            cerrarEditarGuardada();
            cargarHabitacionesGuardadas();
        } else {
            var msg = await r.text();
            if(alertEl){alertEl.textContent=msg||'Error al guardar.';alertEl.className='perfil-alert perfil-alert--err';alertEl.style.display='block';}
        }
    } catch (_) { if(alertEl){alertEl.textContent='Error de conexi\u00f3n.';alertEl.className='perfil-alert perfil-alert--err';alertEl.style.display='block';} }
};

window.cargarMetodosPago = async () => {
    var cont = document.getElementById('mp-lista');
    if (!cont) return;
    cont.innerHTML = `<div style="padding:1.5rem 0;text-align:center;color:var(--text-muted-custom);font-size:0.8rem;">Cargando...</div>`;
    try {
        var r = await fetch('/api/perfil/metodos-pago');
        if (!r.ok) throw new Error();
        var metodos = await r.json();
        if (!metodos.length) {
            cont.innerHTML = `<div class="mp-empty">Todavía no has añadido ningún método de pago.</div>`;
            return;
        }
        cont.innerHTML = metodos.map(m => renderMetodoCard(m)).join('');
    } catch (_) {
        cont.innerHTML = `<div style="padding:1rem;color:#e74c3c;font-size:0.85rem;">Error al cargar métodos de pago.</div>`;
    }
};

function renderMetodoCard(m) {
    var visual, detalle;
    if (m.tipo === 'TARJETA') {
        visual  = miniTarjetaHTML(m.marca, m.ultimosCuatro);
        detalle = `${m.marca || 'Tarjeta'} •••• ${m.ultimosCuatro || '----'}`;
    } else if (m.tipo === 'BIZUM') {
        visual  = miniBizumHTML();
        detalle = `Bizum · ${m.telefono || ''}`;
    } else {
        visual  = miniBancoHTML();
        detalle = `Cuenta · ${m.iban || ''}`;
    }
    var def = m.esDefault ? `<span class="mp-badge-default">Predeterminado</span>` : '';
    var cadTxt = m.caducidad ? ' · ' + m.caducidad : '';
    return `
        <div class="mp-card">
            ${visual}
            <div class="mp-card-body">
                <div class="mp-card-title">${detalle} ${def}</div>
                <div class="mp-card-sub">${m.titular || ''}${cadTxt}</div>
            </div>
            <div class="mp-card-actions">
                ${m.esDefault ? '' : `<button class="mp-link" onclick="marcarDefault(${m.id})">Predeterminar</button>`}
                <button class="mp-link" onclick="abrirModalEditar(${m.id})">Editar</button>
                <button class="mp-link mp-link-danger" onclick="eliminarMetodoPago(${m.id})">Eliminar</button>
            </div>
        </div>
    `;
}

function miniTarjetaHTML(marca, ultimos) {
    var cls = 'mini-card--default', logo = '<span class="mini-card-text">CARD</span>';
    if (marca === 'Visa')             { cls = 'mini-card--visa';       logo = '<span class="mini-card-text" style="font-style:italic;">VISA</span>'; }
    else if (marca === 'Mastercard')  { cls = 'mini-card--mastercard'; logo = '<span class="mini-card-mc"><span></span><span></span></span>'; }
    else if (marca === 'American Express') { cls = 'mini-card--amex';  logo = '<span class="mini-card-text">AMEX</span>'; }
    return `
        <div class="mini-card ${cls}">
            <div class="mini-card-chip"></div>
            <div class="mini-card-logo">${logo}</div>
            <div class="mini-card-num">•• ${ultimos || '----'}</div>
        </div>
    `;
}

function miniBizumHTML() {
    return `
        <div class="mini-card mini-card--bizum">
            <div class="mini-card-logo" style="justify-content:center;align-items:center;display:flex;height:100%;">
                <span class="mini-card-text" style="font-size:11px;">bizum</span>
            </div>
        </div>
    `;
}

function miniBancoHTML() {
    return `
        <div class="mini-card mini-card--bank">
            <div class="mini-card-logo" style="justify-content:center;align-items:center;display:flex;height:100%;flex-direction:column;">
                <svg width="20" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 10l9-6 9 6"/>
                    <path d="M5 10v8M12 10v8M19 10v8M3 20h18"/>
                </svg>
            </div>
        </div>
    `;
}

window.abrirModalTipoPago = () => {
    document.getElementById('mp-modal-tipo').classList.add('is-open');
};

window.volverModalTipo = () => {
    document.getElementById('mp-modal-form').classList.remove('is-open');
    document.getElementById('mp-modal-tipo').classList.add('is-open');
};

window.cerrarModalesPago = (ev) => {
    if (ev && ev.target && !ev.target.classList.contains('mp-modal-overlay')) return;
    document.getElementById('mp-modal-tipo').classList.remove('is-open');
    document.getElementById('mp-modal-form').classList.remove('is-open');
    document.getElementById('mp-modal-editar').classList.remove('is-open');
};

window.abrirModalForm = (tipo) => {
    window._mpTipoSeleccionado = tipo;
    document.getElementById('mp-modal-tipo').classList.remove('is-open');

    var title = document.getElementById('mp-form-title');
    var cont  = document.getElementById('mp-form-content');

    if (tipo === 'TARJETA') {
        title.textContent = 'Añadir una tarjeta de crédito o débito';
        cont.innerHTML = `
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Número de tarjeta *</div>
                <input type="text" id="mp-numero" class="perfil-form-input" placeholder="1234 5678 9012 3456" maxlength="23">
            </div>
            <div class="row g-3 mb-3">
                <div class="col-6">
                    <div class="perfil-field-label mb-1">Vencimiento (MM/AA) *</div>
                    <input type="text" id="mp-caducidad" class="perfil-form-input" placeholder="MM/AA" maxlength="5">
                </div>
                <div class="col-6">
                    <div class="perfil-field-label mb-1">CVV *</div>
                    <input type="text" id="mp-cvv" class="perfil-form-input" placeholder="123" maxlength="4">
                </div>
            </div>
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Nombre en la tarjeta *</div>
                <input type="text" id="mp-titular" class="perfil-form-input" placeholder="Nombre completo" maxlength="80">
            </div>
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Dirección de facturación</div>
                <input type="text" id="mp-direccion" class="perfil-form-input" placeholder="Calle, número, ciudad, CP" maxlength="200">
            </div>
        `;
    } else if (tipo === 'BIZUM') {
        title.textContent = 'Añadir una cuenta de Bizum';
        cont.innerHTML = `
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Teléfono *</div>
                <input type="text" id="mp-telefono" class="perfil-form-input" placeholder="+34 600 000 000" maxlength="20">
            </div>
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Nombre del titular *</div>
                <input type="text" id="mp-titular" class="perfil-form-input" placeholder="Nombre completo" maxlength="80">
            </div>
        `;
    } else {
        title.textContent = 'Añadir una cuenta bancaria';
        cont.innerHTML = `
            <div class="mb-3">
                <div class="perfil-field-label mb-1">IBAN *</div>
                <input type="text" id="mp-iban" class="perfil-form-input" placeholder="ES00 0000 0000 00 0000000000" maxlength="34">
            </div>
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Titular *</div>
                <input type="text" id="mp-titular" class="perfil-form-input" placeholder="Nombre completo" maxlength="80">
            </div>
        `;
    }

    document.getElementById('mp-modal-form').classList.add('is-open');
};

window.guardarMetodoPago = async () => {
    var tipo = window._mpTipoSeleccionado;
    var payload = { tipo, titular: (document.getElementById('mp-titular') || {}).value || '' };
    var alertEl = document.getElementById('alert-mp-form');

    if (!payload.titular || payload.titular.trim().length < 2) {
        mostrarAlerta(alertEl, 'err', 'Introduce el nombre del titular.');
        return;
    }

    if (tipo === 'TARJETA') {
        payload.numero     = (document.getElementById('mp-numero') || {}).value || '';
        payload.caducidad  = (document.getElementById('mp-caducidad') || {}).value || '';
        payload.direccionFacturacion = (document.getElementById('mp-direccion') || {}).value || '';
        if (payload.numero.replace(/\s+/g, '').length < 13) {
            mostrarAlerta(alertEl, 'err', 'Número de tarjeta inválido.'); return;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payload.caducidad)) {
            mostrarAlerta(alertEl, 'err', 'Vencimiento inválido (MM/AA).'); return;
        }
    } else if (tipo === 'BIZUM') {
        payload.telefono = (document.getElementById('mp-telefono') || {}).value || '';
        if (payload.telefono.trim().length < 6) {
            mostrarAlerta(alertEl, 'err', 'Teléfono inválido.'); return;
        }
    } else if (tipo === 'CUENTA_BANCARIA') {
        payload.iban = (document.getElementById('mp-iban') || {}).value || '';
        if (payload.iban.replace(/\s+/g, '').length < 16) {
            mostrarAlerta(alertEl, 'err', 'IBAN inválido.'); return;
        }
    }

    try {
        var r = await fetch('/api/perfil/metodos-pago', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!r.ok) { mostrarAlerta(alertEl, 'err', await r.text() || 'Error al guardar.'); return; }
        cerrarModalesPago({ target: { classList: { contains: () => true } } });
        cargarMetodosPago();
    } catch (_) {
        mostrarAlerta(alertEl, 'err', 'Error de conexión.');
    }
};

window.abrirModalEditar = async (id) => {
    try {
        var r = await fetch('/api/perfil/metodos-pago');
        var metodos = await r.json();
        var m = metodos.find(x => x.id === id);
        if (!m) return;
        window._mpEditando = m;

        var cont = document.getElementById('mp-editar-content');
        var camposEspecificos = '';
        if (m.tipo === 'TARJETA') {
            camposEspecificos = `
                <div class="mb-3">
                    <div class="perfil-field-label mb-1">Fecha de caducidad (MM/AA)</div>
                    <input type="text" id="mp-edit-caducidad" class="perfil-form-input" value="${m.caducidad || ''}" maxlength="5">
                </div>`;
        } else if (m.tipo === 'BIZUM') {
            camposEspecificos = `
                <div class="mb-3">
                    <div class="perfil-field-label mb-1">Teléfono</div>
                    <input type="text" id="mp-edit-telefono" class="perfil-form-input" value="${m.telefono || ''}" maxlength="20">
                </div>`;
        }
        cont.innerHTML = `
            <div style="color:var(--text-muted-custom);font-size:0.85rem;margin-bottom:1rem;">
                ${m.marca || ''} ${m.ultimosCuatro ? '•••• ' + m.ultimosCuatro : ''}${m.iban ? m.iban : ''}${m.telefono && m.tipo==='BIZUM' ? m.telefono : ''}
            </div>
            ${camposEspecificos}
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Nombre en la tarjeta</div>
                <input type="text" id="mp-edit-titular" class="perfil-form-input" value="${m.titular || ''}" maxlength="80">
            </div>
            <div class="mb-3">
                <div class="perfil-field-label mb-1">Dirección de facturación</div>
                <input type="text" id="mp-edit-direccion" class="perfil-form-input" value="${m.direccionFacturacion || ''}" maxlength="200">
            </div>
        `;
        document.getElementById('mp-modal-editar').classList.add('is-open');
    } catch (_) {}
};

window.guardarEdicionMetodo = async () => {
    var m = window._mpEditando;
    if (!m) return;
    var payload = {
        titular:              (document.getElementById('mp-edit-titular')   || {}).value,
        direccionFacturacion: (document.getElementById('mp-edit-direccion') || {}).value,
        caducidad:            (document.getElementById('mp-edit-caducidad') || {}).value,
        telefono:             (document.getElementById('mp-edit-telefono')  || {}).value
    };
    try {
        var r = await fetch('/api/perfil/metodos-pago/' + m.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!r.ok) { mostrarAlerta(document.getElementById('alert-mp-editar'), 'err', 'Error al guardar.'); return; }
        cerrarModalesPago({ target: { classList: { contains: () => true } } });
        cargarMetodosPago();
    } catch (_) {
        mostrarAlerta(document.getElementById('alert-mp-editar'), 'err', 'Error de conexión.');
    }
};

window.eliminarMetodoPago = async (id) => {
    if (!confirm('¿Eliminar este método de pago?')) return;
    try {
        var r = await fetch('/api/perfil/metodos-pago/' + id, { method: 'DELETE' });
        if (!r.ok) {
            mostrarAlerta(document.getElementById('alert-mp'), 'err', 'No se pudo eliminar.'); return;
        }
        cargarMetodosPago();
    } catch (_) {
        mostrarAlerta(document.getElementById('alert-mp'), 'err', 'Error de conexión.');
    }
};

window.marcarDefault = async (id) => {
    try {
        var r = await fetch('/api/perfil/metodos-pago/' + id + '/default', { method: 'PUT' });
        if (!r.ok) {
            mostrarAlerta(document.getElementById('alert-mp'), 'err', 'No se pudo actualizar.'); return;
        }
        cargarMetodosPago();
    } catch (_) {
        mostrarAlerta(document.getElementById('alert-mp'), 'err', 'Error de conexión.');
    }
};

window.guardarNombre = async () => {
    var input  = document.getElementById('input-nombre');
    var alert  = document.getElementById('alert-nombre');
    var nombre = input ? input.value.trim() : '';

    if (!nombre || nombre.length < 2) {
        mostrarAlerta(alert, 'err', 'El nombre debe tener al menos 2 caracteres.');
        return;
    }
    if (nombre.length > 50) {
        mostrarAlerta(alert, 'err', 'El nombre no puede superar 50 caracteres.');
        return;
    }

    try {
        var res = await fetch('/api/perfil/nombre', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
        if (res.ok) {
            mostrarAlerta(alert, 'ok', 'Nombre actualizado correctamente.');
            var display = document.getElementById('perfil-nombre-display');
            if (display) display.textContent = nombre;
            var navUser = document.getElementById('nav-user');
            if (navUser && state.user) {
                state.user.nombre = nombre;
            }
        } else {
            var msg = await res.text();
            mostrarAlerta(alert, 'err', msg || 'Error al actualizar el nombre.');
        }
    } catch (_) {
        mostrarAlerta(alert, 'err', 'Error de conexión.');
    }
};

window.cambiarPassword = async () => {
    var actual   = document.getElementById('input-pass-actual');
    var nueva    = document.getElementById('input-pass-nueva');
    var confirm  = document.getElementById('input-pass-confirm');
    var alertEl  = document.getElementById('alert-pass');

    var valActual  = actual   ? actual.value   : '';
    var valNueva   = nueva    ? nueva.value    : '';
    var valConfirm = confirm  ? confirm.value  : '';

    if (!valActual) {
        mostrarAlerta(alertEl, 'err', 'Introduce tu contraseña actual.');
        return;
    }
    if (valNueva.length < 6) {
        mostrarAlerta(alertEl, 'err', 'La nueva contraseña debe tener al menos 6 caracteres.');
        return;
    }
    if (!/[A-Z]/.test(valNueva) || !/[0-9]/.test(valNueva)) {
        mostrarAlerta(alertEl, 'err', 'La contraseña debe incluir al menos una mayúscula y un número.');
        return;
    }
    if (valNueva !== valConfirm) {
        mostrarAlerta(alertEl, 'err', 'Las contraseñas no coinciden.');
        return;
    }

    try {
        var res = await fetch('/api/perfil/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actual: valActual, nueva: valNueva })
        });
        if (res.ok) {
            mostrarAlerta(alertEl, 'ok', 'Contraseña actualizada correctamente.');
            if (actual) actual.value = '';
            if (nueva)  nueva.value  = '';
            if (confirm) confirm.value = '';
        } else {
            var msg = await res.text();
            mostrarAlerta(alertEl, 'err', msg || 'Error al cambiar la contraseña.');
        }
    } catch (_) {
        mostrarAlerta(alertEl, 'err', 'Error de conexión.');
    }
};

function mostrarAlerta(el, tipo, msg) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'perfil-alert perfil-alert--' + tipo;
    el.style.display = 'block';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
}

// ── MI HORARIO (calendario personal) ─────────────────────────────────────────

var _phState = { vista: 'mes', anyo: new Date().getFullYear(), mes: new Date().getMonth() };
var _phCache = {};   // key "YYYY-MM" → array de dias

window.phSetVista = (vista, btn) => {
    _phState.vista = vista;
    document.querySelectorAll('.ph-vista-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    _phCache = {};
    phCargarVista();
};

window.phNavegar = (delta) => {
    if (_phState.vista === 'mes') {
        _phState.mes += delta;
        if (_phState.mes < 0)  { _phState.mes = 11; _phState.anyo--; }
        if (_phState.mes > 11) { _phState.mes = 0;  _phState.anyo++; }
    } else {
        _phState.anyo += delta;
    }
    phCargarVista();
};

function phPad(n) { return n < 10 ? '0' + n : '' + n; }
function phDiasEnMes(a, m) { return new Date(a, m + 1, 0).getDate(); }

var _PH_MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var _PH_DIAS  = ['L','M','X','J','V','S','D'];

async function phCargarVista() {
    var label = document.getElementById('ph-nav-label');
    var body  = document.getElementById('ph-cal-body');
    if (!body) return;
    _phDayMap = {};

    var { vista, anyo, mes } = _phState;

    if (vista === 'mes') {
        if (label) label.textContent = _PH_MESES[mes].toUpperCase() + ' ' + anyo;
        var desde = `${anyo}-${phPad(mes+1)}-01`;
        var hasta = `${anyo}-${phPad(mes+1)}-${phPad(phDiasEnMes(anyo, mes))}`;
        var dias  = await phFetch(desde, hasta);
        body.innerHTML = phRenderMes(anyo, mes, dias);

    } else {
        if (label) label.textContent = String(anyo);
        var desde = `${anyo}-01-01`;
        var hasta = `${anyo}-12-31`;
        var dias  = await phFetch(desde, hasta);
        body.innerHTML = phRenderAnyo(anyo, dias);
    }
}

async function phFetch(desde, hasta) {
    var key = desde + '_' + hasta;
    if (_phCache[key]) return _phCache[key];
    try {
        var r = await fetch('/api/mi-horario?from=' + desde + '&to=' + hasta);
        if (!r.ok) return [];
        var data = await r.json();
        _phCache[key] = data;
        return data;
    } catch (_) { return []; }
}

function phRenderMes(anyo, mes, dias) {
    var porFecha = {};
    dias.forEach(d => porFecha[d.fecha] = d);
    var total  = phDiasEnMes(anyo, mes);
    var primer = (new Date(anyo, mes, 1).getDay() + 6) % 7;
    var hoy    = new Date();
    var html   = '<div class="ph-cal-grid">';
    _PH_DIAS.forEach(l => html += `<div class="ph-cal-hdr">${l}</div>`);
    for (var i = 0; i < primer; i++) html += '<div class="ph-cal-celda ph-cal-vacia"></div>';
    for (var d = 1; d <= total; d++) {
        var fecha = `${anyo}-${phPad(mes+1)}-${phPad(d)}`;
        var info  = porFecha[fecha];
        var color = info && info.color ? info.color : null;
        var esHoy = (anyo === hoy.getFullYear() && mes === hoy.getMonth() && d === hoy.getDate());
        var slotsHtml = '';
        if (info && info.slots && info.slots.length) {
            slotsHtml = info.slots.map(s => `<span class="ph-slot">${s.from}–${s.to}</span>`).join('');
        }
        var borderStyle = color ? `border-bottom: 3px solid ${color};` : '';
        var bgStyle     = color ? `background: linear-gradient(180deg, rgba(0,0,0,0) 70%, ${color}22 100%);` : '';
        html += `
        <div class="ph-cal-celda ${esHoy ? 'ph-cal-hoy' : ''} ${color ? 'ph-cal-con-perfil' : ''}"
             style="${borderStyle}${bgStyle}"
             onclick="phMostrarDetalle('${fecha}', ${JSON.stringify(info || null).replace(/"/g,'&quot;')})">
            <span class="ph-cal-num">${d}</span>
            ${info && info.perfil_nombre ? `<span class="ph-cal-perf" style="color:${color||'#c9a96e'}">${info.perfil_nombre}</span>` : ''}
            <div class="ph-cal-slots">${slotsHtml}</div>
        </div>`;
    }
    html += '</div>';
    return html;
}

function phRenderSemana(lunes, dias) {
    var porFecha = {};
    dias.forEach(d => porFecha[d.fecha] = d);
    var hoy = new Date();
    var html = '<div class="ph-semana">';
    for (var i = 0; i < 7; i++) {
        var fecha = new Date(lunes); fecha.setDate(lunes.getDate() + i);
        var key   = fecha.toISOString().slice(0,10);
        var info  = porFecha[key];
        var color = info && info.color ? info.color : null;
        var esHoy = (fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate());
        var slots = info && info.slots ? info.slots : [];
        html += `
        <div class="ph-semana-col ${esHoy ? 'ph-semana-hoy' : ''}" style="${color ? 'border-top:4px solid '+color+';' : ''}">
            <div class="ph-semana-dia">${_PH_DIAS[i]}</div>
            <div class="ph-semana-fecha">${phPad(fecha.getDate())}/${phPad(fecha.getMonth()+1)}</div>
            <div class="ph-semana-perf">${info && info.perfil_nombre ? info.perfil_nombre : '—'}</div>
            <div class="ph-semana-slots">
                ${slots.length ? slots.map(s => `<span class="ph-slot">${s.from}–${s.to}</span>`).join('') : '<span style="color:#555;font-size:0.68rem;">Libre</span>'}
            </div>
        </div>`;
    }
    html += '</div>';
    return html;
}

var _phDayMap = {};   // fecha → info, para que los onclick de mini-celdas puedan acceder

function phRenderAnyo(anyo, dias) {
    var porFecha = {};
    dias.forEach(d => { porFecha[d.fecha] = d; _phDayMap[d.fecha] = d; });
    var html = '<div class="ph-anyo-grid">';
    for (var m = 0; m < 12; m++) {
        var total  = phDiasEnMes(anyo, m);
        var primer = (new Date(anyo, m, 1).getDay() + 6) % 7;
        var hoy    = new Date();
        html += `<div class="ph-mini-mes">
            <div class="ph-mini-mes-hdr">${_PH_MESES[m]}</div>
            <div class="ph-cal-grid ph-cal-grid--mini">`;
        _PH_DIAS.forEach(l => html += `<div class="ph-cal-hdr">${l}</div>`);
        for (var i = 0; i < primer; i++) html += '<div class="ph-cal-celda ph-cal-vacia"></div>';
        for (var d = 1; d <= total; d++) {
            var fecha = `${anyo}-${phPad(m+1)}-${phPad(d)}`;
            var info  = porFecha[fecha];
            var color = info && info.color ? info.color : null;
            var esHoy = (anyo === hoy.getFullYear() && m === hoy.getMonth() && d === hoy.getDate());
            var cursor = info && info.perfil_nombre ? 'cursor:pointer;' : 'cursor:default;';
            html += `<div class="ph-cal-celda ph-cal-celda--mini ${esHoy ? 'ph-cal-hoy' : ''}"
                        style="${color ? 'background:'+color+'33;border-bottom:2px solid '+color+';' : ''}${cursor}"
                        title="${info && info.perfil_nombre ? info.perfil_nombre : ''}"
                        onclick="phClickDia('${fecha}')">
                        <span class="ph-cal-num">${d}</span>
                    </div>`;
        }
        html += '</div></div>';
    }
    html += '</div>';
    return html;
}

window.phClickDia = (fecha) => {
    var info = _phDayMap[fecha];
    if (info) phMostrarDetalle(fecha, info);
};

window.phMostrarDetalle = (fecha, info) => {
    if (!info || !info.perfil_nombre) return;
    var slots = (info.slots || []).map(s => `<span class="ph-slot" style="font-size:0.88rem;padding:4px 12px;">${s.from} – ${s.to}</span>`).join('') || '<span style="color:#888;font-size:0.85rem;">Sin tramos definidos</span>';
    var color = info.color || '#c9a96e';
    var esOverride = info.override ? '<div style="font-size:0.65rem;color:#f783ac;letter-spacing:1px;margin-top:4px;">Día especial (override)</div>' : '';
    phOpenModal(`
        <div style="text-align:center;padding-bottom:8px;">
            <div style="font-size:0.65rem;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:8px;">${fecha}</div>
            <div style="font-size:1.6rem;font-weight:700;color:${color};font-family:'Cormorant Garamond',serif;letter-spacing:1px;">${info.perfil_nombre}</div>
            ${esOverride}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:20px 0;">
            ${slots}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
            <button onclick="phCloseModal()" style="background:var(--gold);color:#111;border:none;border-radius:999px;padding:8px 24px;font-size:0.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;">Cerrar</button>
        </div>
    `);
};

function phOpenModal(html) {
    phCloseModal();
    var div = document.createElement('div');
    div.id = 'ph-modal';
    div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
    div.innerHTML = `<div style="background:#161616;border:1px solid rgba(201,168,76,0.35);border-radius:10px;padding:1.6rem 1.8rem;width:100%;max-width:420px;color:#f5f0e8;box-shadow:0 20px 60px rgba(0,0,0,0.7);">${html}</div>`;
    div.addEventListener('click', e => { if (e.target === div) phCloseModal(); });
    document.body.appendChild(div);
}

function phCloseModal() {
    var m = document.getElementById('ph-modal');
    if (m) m.remove();
}
