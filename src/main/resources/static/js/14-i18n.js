// ── INTERNACIONALIZACIÓN (i18n) ───────────────────────────────────────────────

window.LANG = localStorage.getItem('lang') || 'es';

window.TRANSLATIONS = {
  es: {
    // NAV
    nav_rooms:        'Habitaciones',
    nav_services:     'Servicios',
    nav_contact:      'Contacto',
    nav_my_bookings:  'Mis Reservas',
    nav_admin:        'Admin',
    nav_book:         'Reservar',
    nav_signin:       'Iniciar Sesión',
    nav_signout:      'Cerrar Sesión',

    // HERO
    hero_welcome:     'Bienvenido a',
    hero_tagline:     'Lujo · Distinción · Confort',
    hero_checkin:     'Fecha de Entrada',
    hero_checkout:    'Fecha de Salida',
    hero_search:      'Buscar',

    // SECTIONS
    rooms_label:      'Nuestras Suites',
    rooms_title:      'Habitaciones',
    services_label:   'Lo que ofrecemos',
    services_title:   'Servicios',
    contact_label:    'Estamos aquí',
    contact_title:    'Info. Contacto',
    contact_location: 'Localización',
    contact_contact:  'Contáctanos',
    contact_coords:   'Coordenadas',
    contact_follow:   'Síguenos',
    contact_map_cta:  'Ver en Google Maps →',

    // FOOTER
    footer_rights:    '© 2026 Golden Resort · Todos los derechos reservados',

    // AUTH
    auth_signin_tab:  'Iniciar Sesión',
    auth_register_tab:'Registrarse',
    auth_email:       'Email',
    auth_password:    'Contraseña',
    auth_name:        'Nombre',
    auth_enter:       'Entrar',
    auth_create:      'Crear Cuenta',
    auth_or:          'o',
    auth_google:      'Continuar con Google',
    auth_error_login: 'Email o contraseña incorrectos.',
    auth_error_reg:   'Error al registrarse.',
    auth_error_conn:  'Error de conexión.',

    // ROOM TYPES
    tipo_normal: 'Habitación Normal',
    tipo_doble:  'Habitación Doble',
    tipo_suite:  'Suite',
    tipo_lujo:   'Suite de Lujo',

    // ROOM CARD
    room_available:  '● Disponible',
    room_left:       '● Quedan ',
    room_no_avail:   '● Sin disponibilidad',
    room_see_photos: 'Ver fotos',
    room_per_night:  '/ noche',
    room_book:       'Reservar',
    room_no_rooms:   'No hay habitaciones disponibles para esas fechas.',

    // ROOM DETAIL
    detail_label:           'Golden Resort · Nuestras Suites',
    detail_selected_dates:  'Fechas seleccionadas:',
    detail_arrival:         'LLEGADA',
    detail_departure:       'SALIDA',
    detail_add_services:    'SERVICIOS ADICIONALES',
    detail_no_services:     'No hay servicios adicionales disponibles.',
    detail_total_estimate:  'Total estimado: ',
    detail_confirm:         'Confirmar Reserva',
    detail_booking:         'Reservando...',
    detail_booked:          'Reservado',
    detail_confirmed_msg:   '¡Reserva confirmada! Tu habitación ha sido reservada.',
    detail_no_rooms_dates:  'No hay habitaciones disponibles de ese tipo para las fechas seleccionadas.',
    detail_error_reserva:   'Error al procesar la reserva. Inténtalo de nuevo.',
    detail_error_conn:      'Error de conexión. Inténtalo de nuevo.',
    detail_select_dates:    'Por favor selecciona las fechas de entrada y salida.',
    detail_rs_subtotal:     'Subtotal room service: ',
    detail_special_request_label:       'PETICIÓN ESPECIAL (OPCIONAL)',
    detail_special_request_placeholder: 'Ej: habitación en planta alta, cuna para bebé, llegada tardía...',

    // MIS RESERVAS
    mr_label:             'Tu historial',
    mr_title:             'Mis Reservas',
    mr_loading:           'Cargando...',
    mr_error_conn:        'Error de conexión.',
    mr_error_load:        'No se pudieron cargar las reservas.',
    mr_empty_title:       'Todavía no tienes reservas',
    mr_empty_sub:         'Explora nuestras habitaciones y encuentra la tuya',
    mr_empty_btn:         'Explorar habitaciones',
    mr_services_extra:    'Servicios extras: ',
    mr_services_total:    'Total Servicios: ',
    mr_rs_label:          'ROOM SERVICE',
    mr_rs_total:          'Total Room Service: ',
    mr_rs_none:           'Sin pedido de room service',
    mr_badge_active:      '● EN CURSO',
    mr_badge_upcoming:    '● PRÓXIMA',
    mr_badge_past:        '● PASADA',
    mr_room_num:          'Habitación nº ',
    mr_night:             'noche',
    mr_nights:            'noches',
    mr_room_total:        'Total Habitación: ',
    mr_total_price:       'PRECIO TOTAL',
    mr_cancel:            'Cancelar reserva',
    mr_manage_rs:         ' Gestionar Room Service',
    mr_cancel_confirm:    '¿Seguro que quieres cancelar esta reserva?',
    mr_cancel_error:      'No se pudo cancelar la reserva. Inténtalo de nuevo.',
    mr_cancel_error_conn: 'Error de conexión al cancelar.',
    mr_special_request_label:  'PETICIÓN ESPECIAL',
    mr_special_request_none:   'Sin petición especial',
    mr_special_request_edit:   ' Editar petición',
    mr_special_request_save:   'Guardar',
    mr_special_request_cancel: 'Cancelar',
    mr_special_request_error:  'Error al guardar la petición. Inténtalo de nuevo.',

    // ROOM SERVICE MODAL (mis reservas)
    grs_title:      'Carta del Room Service',
    grs_no_items:   'No hay ítems disponibles.',
    grs_subtotal:   'Subtotal: ',
    grs_save:       'Guardar cambios',
    grs_cancel:     'Cancelar',
    grs_error_load: 'Error al cargar la carta.',
    grs_error_save: 'Error al guardar. Inténtalo de nuevo.',

    // ROOM SERVICE CATEGORIES
    cat_DESAYUNO: 'Desayuno',
    cat_ALMUERZO: 'Almuerzo',
    cat_CENA:     'Cena',
    cat_SNACKS:   'Snacks',
    cat_BEBIDAS:  'Bebidas',

    // ADMIN
    admin_label:         'Panel de Control',
    admin_title:         'Administración',
    admin_loading:       'Cargando...',
    admin_tab_dashboard: 'Dashboard',
    admin_tab_bookings:  'Reservas',
    admin_tab_rooms:     'Habitaciones',
    admin_tab_services:  'Servicios',
    admin_tab_rs:        'Room Service',
    admin_tab_users:     'Usuarios',

    // ADMIN DASHBOARD
    adm_stat_today:     'Reservas hoy',
    adm_stat_month:     'Reservas este mes',
    adm_stat_revenue:   'Ingresos este mes',
    adm_stat_occupancy: 'Ocupación hoy',
    adm_no_arrivals:    'No hay llegadas próximas.',
    adm_upcoming:       'PRÓXIMAS LLEGADAS',
    adm_col_client:     'Cliente',
    adm_col_room:       'Habitación',
    adm_col_type:       'Tipo',
    adm_col_arrival:    'Llegada',
    adm_col_departure:  'Salida',
    adm_error_stats:    'No se pudieron cargar las métricas.',
    adm_error_conn:     'Error de conexión.',

    // ADMIN RESERVAS
    adm_res_no_data:        'No hay reservas.',
    adm_res_error:          'No se pudieron cargar las reservas.',
    adm_res_services:       'Servicios',
    adm_res_total:          'Total',
    adm_res_modify:         'Modificar',
    adm_res_cancel:         'Cancelar',
    adm_res_confirm_cancel: '¿Cancelar esta reserva? Esta acción no se puede deshacer.',
    adm_res_cancel_error:   'No se pudo cancelar la reserva.',
    adm_mod_title:          'Modificar Reserva #',
    adm_mod_arrival:        'Llegada',
    adm_mod_departure:      'Salida',
    adm_mod_add_services:   'Servicios Adicionales',
    adm_mod_no_services:    'No hay servicios.',
    adm_mod_save:           'Guardar cambios',
    adm_mod_cancel:         'Cancelar',
    adm_mod_error:          'Error al modificar: ',
    adm_mod_error_conn:     'Error de conexión.',

    // ADMIN HABITACIONES
    adm_hab_edit:              'Editar habitación',
    adm_hab_error:             'No se pudieron cargar las habitaciones.',
    adm_hab_no_desc:           'Sin descripción',
    adm_hab_save:              'Guardar cambios',
    adm_hab_cancel:            'Cancelar',
    adm_hab_modal_note:        'Los cambios se aplicarán a <strong style="color:var(--gold);">todas</strong> las habitaciones de este tipo.',
    adm_hab_price_label:       'Precio / noche (€)',
    adm_hab_desc_label:        'Descripción (opcional)',
    adm_hab_price_placeholder: 'Ej: 120.00',
    adm_hab_desc_placeholder:  'Descripción breve del tipo',
    adm_hab_price_error:       'El precio es obligatorio y debe ser mayor que 0.',
    adm_hab_not_found:         'No existe ninguna habitación de ese tipo.',
    adm_hab_save_error:        'Error al guardar. Inténtalo de nuevo.',
    adm_hab_conn_error:        'Error de conexión.',
    adm_hab_saving:            'Guardando...',
    adm_hab_count:             ' hab.',

    // ADMIN SERVICIOS
    adm_svc_new:              '+ Nuevo Servicio',
    adm_svc_error:            'No se pudieron cargar los servicios.',
    adm_svc_col_name:         'Nombre',
    adm_svc_col_price:        'Precio',
    adm_svc_edit:             'Editar',
    adm_svc_delete:           'Eliminar',
    adm_svc_modal_new:        'Nuevo Servicio',
    adm_svc_modal_edit:       'Editar Servicio',
    adm_svc_name_label:       'Nombre',
    adm_svc_price_label:      'Precio (€)',
    adm_svc_name_placeholder: 'Ej: Spa Premium',
    adm_svc_price_placeholder:'Ej: 45.00',
    adm_svc_save:             'Guardar',
    adm_svc_cancel:           'Cancelar',
    adm_svc_req_error:        'Nombre y precio son obligatorios.',
    adm_svc_dup_error:        'Ya existe un servicio con ese nombre.',
    adm_svc_save_error:       'Error al guardar.',
    adm_svc_conn_error:       'Error de conexión.',
    adm_svc_del_confirm:      '¿Eliminar este servicio?',
    adm_svc_del_error:        'No se pudo eliminar el servicio.',

    // ADMIN ROOM SERVICE
    adm_rs_new:              '+ Nuevo ítem',
    adm_rs_empty:            'No hay ítems en la carta.',
    adm_rs_error:            'No se pudieron cargar los ítems.',
    adm_rs_col_name:         'Nombre',
    adm_rs_col_desc:         'Descripción',
    adm_rs_col_price:        'Precio',
    adm_rs_col_avail:        'Disponible',
    adm_rs_yes:              'Sí',
    adm_rs_no:               'No',
    adm_rs_edit:             'Editar',
    adm_rs_delete:           'Eliminar',
    adm_rs_modal_new:        'Nuevo ítem',
    adm_rs_modal_edit:       'Editar ítem',
    adm_rs_name_label:       'Nombre',
    adm_rs_desc_label:       'Descripción (opcional)',
    adm_rs_price_label:      'Precio (€)',
    adm_rs_cat_label:        'Categoría',
    adm_rs_avail_label:      'Disponible',
    adm_rs_save:             'Guardar',
    adm_rs_cancel:           'Cancelar',
    adm_rs_req_error:        'Nombre y precio (mayor que 0) son obligatorios.',
    adm_rs_save_error:       'Error al guardar.',
    adm_rs_not_found:        'Ítem no encontrado.',
    adm_rs_conn_error:       'Error de conexión.',
    adm_rs_del_confirm:      '¿Eliminar este ítem de la carta?',
    adm_rs_del_active:       'No se puede eliminar: hay pedidos activos que usan este ítem. Márcalo como no disponible primero.',
    adm_rs_del_error:        'No se pudo eliminar el ítem.',

    // ADMIN USUARIOS
    adm_usr_error:       'No se pudieron cargar los usuarios.',
    adm_usr_col_name:    'Nombre',
    adm_usr_col_email:   'Email',
    adm_usr_col_role:    'Rol',
    adm_usr_delete:      'Eliminar',
    adm_usr_del_confirm: '¿Eliminar este usuario? Se cancelarán todas sus reservas.',
    adm_usr_del_error:   'No se pudo eliminar el usuario.',
    adm_usr_del_active:  'No se puede eliminar este usuario.',
    adm_usr_conn_error:  'Error de conexión.',

    // SERVICIO DETAIL
    srv_back:        '← Volver a Servicios',
    srv_label:       'Golden Resort · Nuestros Servicios',
    srv_a_la_carte:  'A la carta',
    srv_per_service: '/ servicio',
    srv_schedule:    'HORARIO',
    srv_conditions:  'CONDICIONES',
    srv_includes:    'INCLUYE',
    srv_pdf_btn:     '📖 VER CARTA COMPLETA',
    srv_hint:        'Ver detalle →',
    srv_no_services: 'No hay servicios disponibles actualmente.',

    // LIGHTBOX
    lb_hotel_rooms:  'Golden Resort · Habitaciones',
  },

  en: {
    // NAV
    nav_rooms:        'Rooms',
    nav_services:     'Services',
    nav_contact:      'Contact',
    nav_my_bookings:  'My Bookings',
    nav_admin:        'Admin',
    nav_book:         'Book Now',
    nav_signin:       'Sign In',
    nav_signout:      'Sign Out',

    // HERO
    hero_welcome:     'Welcome to',
    hero_tagline:     'Luxury · Distinction · Comfort',
    hero_checkin:     'Check-In Date',
    hero_checkout:    'Check-Out Date',
    hero_search:      'Search',

    // SECTIONS
    rooms_label:      'Our Suites',
    rooms_title:      'Rooms',
    services_label:   'What we offer',
    services_title:   'Services',
    contact_label:    'We are here',
    contact_title:    'Contact Info',
    contact_location: 'Location',
    contact_contact:  'Contact Us',
    contact_coords:   'Coordinates',
    contact_follow:   'Follow Us',
    contact_map_cta:  'View on Google Maps →',

    // FOOTER
    footer_rights:    '© 2026 Golden Resort · All rights reserved',

    // AUTH
    auth_signin_tab:  'Sign In',
    auth_register_tab:'Register',
    auth_email:       'Email',
    auth_password:    'Password',
    auth_name:        'Name',
    auth_enter:       'Enter',
    auth_create:      'Create Account',
    auth_or:          'or',
    auth_google:      'Continue with Google',
    auth_error_login: 'Incorrect email or password.',
    auth_error_reg:   'Registration error.',
    auth_error_conn:  'Connection error.',

    // ROOM TYPES
    tipo_normal: 'Standard Room',
    tipo_doble:  'Double Room',
    tipo_suite:  'Suite',
    tipo_lujo:   'Luxury Suite',

    // ROOM CARD
    room_available:  '● Available',
    room_left:       '● Left: ',
    room_no_avail:   '● Not available',
    room_see_photos: 'View photos',
    room_per_night:  '/ night',
    room_book:       'Book',
    room_no_rooms:   'No rooms available for those dates.',

    // ROOM DETAIL
    detail_label:           'Golden Resort · Our Suites',
    detail_selected_dates:  'Selected dates:',
    detail_arrival:         'ARRIVAL',
    detail_departure:       'DEPARTURE',
    detail_add_services:    'ADDITIONAL SERVICES',
    detail_no_services:     'No additional services available.',
    detail_total_estimate:  'Estimated total: ',
    detail_confirm:         'Confirm Booking',
    detail_booking:         'Booking...',
    detail_booked:          'Booked',
    detail_confirmed_msg:   'Booking confirmed! Your room has been reserved.',
    detail_no_rooms_dates:  'No rooms available of that type for the selected dates.',
    detail_error_reserva:   'Error processing the booking. Please try again.',
    detail_error_conn:      'Connection error. Please try again.',
    detail_select_dates:    'Please select check-in and check-out dates.',
    detail_rs_subtotal:     'Room service subtotal: ',
    detail_special_request_label:       'SPECIAL REQUEST (OPTIONAL)',
    detail_special_request_placeholder: 'E.g.: high floor room, baby cot, late arrival...',

    // MIS RESERVAS
    mr_label:             'Your history',
    mr_title:             'My Bookings',
    mr_loading:           'Loading...',
    mr_error_conn:        'Connection error.',
    mr_error_load:        'Could not load bookings.',
    mr_empty_title:       'You have no bookings yet',
    mr_empty_sub:         'Explore our rooms and find yours',
    mr_empty_btn:         'Explore rooms',
    mr_services_extra:    'Extra services: ',
    mr_services_total:    'Services Total: ',
    mr_rs_label:          'ROOM SERVICE',
    mr_rs_total:          'Room Service Total: ',
    mr_rs_none:           'No room service order',
    mr_badge_active:      '● IN PROGRESS',
    mr_badge_upcoming:    '● UPCOMING',
    mr_badge_past:        '● PAST',
    mr_room_num:          'Room #',
    mr_night:             'night',
    mr_nights:            'nights',
    mr_room_total:        'Room Total: ',
    mr_total_price:       'TOTAL PRICE',
    mr_cancel:            'Cancel booking',
    mr_manage_rs:         ' Manage Room Service',
    mr_cancel_confirm:    'Are you sure you want to cancel this booking?',
    mr_cancel_error:      'Could not cancel the booking. Please try again.',
    mr_cancel_error_conn: 'Connection error while cancelling.',
    mr_special_request_label:  'SPECIAL REQUEST',
    mr_special_request_none:   'No special request',
    mr_special_request_edit:   ' Edit request',
    mr_special_request_save:   'Save',
    mr_special_request_cancel: 'Cancel',
    mr_special_request_error:  'Error saving the request. Please try again.',

    // ROOM SERVICE MODAL (mis reservas)
    grs_title:      'Room Service Menu',
    grs_no_items:   'No items available.',
    grs_subtotal:   'Subtotal: ',
    grs_save:       'Save changes',
    grs_cancel:     'Cancel',
    grs_error_load: 'Error loading the menu.',
    grs_error_save: 'Error saving. Please try again.',

    // ROOM SERVICE CATEGORIES
    cat_DESAYUNO: 'Breakfast',
    cat_ALMUERZO: 'Lunch',
    cat_CENA:     'Dinner',
    cat_SNACKS:   'Snacks',
    cat_BEBIDAS:  'Beverages',

    // ADMIN
    admin_label:         'Control Panel',
    admin_title:         'Administration',
    admin_loading:       'Loading...',
    admin_tab_dashboard: 'Dashboard',
    admin_tab_bookings:  'Bookings',
    admin_tab_rooms:     'Rooms',
    admin_tab_services:  'Services',
    admin_tab_rs:        'Room Service',
    admin_tab_users:     'Users',

    // ADMIN DASHBOARD
    adm_stat_today:     'Bookings today',
    adm_stat_month:     'Bookings this month',
    adm_stat_revenue:   'Revenue this month',
    adm_stat_occupancy: 'Occupancy today',
    adm_no_arrivals:    'No upcoming arrivals.',
    adm_upcoming:       'UPCOMING ARRIVALS',
    adm_col_client:     'Client',
    adm_col_room:       'Room',
    adm_col_type:       'Type',
    adm_col_arrival:    'Arrival',
    adm_col_departure:  'Departure',
    adm_error_stats:    'Could not load metrics.',
    adm_error_conn:     'Connection error.',

    // ADMIN RESERVAS
    adm_res_no_data:        'No bookings.',
    adm_res_error:          'Could not load bookings.',
    adm_res_services:       'Services',
    adm_res_total:          'Total',
    adm_res_modify:         'Modify',
    adm_res_cancel:         'Cancel',
    adm_res_confirm_cancel: 'Cancel this booking? This action cannot be undone.',
    adm_res_cancel_error:   'Could not cancel the booking.',
    adm_mod_title:          'Modify Booking #',
    adm_mod_arrival:        'Arrival',
    adm_mod_departure:      'Departure',
    adm_mod_add_services:   'Additional Services',
    adm_mod_no_services:    'No services.',
    adm_mod_save:           'Save changes',
    adm_mod_cancel:         'Cancel',
    adm_mod_error:          'Error modifying: ',
    adm_mod_error_conn:     'Connection error.',

    // ADMIN HABITACIONES
    adm_hab_edit:              'Edit room',
    adm_hab_error:             'Could not load rooms.',
    adm_hab_no_desc:           'No description',
    adm_hab_save:              'Save changes',
    adm_hab_cancel:            'Cancel',
    adm_hab_modal_note:        'Changes will apply to <strong style="color:var(--gold);">all</strong> rooms of this type.',
    adm_hab_price_label:       'Price / night (€)',
    adm_hab_desc_label:        'Description (optional)',
    adm_hab_price_placeholder: 'E.g.: 120.00',
    adm_hab_desc_placeholder:  'Brief description',
    adm_hab_price_error:       'Price is required and must be greater than 0.',
    adm_hab_not_found:         'No room of that type found.',
    adm_hab_save_error:        'Error saving. Please try again.',
    adm_hab_conn_error:        'Connection error.',
    adm_hab_saving:            'Saving...',
    adm_hab_count:             ' rooms',

    // ADMIN SERVICIOS
    adm_svc_new:              '+ New Service',
    adm_svc_error:            'Could not load services.',
    adm_svc_col_name:         'Name',
    adm_svc_col_price:        'Price',
    adm_svc_edit:             'Edit',
    adm_svc_delete:           'Delete',
    adm_svc_modal_new:        'New Service',
    adm_svc_modal_edit:       'Edit Service',
    adm_svc_name_label:       'Name',
    adm_svc_price_label:      'Price (€)',
    adm_svc_name_placeholder: 'E.g.: Premium Spa',
    adm_svc_price_placeholder:'E.g.: 45.00',
    adm_svc_save:             'Save',
    adm_svc_cancel:           'Cancel',
    adm_svc_req_error:        'Name and price are required.',
    adm_svc_dup_error:        'A service with that name already exists.',
    adm_svc_save_error:       'Error saving.',
    adm_svc_conn_error:       'Connection error.',
    adm_svc_del_confirm:      'Delete this service?',
    adm_svc_del_error:        'Could not delete the service.',

    // ADMIN ROOM SERVICE
    adm_rs_new:              '+ New item',
    adm_rs_empty:            'No items in the menu.',
    adm_rs_error:            'Could not load items.',
    adm_rs_col_name:         'Name',
    adm_rs_col_desc:         'Description',
    adm_rs_col_price:        'Price',
    adm_rs_col_avail:        'Available',
    adm_rs_yes:              'Yes',
    adm_rs_no:               'No',
    adm_rs_edit:             'Edit',
    adm_rs_delete:           'Delete',
    adm_rs_modal_new:        'New item',
    adm_rs_modal_edit:       'Edit item',
    adm_rs_name_label:       'Name',
    adm_rs_desc_label:       'Description (optional)',
    adm_rs_price_label:      'Price (€)',
    adm_rs_cat_label:        'Category',
    adm_rs_avail_label:      'Available',
    adm_rs_save:             'Save',
    adm_rs_cancel:           'Cancel',
    adm_rs_req_error:        'Name and price (greater than 0) are required.',
    adm_rs_save_error:       'Error saving.',
    adm_rs_not_found:        'Item not found.',
    adm_rs_conn_error:       'Connection error.',
    adm_rs_del_confirm:      'Delete this item from the menu?',
    adm_rs_del_active:       'Cannot delete: there are active orders using this item. Mark it as unavailable first.',
    adm_rs_del_error:        'Could not delete the item.',

    // ADMIN USUARIOS
    adm_usr_error:       'Could not load users.',
    adm_usr_col_name:    'Name',
    adm_usr_col_email:   'Email',
    adm_usr_col_role:    'Role',
    adm_usr_delete:      'Delete',
    adm_usr_del_confirm: 'Delete this user? All their bookings will be cancelled.',
    adm_usr_del_error:   'Could not delete the user.',
    adm_usr_del_active:  'Cannot delete this user.',
    adm_usr_conn_error:  'Connection error.',

    // SERVICIO DETAIL
    srv_back:        '← Back to Services',
    srv_label:       'Golden Resort · Our Services',
    srv_a_la_carte:  'À la carte',
    srv_per_service: '/ service',
    srv_schedule:    'SCHEDULE',
    srv_conditions:  'CONDITIONS',
    srv_includes:    'INCLUDES',
    srv_pdf_btn:     '📖 VIEW FULL MENU',
    srv_hint:        'See detail →',
    srv_no_services: 'No services available currently.',

    // LIGHTBOX
    lb_hotel_rooms:  'Golden Resort · Rooms',
  }
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

window.t = function(key) {
  return (TRANSLATIONS[LANG] && TRANSLATIONS[LANG][key]) ||
         (TRANSLATIONS['es'][key]) ||
         key;
};

window.setLang = function(lang) {
  LANG = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('lang-btn--active', btn.dataset.lang === lang);
  });

  if (typeof FP_CONFIG !== 'undefined') {
    FP_CONFIG.locale = lang === 'en' ? 'default' : 'es';
    ['#in-date', '#out-date'].forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el && el._flatpickr) {
        el._flatpickr.destroy();
        flatpickr(el, FP_CONFIG);
      }
    });
  }

  applyTranslations();

  var path = window.location.pathname;
  if (path === '/mis-reservas') {
    showMisReservas();
  } else if (path === '/admin') {
    showAdmin();
  } else if (path.startsWith('/habitacion/')) {
    var tipo = path.split('/habitacion/')[1].toUpperCase();
    fetch('/api/habitaciones').then(function(r) { return r.json(); }).then(function(rooms) {
      var room = rooms.find(function(r) { return r.tipo === tipo; });
      if (room) selectRoom(tipo, room.precioNoche, room.descripcion || '');
    });
  } else if (path.startsWith('/servicio/')) {
    fetchServicios().then(function(servicios) {
      var slug = path.split('/servicio/')[1];
      var serv = servicios.find(function(s) { return slugify(s.nombre) === slug; });
      if (serv) openServicioDetail(serv.id);
    });
  } else {
    loadRooms();
    loadServicios();
  }
};

window.applyTranslations = function() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.dataset.i18n;
    var val = t(key);
    if (el.tagName === 'INPUT' && el.type !== 'submit' && el.type !== 'button') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.documentElement.lang = LANG;
  if (typeof updateNav === 'function') updateNav();
};

