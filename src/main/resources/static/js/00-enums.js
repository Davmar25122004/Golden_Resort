// ── ENUMS HELPER ───────────────────────────────────────────────────────────
// Carga los enums desde /api/enums y expone helpers globales en window.ENUMS.
// Los datos de fallback están disponibles inmediatamente (síncronos).
// El fetch actualiza _data si el servidor devuelve valores distintos.
(function () {

    var _data = {
        roles: [
            { value: 'ROLE_ADMIN',     label: 'Administrador',       badgeClass: 'admin-badge--admin' },
            { value: 'ROLE_RECEPCION', label: 'Recepción',           badgeClass: 'admin-badge--recepcion' },
            { value: 'ROLE_LIMPIEZA',  label: 'Limpieza',            badgeClass: 'admin-badge--limpieza' },
            { value: 'ROLE_GIMNASIO',  label: 'Monitor de Gimnasio', badgeClass: 'admin-badge--gimnasio' }
        ],
        departamentos: [
            { value: 'RECEPCION',     label: 'Recepción' },
            { value: 'LIMPIEZA',      label: 'Limpieza' },
            { value: 'COCINA',        label: 'Cocina' },
            { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
            { value: 'DIRECCION',     label: 'Dirección' },
            { value: 'OTRO',          label: 'Otro' }
        ],
        tiposHabitacion: [
            { value: 'NORMAL', label: 'Normal' },
            { value: 'DOBLE',  label: 'Doble' },
            { value: 'SUITE',  label: 'Suite' },
            { value: 'LUJO',   label: 'Lujo' }
        ],
        estadosLimpieza: [
            { value: 'LIMPIA',        label: 'Limpia',        cssClass: 'estado-limpia',        badge: 'bg-success' },
            { value: 'SUCIA',         label: 'Sucia',         cssClass: 'estado-sucia',         badge: 'bg-warning text-dark' },
            { value: 'EN_LIMPIEZA',   label: 'En limpieza',   cssClass: 'estado-progreso',      badge: 'bg-info text-dark' },
            { value: 'MANTENIMIENTO', label: 'Mantenimiento', cssClass: 'estado-mantenimiento', badge: 'bg-danger' }
        ],
        estadosPago: [
            { value: 'PENDIENTE',   label: 'Pendiente',   pill: 'rcp-pill rcp-pill--warn' },
            { value: 'COMPLETADO',  label: 'Completado',  pill: 'rcp-pill rcp-pill--ok' },
            { value: 'CANCELADO',   label: 'Cancelado',   pill: 'rcp-pill rcp-pill--err' },
            { value: 'REEMBOLSADO', label: 'Reembolsado', pill: 'rcp-pill rcp-pill--warn' }
        ],
        estadosConversacion: [
            { value: 'ABIERTA',   label: 'Abierta' },
            { value: 'PENDIENTE', label: 'Pendiente' },
            { value: 'RESUELTA',  label: 'Resuelta' }
        ],
        prioridades: [
            { value: 'BAJA',    label: 'Baja',    badge: 'bg-dark' },
            { value: 'NORMAL',  label: 'Normal',  badge: 'bg-secondary' },
            { value: 'ALTA',    label: 'Alta',    badge: 'bg-warning text-dark' },
            { value: 'URGENTE', label: 'Urgente', badge: 'bg-danger' }
        ],
        tiposIncidencia: [
            { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
            { value: 'INVENTARIO',    label: 'Inventario' },
            { value: 'OTRO',          label: 'Otro' }
        ],
        estadosIncidencia: [
            { value: 'ABIERTA',    label: 'Abierta' },
            { value: 'EN_PROCESO', label: 'En proceso' },
            { value: 'RESUELTA',   label: 'Resuelta' }
        ],
        tiposEmpleado: [
            { value: 'PERSONAL', label: 'Personal' },
            { value: 'BECARIO',  label: 'Becario' }
        ],
        tiposContratacion: [
            { value: 'INDEFINIDO', label: 'Indefinido' },
            { value: 'TEMPORAL',   label: 'Temporal' },
            { value: 'POR_OBRA',   label: 'Por obra' },
            { value: 'PRACTICAS',  label: 'Prácticas' }
        ],
        tiposDocumento: [
            { value: 'DNI',       label: 'DNI' },
            { value: 'NIE',       label: 'NIE' },
            { value: 'PASAPORTE', label: 'Pasaporte' },
            { value: 'CEDULA',    label: 'Cédula' },
            { value: 'OTRO',      label: 'Otro' }
        ]
    };

    function _find(key, value) {
        var list = _data[key] || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].value === value) return list[i];
        }
        return null;
    }

    window.ENUMS = {
        get: function (key) { return _data[key] || []; },

        // ── Roles ──────────────────────────────────────────────────────────
        rolLabel: function (r) {
            var item = _find('roles', r);
            return item ? item.label : (r ? r.replace(/^ROLE_/, '') : '—');
        },
        rolBadgeClass: function (r) {
            var item = _find('roles', r);
            return item ? item.badgeClass : '';
        },

        // ── Limpieza ───────────────────────────────────────────────────────
        estadoLimpiezaLabel: function (e) {
            var item = _find('estadosLimpieza', e);
            return item ? item.label : (e || '—');
        },
        estadoLimpiezaCss: function (e) {
            var item = _find('estadosLimpieza', e);
            return item ? item.cssClass : '';
        },
        estadoLimpiezaBadge: function (e) {
            var item = _find('estadosLimpieza', e);
            return item ? item.badge : 'bg-secondary';
        },

        // ── Prioridades ────────────────────────────────────────────────────
        prioridadLabel: function (p) {
            var item = _find('prioridades', p);
            return item ? item.label : (p || '—');
        },
        prioridadBadge: function (p) {
            var item = _find('prioridades', p);
            return item ? item.badge : 'bg-secondary';
        },

        // ── Habitaciones ───────────────────────────────────────────────────
        tipoHabLabel: function (t) {
            var item = _find('tiposHabitacion', t);
            return item ? item.label : (t || '—');
        },

        // ── Pagos ──────────────────────────────────────────────────────────
        estadoPagoLabel: function (e) {
            var item = _find('estadosPago', e);
            return item ? item.label : (e || '—');
        },
        estadoPagoPill: function (e) {
            var item = _find('estadosPago', e);
            return item ? item.pill : 'rcp-pill';
        },

        // ── Conversación ───────────────────────────────────────────────────
        estadoConvLabel: function (e) {
            var item = _find('estadosConversacion', e);
            return item ? item.label : (e || '—');
        },

        // ── Selectores ─────────────────────────────────────────────────────
        // Devuelve HTML de <option> tags para un enum
        selectOptions: function (key, emptyLabel) {
            var html = emptyLabel !== undefined ? '<option value="">' + emptyLabel + '</option>' : '';
            (_data[key] || []).forEach(function (item) {
                html += '<option value="' + item.value + '">' + item.label + '</option>';
            });
            return html;
        },

        // Devuelve array [[value, label], ...] listo para _nempSelect
        toOptionPairs: function (key, emptyPair) {
            var pairs = emptyPair ? [emptyPair] : [];
            (_data[key] || []).forEach(function (item) {
                pairs.push([item.value, item.label]);
            });
            return pairs;
        },

        // Rellena un <select> por ID
        fillSelect: function (selectId, key, emptyLabel) {
            var sel = document.getElementById(selectId);
            if (!sel) return;
            sel.innerHTML = this.selectOptions(key, emptyLabel);
        }
    };

    // Intenta refrescar desde la API (no bloquea; actualiza _data para llamadas futuras)
    fetch('/api/enums')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            if (!data) return;
            Object.keys(data).forEach(function (key) {
                if (Array.isArray(data[key]) && data[key].length > 0) _data[key] = data[key];
            });
        })
        .catch(function () {});

})();
