package com.example.supabase.controller;

import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.RecepcionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Controller
@PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
public class RecepcionController {

    private final RecepcionService recepcionService;
    private final UsuarioRepository usuarioRepository;
    private final com.example.supabase.repository.ReservaRepository reservaRepository;
    private final com.example.supabase.repository.HabitacionRepository habitacionRepository;
    private final com.example.supabase.repository.TareaLimpiezaRepository tareaRepository;
    private final com.example.supabase.repository.RoleRepository roleRepository;
    private final com.example.supabase.service.TurnosService turnosService;

    public RecepcionController(RecepcionService recepcionService,
                               UsuarioRepository usuarioRepository,
                               com.example.supabase.repository.ReservaRepository reservaRepository,
                               com.example.supabase.repository.HabitacionRepository habitacionRepository,
                               com.example.supabase.repository.TareaLimpiezaRepository tareaRepository,
                               com.example.supabase.repository.RoleRepository roleRepository,
                               com.example.supabase.service.TurnosService turnosService) {
        this.recepcionService  = recepcionService;
        this.usuarioRepository = usuarioRepository;
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
        this.tareaRepository = tareaRepository;
        this.roleRepository = roleRepository;
        this.turnosService = turnosService;
    }

    private Usuario usuario(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        return usuarioRepository.findByEmail(email).orElse(null);
    }

    // ── Vista del panel ───────────────────────────────────────────────────────

    @GetMapping("/recepcion")
    public String panel() {
        return "recepcion";
    }

    @GetMapping("/peticiones")
    public String peticionesView() {
        return "peticiones";
    }

    @GetMapping("/recepcion/calendario")
    public String calendarioView() {
        return "recepcion-calendario";
    }

    @GetMapping("/api/recepcion/calendario")
    @ResponseBody
    public Map<String, Integer> calendarioRango(@RequestParam("desde") String desde,
                                                @RequestParam("hasta") String hasta) {
        return recepcionService.calendarioRango(LocalDate.parse(desde), LocalDate.parse(hasta));
    }

    @GetMapping("/api/recepcion/calendario/dia")
    @ResponseBody
    public List<Map<String, Object>> calendarioDia(@RequestParam("fecha") String fecha) {
        return recepcionService.calendarioDia(LocalDate.parse(fecha));
    }

    @GetMapping("/api/recepcion/peticiones")
    @ResponseBody
    public List<Map<String, Object>> peticiones() {
        return recepcionService.peticiones();
    }

    // ── API ───────────────────────────────────────────────────────────────────

    @GetMapping("/api/recepcion/llegadas-hoy")
    @ResponseBody
    public List<Map<String, Object>> llegadasHoy() {
        return recepcionService.llegadasHoy();
    }

    @GetMapping("/api/recepcion/en-estancia")
    @ResponseBody
    public List<Map<String, Object>> enEstancia() {
        return recepcionService.enEstancia();
    }

    @GetMapping("/api/recepcion/salidas-hoy")
    @ResponseBody
    public List<Map<String, Object>> salidasHoy() {
        return recepcionService.salidasHoy();
    }

    @GetMapping("/api/recepcion/buscar")
    @ResponseBody
    public List<Map<String, Object>> buscar(@RequestParam(value = "q", required = false) String q) {
        return recepcionService.buscar(q);
    }

    @GetMapping("/api/recepcion/reserva/{id}")
    @ResponseBody
    public ResponseEntity<?> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(recepcionService.detalle(id));
    }

    @GetMapping("/api/recepcion/reserva/{id}/notas")
    @ResponseBody
    public List<Map<String, Object>> listarNotas(@PathVariable Long id) {
        return recepcionService.listarNotas(id);
    }

    @PostMapping("/api/recepcion/reserva/{id}/notas")
    @ResponseBody
    public ResponseEntity<?> crearNota(@PathVariable Long id,
                                       @RequestBody Map<String, Object> body,
                                       Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        String texto = body.get("texto") != null ? body.get("texto").toString() : null;
        var n = recepcionService.crearNota(id, texto, u);
        return ResponseEntity.ok(Map.of(
                "id", n.getId(),
                "texto", n.getTexto(),
                "autorEmail", n.getAutorEmail(),
                "creadoEn", n.getCreadoEn()
        ));
    }

    @DeleteMapping("/api/recepcion/notas/{notaId}")
    @ResponseBody
    public ResponseEntity<?> eliminarNota(@PathVariable Long notaId) {
        recepcionService.eliminarNota(notaId);
        return ResponseEntity.noContent().build();
    }

    // ── CHECKOUT (recepción/admin) ───────────────────────────────────────────

    @PostMapping("/api/recepcion/reservas/{id}/checkout")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> hacerCheckout(@PathVariable Long id) {
        var reserva = reservaRepository.findById(id).orElse(null);
        if (reserva == null) return ResponseEntity.notFound().build();
        if (reserva.getCheckoutEn() != null) {
            return ResponseEntity.badRequest().body("Esta reserva ya tiene checkout registrado.");
        }
        java.time.LocalDateTime ahora = java.time.LocalDateTime.now();
        reserva.setCheckoutEn(ahora);
        reservaRepository.save(reserva);

        // Marcar la habitación como SUCIA y crear tarea SALIDA
        var hab = reserva.getHabitacion();
        if (hab != null) {
            if (hab.getEstadoLimpieza() != com.example.supabase.domain.EstadoLimpieza.MANTENIMIENTO) {
                hab.setEstadoLimpieza(com.example.supabase.domain.EstadoLimpieza.SUCIA);
                habitacionRepository.save(hab);
            }
            // Generar tarea SALIDA si no existe ya para esta reserva
            boolean existe = tareaRepository.existsByReservaIdAndTipo(
                reserva.getId(), com.example.supabase.domain.TareaLimpieza.Tipo.SALIDA);
            if (!existe) {
                var t = new com.example.supabase.domain.TareaLimpieza();
                t.setHabitacion(hab);
                t.setReserva(reserva);
                t.setTipo(com.example.supabase.domain.TareaLimpieza.Tipo.SALIDA);
                t.setEstado(com.example.supabase.domain.TareaLimpieza.Estado.PENDIENTE);
                t.setPrioridad(com.example.supabase.domain.TareaLimpieza.Prioridad.NORMAL);
                String fechaHora = ahora.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
                String cliente = reserva.getUsuario() != null ? reserva.getUsuario().getNombre() : null;
                t.setNotas("Checkout realizado el " + fechaHora
                    + (cliente != null ? " · Cliente: " + cliente : "")
                    + " · Hab. " + hab.getNumero());
                tareaRepository.save(t);
            }
        }
        return ResponseEntity.ok(Map.of(
            "id", reserva.getId(),
            "checkoutEn", reserva.getCheckoutEn().toString(),
            "estadoHabitacion", hab != null && hab.getEstadoLimpieza() != null
                                ? hab.getEstadoLimpieza().name() : null
        ));
    }

    @PostMapping("/api/recepcion/reservas/{id}/checkout/deshacer")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deshacerCheckout(@PathVariable Long id) {
        var reserva = reservaRepository.findById(id).orElse(null);
        if (reserva == null) return ResponseEntity.notFound().build();
        if (reserva.getCheckoutEn() == null) {
            return ResponseEntity.badRequest().body("Esta reserva no tiene checkout registrado.");
        }
        reserva.setCheckoutEn(null);
        reservaRepository.save(reserva);

        // Eliminar la tarea SALIDA si todavía está pendiente (no hacer si ya se completó)
        var tareas = tareaRepository.findAll().stream()
            .filter(t -> t.getReserva() != null
                      && t.getReserva().getId().equals(reserva.getId())
                      && t.getTipo() == com.example.supabase.domain.TareaLimpieza.Tipo.SALIDA
                      && t.getEstado() == com.example.supabase.domain.TareaLimpieza.Estado.PENDIENTE)
            .toList();
        for (var t : tareas) tareaRepository.delete(t);

        // Si la habitación quedó SUCIA por el checkout y no hay otra tarea pendiente, dejarla LIMPIA
        var hab = reserva.getHabitacion();
        if (hab != null && hab.getEstadoLimpieza() == com.example.supabase.domain.EstadoLimpieza.SUCIA) {
            boolean haySalidaPendiente = tareaRepository.findAll().stream().anyMatch(t ->
                t.getHabitacion() != null
                && t.getHabitacion().getId().equals(hab.getId())
                && t.getEstado() == com.example.supabase.domain.TareaLimpieza.Estado.PENDIENTE);
            if (!haySalidaPendiente) {
                hab.setEstadoLimpieza(com.example.supabase.domain.EstadoLimpieza.LIMPIA);
                habitacionRepository.save(hab);
            }
        }

        return ResponseEntity.ok(Map.of("id", reserva.getId(), "checkoutEn", null));
    }

    // ── ASIGNAR LIMPIEZA (recepción asigna a un limpiador concreto) ──────────

    /** Lista las habitaciones que actualmente tienen un cliente alojado.
     *  Devuelve también si ya existe una tarea de limpieza pendiente. */
    @GetMapping("/api/recepcion/habitaciones-ocupadas")
    @ResponseBody
    public List<Map<String, Object>> habitacionesOcupadas() {
        LocalDate hoy = LocalDate.now();
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        reservaRepository.findAll().stream()
            .filter(r -> !r.getFechaEntrada().isAfter(hoy)
                      && r.getFechaSalida().isAfter(hoy)
                      && r.getCheckoutEn() == null)
            .sorted(java.util.Comparator.comparing(r -> r.getHabitacion().getNumero()))
            .forEach(r -> {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("reservaId",        r.getId());
                m.put("habitacionId",     r.getHabitacion().getId());
                m.put("habitacionNumero", r.getHabitacion().getNumero());
                m.put("habitacionTipo",   r.getHabitacion().getTipo() != null ? r.getHabitacion().getTipo().name() : null);
                m.put("clienteNombre",    r.getUsuario() != null ? r.getUsuario().getNombre() : null);
                m.put("clienteEmail",     r.getUsuario() != null ? r.getUsuario().getEmail() : null);
                m.put("fechaEntrada",     r.getFechaEntrada());
                m.put("fechaSalida",      r.getFechaSalida());
                m.put("estadoLimpieza",   r.getHabitacion().getEstadoLimpieza() != null
                                          ? r.getHabitacion().getEstadoLimpieza().name() : null);
                long pendientes = tareaRepository.findAll().stream()
                    .filter(t -> t.getHabitacion() != null
                              && t.getHabitacion().getId().equals(r.getHabitacion().getId())
                              && t.getEstado() == com.example.supabase.domain.TareaLimpieza.Estado.PENDIENTE)
                    .count();
                m.put("tareasPendientes", pendientes);
                out.add(m);
            });
        return out;
    }

    /** Lista los limpiadores que ESTÁN DE TURNO HOY según su cuadrante.
     *  Si no tiene plan asignado, no aparece. Si está libre hoy, no aparece. */
    @GetMapping("/api/recepcion/limpiadores-de-turno")
    @ResponseBody
    public List<Map<String, Object>> limpiadoresDeTurno() {
        LocalDate hoy = LocalDate.now();
        var rolLimp = roleRepository.findByName("ROLE_LIMPIEZA").orElse(null);
        if (rolLimp == null) return List.of();

        List<Map<String, Object>> out = new java.util.ArrayList<>();
        usuarioRepository.findAll().forEach(u -> {
            if (!u.getRoles().contains(rolLimp)) return;
            Map<String, Object> horario;
            try { horario = turnosService.resolverHorarioEmpleado(u.getId(), hoy); }
            catch (Exception e) { return; }

            // Excluir si está libre o no tiene tramos hoy
            if (Boolean.TRUE.equals(horario.get("libre"))) return;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> slots = (List<Map<String, Object>>) horario.get("slots");
            if (slots == null || slots.isEmpty()) return;

            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("usuarioId",     u.getId());
            m.put("nombre",        u.getNombre());
            m.put("email",         u.getEmail());
            m.put("perfilNombre",  horario.get("perfil_nombre"));
            m.put("slots",         slots);
            out.add(m);
        });
        return out;
    }

    /** Recepción asigna una limpieza a un empleado concreto sobre una habitación
     *  con cliente alojado. NO afecta al estado de la habitación ni de la reserva. */
    @PostMapping("/api/recepcion/asignar-limpieza")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> asignarLimpieza(@RequestBody Map<String, Object> body) {
        Long habitacionId = body.get("habitacionId") instanceof Number n ? n.longValue() : null;
        Long usuarioId    = body.get("asignadoUsuarioId") instanceof Number n2 ? n2.longValue() : null;
        String tipoStr    = cadenaONula(body.get("tipo"));
        String prioStr    = cadenaONula(body.get("prioridad"));
        String notas      = cadenaONula(body.get("notas"));

        if (habitacionId == null) return ResponseEntity.badRequest().body("Habitación requerida.");
        if (usuarioId == null)    return ResponseEntity.badRequest().body("Empleado de limpieza requerido.");

        var hab = habitacionRepository.findById(habitacionId).orElse(null);
        if (hab == null) return ResponseEntity.badRequest().body("Habitación no encontrada.");
        var asignado = usuarioRepository.findById(usuarioId).orElse(null);
        if (asignado == null) return ResponseEntity.badRequest().body("Empleado no encontrado.");

        // Validar que el usuario sea de turno hoy y rol limpieza
        var rolLimp = roleRepository.findByName("ROLE_LIMPIEZA").orElse(null);
        if (rolLimp == null || !asignado.getRoles().contains(rolLimp))
            return ResponseEntity.badRequest().body("El empleado no tiene rol de limpieza.");
        try {
            var horario = turnosService.resolverHorarioEmpleado(asignado.getId(), LocalDate.now());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> slots = (List<Map<String, Object>>) horario.get("slots");
            if (Boolean.TRUE.equals(horario.get("libre")) || slots == null || slots.isEmpty())
                return ResponseEntity.badRequest().body("El empleado no está de turno hoy.");
        } catch (Exception ignored) {}

        com.example.supabase.domain.TareaLimpieza.Tipo tipo;
        try { tipo = com.example.supabase.domain.TareaLimpieza.Tipo.valueOf(
                tipoStr != null ? tipoStr.toUpperCase() : "OTRA"); }
        catch (Exception e) { tipo = com.example.supabase.domain.TareaLimpieza.Tipo.OTRA; }

        com.example.supabase.domain.TareaLimpieza.Prioridad prio;
        try { prio = com.example.supabase.domain.TareaLimpieza.Prioridad.valueOf(
                prioStr != null ? prioStr.toUpperCase() : "NORMAL"); }
        catch (Exception e) { prio = com.example.supabase.domain.TareaLimpieza.Prioridad.NORMAL; }

        var t = new com.example.supabase.domain.TareaLimpieza();
        t.setHabitacion(hab);
        t.setAsignadoA(asignado);
        t.setTipo(tipo);
        t.setPrioridad(prio);
        t.setEstado(com.example.supabase.domain.TareaLimpieza.Estado.PENDIENTE);
        // Asociar a la reserva activa de esa habitación si existe (sin tocarla)
        LocalDate hoy = LocalDate.now();
        reservaRepository.findAll().stream()
            .filter(r -> r.getHabitacion().getId().equals(hab.getId())
                      && !r.getFechaEntrada().isAfter(hoy)
                      && r.getFechaSalida().isAfter(hoy)
                      && r.getCheckoutEn() == null)
            .findFirst()
            .ifPresent(t::setReserva);
        if (notas != null) t.setNotas(notas);
        tareaRepository.save(t);
        return ResponseEntity.ok(Map.of(
            "id", t.getId(),
            "asignadoUsuarioId", asignado.getId(),
            "asignadoNombre", asignado.getNombre()
        ));
    }

    private static String cadenaONula(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static LocalDate analizarFecha(Object o) {
        if (o == null) return null;
        return LocalDate.parse(o.toString());
    }
}
