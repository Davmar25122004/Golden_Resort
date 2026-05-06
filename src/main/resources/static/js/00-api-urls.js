// ── API URL CONSTANTS ──────────────────────────────────────────────────────
// Centraliza todas las rutas de API. Importar antes de cualquier otro script.
var API = {
    ENUMS:      '/api/enums',
    HOTEL_INFO: '/api/hotel/info',

    HABITACIONES: '/api/habitaciones',
    RESERVAS:     '/api/reservas',

    PAGOS: {
        BASE:    '/api/pagos',
        ESTADOS: '/api/pagos/estados'
    },

    PERFIL: {
        BASE:         '/api/perfil',
        EMPLEADO:     '/api/perfil/empleado',
        METODOS_PAGO: '/api/perfil/metodos-pago'
    },

    AUTH: {
        REGISTER:  '/api/auth/register',
        CONFIRMAR: '/api/auth/confirmar-verificacion'
    },

    MENSAJERIA: {
        BASE:         '/api/mensajeria',
        RECEPCION:    '/api/mensajeria/recepcion',
        CONVERSACION: '/api/mensajeria/mi-conversacion'
    },

    LIMPIEZA: {
        BASE:          '/api/limpieza',
        PANEL:         '/api/limpieza/panel',
        TAREAS:        '/api/limpieza/tareas',
        INCIDENCIAS:   '/api/limpieza/incidencias',
        OBJETOS:       '/api/limpieza/objetos-perdidos',
        CALENDARIO:    '/api/limpieza/calendario',
        SALIDAS_HOY:   '/api/limpieza/generar-salidas-hoy',
        HABITACIONES:  '/api/limpieza/habitaciones'
    },

    GIMNASIO: {
        CALENDARIO: '/api/gimnasio/calendario',
        OBJETOS:    '/api/limpieza/objetos-perdidos'
    },

    RECEPCION: {
        BASE:       '/api/recepcion',
        CALENDARIO: '/api/recepcion/calendario',
        PETICIONES: '/api/recepcion/peticiones'
    },

    ADMIN: {
        BASE:         '/api/admin',
        STATS:        '/api/admin/stats',
        STATS_SERIES: '/api/admin/stats/series',
        USUARIOS:     '/api/admin/usuarios',
        ROLES:        '/api/admin/roles',
        HABITACIONES: '/api/admin/habitaciones',
        SERVICIOS:    '/api/admin/servicios',
        TURNO:        '/api/admin/turno'
    }
};
