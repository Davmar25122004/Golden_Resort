/**
 * 15-accessibility.js
 * Menú de accesibilidad: icono flotante + panel lateral
 * Versión Turismo: A+/A-, Fuente Legible, Resaltar Enlaces, Restablecer
 * Las preferencias se guardan en localStorage.
 */
(function () {
    'use strict';

    /* ── Estado ─────────────────────────────────────────── */
    const STORAGE_KEY = 'hoteldaw_acc';

    const defaults = {
        fontScale:         100,     // 100, 110, 120, 130, 140
        legibleFont:       false,
        underlineLinks:    false,
        disableAnimations: false,
    };

    let state = Object.assign({}, defaults);

    /* ── Persistencia ───────────────────────────────────── */
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) state = Object.assign({}, defaults, JSON.parse(saved));
        } catch (_) {}
    }

    function saveState() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    }

    /* ── Aplicar clases al body ─────────────────────────── */
    function applyAll() {
        const b = document.body;
        const html = document.documentElement;

        // Escala de fuente (aplicada al HTML para afectar a REMs)
        html.style.fontSize = state.fontScale === 100 ? '' : state.fontScale + '%';

        // Toggles
        b.classList.toggle('acc-legible-font',      state.legibleFont);
        b.classList.toggle('acc-underline-links',    state.underlineLinks);
        b.classList.toggle('acc-no-animations',    state.disableAnimations);

        updateButtonStates();
    }

    /* ── Sincronizar botones activos ────────────────────── */
    function updateButtonStates() {
        // Toggles
        const toggles = {
            'acc-legible':    state.legibleFont,
            'acc-underline':  state.underlineLinks,
            'acc-no-anim':    state.disableAnimations,
        };
        Object.entries(toggles).forEach(([id, active]) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('acc-active', active);
        });

        // Deshabilitar botones de escala si llegamos a límites
        const btnMinus = document.getElementById('acc-fs-minus');
        const btnPlus  = document.getElementById('acc-fs-plus');
        if (btnMinus) btnMinus.disabled = (state.fontScale <= 100);
        if (btnPlus)  btnPlus.disabled  = (state.fontScale >= 130);
    }

    /* ── HTML del widget ────────────────────────────────── */
    const WIDGET_HTML = `
<!-- ACCESIBILIDAD: overlay -->
<div id="acc-overlay" aria-hidden="true"></div>

<!-- ACCESIBILIDAD: botón flotante (sticky) -->
<button id="acc-toggle-btn" aria-label="Abrir menú de accesibilidad" aria-expanded="false" aria-controls="acc-panel">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="26" height="26">
        <circle cx="12" cy="3.5" r="2"/>
        <path d="M17.5 8.5H13V7h-2v1.5H6.5v2H11v2.8l-2.8 5.2H6.1l-1 1.8 1.8 1 1-1.8h1.6L12 14.9l2.5 4.6H16l1-1.8-1.8-1-2-3.7V10.5h4.3v-2z"/>
    </svg>
</button>

<!-- ACCESIBILIDAD: panel lateral -->
<aside id="acc-panel" role="complementary" aria-label="Opciones de accesibilidad" aria-hidden="true">

    <div class="acc-panel-header">
        <p class="acc-panel-title">Accesibilidad</p>
        <button class="acc-close-btn" id="acc-close-btn" aria-label="Cerrar menú de accesibilidad">✕</button>
    </div>

    <div class="acc-panel-body">

        <!-- Tamaño de fuente -->
        <div class="acc-section">
            <p class="acc-section-label">Tamaño de texto</p>
            <div class="acc-btn-row">
                <button class="acc-btn acc-btn-split" id="acc-fs-minus" onclick="accAdjustFont(-10)" aria-label="Reducir texto">
                    <span class="acc-icon-text">A-</span>
                    Reducir
                </button>
                <button class="acc-btn acc-btn-split" id="acc-fs-plus" onclick="accAdjustFont(10)" aria-label="Aumentar texto">
                    <span class="acc-icon-text">A+</span>
                    Aumentar
                </button>
            </div>
        </div>

        <!-- Tipografía y Enlaces -->
        <div class="acc-section">
            <p class="acc-section-label">Ajustes visuales</p>
            <div class="acc-btn-grid">
                <button class="acc-btn" id="acc-legible" onclick="accToggle('legibleFont')" aria-pressed="false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                    Fuente Legible
                </button>
                <button class="acc-btn" id="acc-underline" onclick="accToggle('underlineLinks')" aria-pressed="false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
                    Resaltar Enlaces
                </button>
            </div>
            <div class="acc-btn-single">
                <button class="acc-btn acc-btn--small" id="acc-no-anim" onclick="accToggle('disableAnimations')" aria-pressed="false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Quitar Animaciones
                </button>
            </div>
        </div>

        <!-- Reset -->
        <div class="acc-section acc-section-bottom">
            <button class="acc-reset-btn" onclick="accReset()" aria-label="Restablecer configuración">
                ↺ Restablecer ajustes
            </button>
        </div>

    </div>
</aside>
`;

    /* ── Inyectar widget en el DOM ──────────────────────── */
    function injectWidget() {
        const container = document.createElement('div');
        container.innerHTML = WIDGET_HTML.trim();
        while (container.firstChild) {
            document.body.appendChild(container.firstChild);
        }
        bindEvents();
    }

    /* ── Eventos del panel ──────────────────────────────── */
    function bindEvents() {
        const toggleBtn = document.getElementById('acc-toggle-btn');
        const closeBtn  = document.getElementById('acc-close-btn');
        const overlay   = document.getElementById('acc-overlay');

        if (toggleBtn) toggleBtn.addEventListener('click', openPanel);
        if (closeBtn)  closeBtn.addEventListener('click',  closePanel);
        if (overlay)   overlay.addEventListener('click',   closePanel);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closePanel();
        });
    }

    function openPanel() {
        const panel     = document.getElementById('acc-panel');
        const overlay   = document.getElementById('acc-overlay');
        const toggleBtn = document.getElementById('acc-toggle-btn');

        if (!panel) return;
        panel.classList.add('acc-panel-open');
        panel.setAttribute('aria-hidden', 'false');
        if (overlay)   overlay.classList.add('acc-overlay-visible');
        if (toggleBtn) {
            toggleBtn.classList.add('acc-open');
            toggleBtn.setAttribute('aria-expanded', 'true');
        }
        const firstFocusable = panel.querySelector('button, [href], input');
        if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
    }

    function closePanel() {
        const panel     = document.getElementById('acc-panel');
        const overlay   = document.getElementById('acc-overlay');
        const toggleBtn = document.getElementById('acc-toggle-btn');

        if (!panel) return;
        panel.classList.remove('acc-panel-open');
        panel.setAttribute('aria-hidden', 'true');
        if (overlay)   overlay.classList.remove('acc-overlay-visible');
        if (toggleBtn) {
            toggleBtn.classList.remove('acc-open');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    /* ── API pública ── */
    window.accAdjustFont = function (delta) {
        let newScale = state.fontScale + delta;
        if (newScale < 100) newScale = 100;
        if (newScale > 130) newScale = 130;
        state.fontScale = newScale;
        saveState();
        applyAll();
    };

    window.accToggle = function (key) {
        if (key === 'legibleFont')       state.legibleFont       = !state.legibleFont;
        if (key === 'underlineLinks')     state.underlineLinks    = !state.underlineLinks;
        if (key === 'disableAnimations') state.disableAnimations = !state.disableAnimations;

        const map = {
            legibleFont:       'acc-legible',
            underlineLinks:    'acc-underline',
            disableAnimations: 'acc-no-anim',
        };
        const btn = document.getElementById(map[key]);
        if (btn) btn.setAttribute('aria-pressed', String(state[key]));

        saveState();
        applyAll();
    };

    window.accReset = function () {
        state = Object.assign({}, defaults);
        saveState();
        applyAll();
        ['acc-legible','acc-underline','acc-no-anim'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('aria-pressed', 'false');
        });
    };

    /* ── Init ───────────────────────────────────────────── */
    function init() {
        loadState();
        injectWidget();
        applyAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
