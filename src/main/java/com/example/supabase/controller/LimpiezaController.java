package com.example.supabase.controller;

import com.example.supabase.domain.*;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.AdminService;
import com.example.supabase.service.LimpiezaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Controller
@PreAuthorize("hasAnyRole('ADMIN','LIMPIEZA','RECEPCION')")
public class LimpiezaController {

    private final LimpiezaService limpiezaService;
    private final UsuarioRepository usuarioRepository;
    private final AdminService adminService;
    private final com.example.supabase.repository.ObjetoReclamacionRepository reclamRepo;
    private final com.example.supabase.repository.ObjetoPerdidoRepository objetoRepo;

    public LimpiezaController(LimpiezaService limpiezaService,
                              UsuarioRepository usuarioRepository,
                              AdminService adminService,
                              com.example.supabase.repository.ObjetoReclamacionRepository reclamRepo,
                              com.example.supabase.repository.ObjetoPerdidoRepository objetoRepo) {
        this.limpiezaService = limpiezaService;
        this.usuarioRepository = usuarioRepository;
        this.adminService = adminService;
        this.reclamRepo = reclamRepo;
        this.objetoRepo = objetoRepo;
    }

    private Usuario usuario(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        return usuarioRepository.findByEmail(email).orElse(null);
    }

    // ── Vistas ────────────────────────────────────────────────────────────────

    @GetMapping("/limpieza")
    public String panelView() { return "limpieza"; }

    @GetMapping("/limpieza/calendario")
    public String calendarioView() { return "limpieza-calendario"; }

    @GetMapping("/limpieza/incidencias")
    public String incidenciasView() { return "limpieza-incidencias"; }

    @GetMapping("/limpieza/objetos-perdidos")
    public String objetosView() { return "limpieza-objetos"; }

    // ── API: panel y tareas ───────────────────────────────────────────────────

    @GetMapping("/api/limpieza/panel") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','LIMPIEZA','RECEPCION','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE')")
    public List<Map<String, Object>> panel() { return limpiezaService.panel(); }

    @GetMapping("/api/limpieza/tareas") @ResponseBody
    public List<Map<String, Object>> tareas() { return limpiezaService.tareasAbiertas(); }

    @GetMapping("/api/limpieza/mis-tareas") @ResponseBody
    public ResponseEntity<?> misTareas(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        return ResponseEntity.ok(limpiezaService.misTareas(u.getId()));
    }

    @PostMapping("/api/limpieza/tarea/{id}/iniciar") @ResponseBody
    public ResponseEntity<?> iniciar(@PathVariable Long id, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        try { return ResponseEntity.ok(aResumen(limpiezaService.iniciar(id, u.getId()))); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/tarea/{id}/completar") @ResponseBody
    public ResponseEntity<?> completar(@PathVariable Long id,
                                       @RequestBody(required = false) Map<String, Object> body) {
        String notas = body != null && body.get("notasFinales") != null ? body.get("notasFinales").toString() : null;
        try { return ResponseEntity.ok(aResumen(limpiezaService.completar(id, notas))); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/tarea/{id}/cancelar") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        try { return ResponseEntity.ok(aResumen(limpiezaService.cancelar(id))); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/tarea") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> crearManual(@RequestBody Map<String, Object> body) {
        try {
            Long habitacionId = body.get("habitacionId") instanceof Number n ? n.longValue() : null;
            if (habitacionId == null) return ResponseEntity.badRequest().body("habitacionId requerido.");
            TareaLimpieza t = limpiezaService.crearManual(habitacionId,
                    analizarEnum(TareaLimpieza.Tipo.class, body.get("tipo")),
                    analizarEnum(TareaLimpieza.Prioridad.class, body.get("prioridad")),
                    body.get("notas") != null ? body.get("notas").toString() : null);
            return ResponseEntity.ok(aResumen(t));
        } catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/generar-salidas-hoy") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION','LIMPIEZA')")
    public Map<String, Object> generarSalidas() {
        return Map.of("creadas", limpiezaService.generarTareasSalidaHoy());
    }

    @PostMapping("/api/limpieza/habitacion/{id}/estado") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> cambiarEstadoHabitacion(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        EstadoLimpieza nuevo = analizarEnum(EstadoLimpieza.class, body.get("estado"));
        if (nuevo == null) return ResponseEntity.badRequest().body("estado inválido.");
        var h = limpiezaService.cambiarEstadoHabitacion(id, nuevo);
        return ResponseEntity.ok(Map.of("habitacionId", h.getId(),
                "habitacionNumero", h.getNumero(),
                "estadoLimpieza", h.getEstadoLimpieza().name()));
    }

    // ── API: calendario ───────────────────────────────────────────────────────

    @GetMapping("/api/limpieza/calendario") @ResponseBody
    public Map<String, Integer> calendarioRango(@RequestParam("desde") String desde,
                                                @RequestParam("hasta") String hasta) {
        return limpiezaService.calendarioRango(LocalDate.parse(desde), LocalDate.parse(hasta));
    }

    @GetMapping("/api/limpieza/calendario/dia") @ResponseBody
    public List<Map<String, Object>> calendarioDia(@RequestParam("fecha") String fecha) {
        return limpiezaService.calendarioDia(LocalDate.parse(fecha));
    }

    // ── API: incidencias ──────────────────────────────────────────────────────

    @GetMapping("/api/limpieza/incidencias") @ResponseBody
    public List<Map<String, Object>> listarIncidencias(@RequestParam(value = "abiertas", defaultValue = "false") boolean abiertas) {
        return limpiezaService.listarIncidencias(abiertas);
    }

    @PostMapping("/api/limpieza/incidencias") @ResponseBody
    public ResponseEntity<?> crearIncidencia(@RequestBody Map<String, Object> body, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        try {
            Long habitacionId = body.get("habitacionId") instanceof Number n ? n.longValue() : null;
            String descripcion = body.get("descripcion") != null ? body.get("descripcion").toString() : null;
            IncidenciaLimpieza i = limpiezaService.crearIncidencia(habitacionId,
                    analizarEnum(IncidenciaLimpieza.Tipo.class, body.get("tipo")),
                    analizarEnum(IncidenciaLimpieza.Prioridad.class, body.get("prioridad")),
                    descripcion, u);
            return ResponseEntity.ok(Map.of("id", i.getId(), "estado", i.getEstado().name()));
        } catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/incidencias/{id}/estado") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION','LIMPIEZA')")
    public ResponseEntity<?> cambiarEstadoIncidencia(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        IncidenciaLimpieza.Estado nuevo = analizarEnum(IncidenciaLimpieza.Estado.class, body.get("estado"));
        if (nuevo == null) return ResponseEntity.badRequest().body("estado inválido.");
        String resolucion = body.get("resolucion") != null ? body.get("resolucion").toString() : null;
        var i = limpiezaService.cambiarEstadoIncidencia(id, nuevo, resolucion);
        return ResponseEntity.ok(Map.of("id", i.getId(), "estado", i.getEstado().name()));
    }

    // ── API: objetos perdidos ────────────────────────────────────────────────

    @GetMapping("/api/limpieza/objetos") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','LIMPIEZA','RECEPCION','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE')")
    public List<Map<String, Object>> listarObjetos(@RequestParam(value = "soloDisponibles", defaultValue = "false") boolean solo) {
        return limpiezaService.listarObjetos(solo);
    }

    @PostMapping(path = "/api/limpieza/objetos", consumes = "multipart/form-data") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','LIMPIEZA','RECEPCION','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE')")
    public ResponseEntity<?> crearObjeto(@RequestParam(value = "habitacionId", required = false) Long habitacionId,
                                         @RequestParam("descripcion") String descripcion,
                                         @RequestParam(value = "encontradoEn", required = false) String encontradoEn,
                                         @RequestParam(value = "file", required = false) MultipartFile file,
                                         Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        try {
            String imagenUrl = null;
            if (file != null && !file.isEmpty()) {
                String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "objeto.jpg";
                String safe = original.replaceAll("[^A-Za-z0-9._-]", "_");
                String unique = "obj_" + System.currentTimeMillis() + "_" + safe;
                Map<String, String> r = adminService.subirImagen(unique, file);
                imagenUrl = r.get("filepath");
            }
            LocalDateTime cuando = null;
            if (encontradoEn != null && !encontradoEn.isBlank()) {
                try { cuando = LocalDateTime.parse(encontradoEn); }
                catch (Exception e) { /* fallback */ }
            }
            ObjetoPerdido o = limpiezaService.crearObjeto(habitacionId, descripcion, imagenUrl, cuando, u);
            return ResponseEntity.ok(Map.of("id", o.getId(), "estado", o.getEstado().name(), "imagenUrl", o.getImagenUrl() != null ? o.getImagenUrl() : ""));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("No se pudo crear: " + e.getMessage());
        }
    }

    @PostMapping("/api/limpieza/objetos/{id}/estado") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','LIMPIEZA','RECEPCION','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE')")
    public ResponseEntity<?> cambiarEstadoObjeto(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ObjetoPerdido.Estado nuevo = analizarEnum(ObjetoPerdido.Estado.class, body.get("estado"));
        if (nuevo == null) return ResponseEntity.badRequest().body("estado inválido.");
        String notas = body.get("notasEntrega") != null ? body.get("notasEntrega").toString() : null;
        var o = limpiezaService.cambiarEstadoObjeto(id, nuevo, notas);
        return ResponseEntity.ok(Map.of("id", o.getId(), "estado", o.getEstado().name()));
    }

    // ── PÁGINA Y API CLIENTE: ver objetos + reclamar ─────────────────────────

    @GetMapping("/objetos-perdidos") @PreAuthorize("isAuthenticated()")
    public String objetosClienteView() { return "objetos-cliente"; }

    @GetMapping("/api/objetos-perdidos") @ResponseBody
    @PreAuthorize("isAuthenticated()")
    public List<Map<String, Object>> listarObjetosCliente(Authentication auth) {
        Usuario u = usuario(auth);
        Long uid = u != null ? u.getId() : null;
        // Solo objetos disponibles (no entregados ni descartados)
        List<Map<String, Object>> base = limpiezaService.listarObjetos(true);
        // Adjuntar info de reclamaciones del usuario actual
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (var o : base) {
            Map<String, Object> m = new LinkedHashMap<>(o);
            Long objId = ((Number) m.get("id")).longValue();
            long pendientes = reclamRepo.countByObjetoIdAndEstado(objId, com.example.supabase.domain.ObjetoReclamacion.Estado.PENDIENTE);
            m.put("reclamacionesPendientes", pendientes);
            if (uid != null) {
                m.put("yaReclamadoPorMi",
                    reclamRepo.existsByObjetoIdAndUsuarioIdAndEstado(objId, uid, com.example.supabase.domain.ObjetoReclamacion.Estado.PENDIENTE)
                 || reclamRepo.existsByObjetoIdAndUsuarioIdAndEstado(objId, uid, com.example.supabase.domain.ObjetoReclamacion.Estado.ACEPTADA));
            } else {
                m.put("yaReclamadoPorMi", false);
            }
            result.add(m);
        }
        return result;
    }

    @PostMapping("/api/objetos-perdidos/{id}/reclamar") @ResponseBody
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> reclamarObjeto(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body,
                                            Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");

        // Bloquear a roles staff: solo clientes pueden reclamar
        boolean esStaff = auth.getAuthorities().stream().map(a -> a.getAuthority())
            .anyMatch(java.util.Set.of(
                "ROLE_ADMIN","ROLE_RECEPCION","ROLE_LIMPIEZA","ROLE_GIMNASIO",
                "ROLE_SPA","ROLE_COCHE","ROLE_HOSTELERIA","ROLE_ROOMSERVICE"
            )::contains);
        if (esStaff) return ResponseEntity.status(403).body("Solo los clientes pueden reclamar objetos.");

        var objeto = objetoRepo.findById(id).orElse(null);
        if (objeto == null) return ResponseEntity.notFound().build();
        if (objeto.getEstado() != com.example.supabase.domain.ObjetoPerdido.Estado.DISPONIBLE)
            return ResponseEntity.badRequest().body("Este objeto ya no está disponible.");

        if (reclamRepo.existsByObjetoIdAndUsuarioIdAndEstado(id, u.getId(), com.example.supabase.domain.ObjetoReclamacion.Estado.PENDIENTE))
            return ResponseEntity.badRequest().body("Ya tienes una reclamación pendiente sobre este objeto.");

        String mensaje = body.get("mensaje") != null ? body.get("mensaje").toString().trim() : "";
        if (mensaje.isEmpty()) return ResponseEntity.badRequest().body("Indica por qué crees que el objeto es tuyo.");
        String tel = body.get("telefono") != null ? body.get("telefono").toString().trim() : null;

        var rec = new com.example.supabase.domain.ObjetoReclamacion();
        rec.setObjeto(objeto);
        rec.setUsuario(u);
        rec.setMensaje(mensaje);
        rec.setTelefono(tel);
        reclamRepo.save(rec);
        return ResponseEntity.ok(Map.of("id", rec.getId(), "estado", rec.getEstado().name()));
    }

    @GetMapping("/api/objetos-perdidos/mis-reclamaciones") @ResponseBody
    @PreAuthorize("isAuthenticated()")
    public List<Map<String, Object>> misReclamaciones(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return java.util.Collections.emptyList();
        return reclamRepo.findByUsuarioIdOrderByCreadoEnDesc(u.getId()).stream()
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("objetoId", r.getObjeto().getId());
                m.put("objetoDescripcion", r.getObjeto().getDescripcion());
                m.put("objetoImagen", r.getObjeto().getImagenUrl());
                m.put("estado", r.getEstado().name());
                m.put("mensaje", r.getMensaje());
                m.put("telefono", r.getTelefono());
                m.put("notasStaff", r.getNotasStaff());
                m.put("creadoEn", r.getCreadoEn() != null ? r.getCreadoEn().toString() : null);
                m.put("resueltoEn", r.getResueltoEn() != null ? r.getResueltoEn().toString() : null);
                return m;
            }).collect(java.util.stream.Collectors.toList());
    }

    // ── PANEL STAFF: gestionar reclamaciones ─────────────────────────────────

    @GetMapping("/api/limpieza/objetos/{id}/reclamaciones") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','LIMPIEZA','RECEPCION','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE')")
    public List<Map<String, Object>> listarReclamacionesStaff(@PathVariable Long id) {
        return reclamRepo.findByObjetoIdOrderByCreadoEnDesc(id).stream()
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("usuarioId",     r.getUsuario().getId());
                m.put("usuarioNombre", r.getUsuario().getNombre());
                m.put("usuarioEmail",  r.getUsuario().getEmail());
                m.put("mensaje", r.getMensaje());
                m.put("telefono", r.getTelefono());
                m.put("estado", r.getEstado().name());
                m.put("notasStaff", r.getNotasStaff());
                m.put("creadoEn", r.getCreadoEn() != null ? r.getCreadoEn().toString() : null);
                m.put("resueltoEn", r.getResueltoEn() != null ? r.getResueltoEn().toString() : null);
                return m;
            }).collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/api/limpieza/reclamaciones/{recId}/decidir") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','LIMPIEZA','RECEPCION','GIMNASIO','SPA','COCHE','HOSTELERIA','ROOMSERVICE')")
    public ResponseEntity<?> decidirReclamacion(@PathVariable Long recId,
                                                 @RequestBody Map<String, Object> body) {
        var rec = reclamRepo.findById(recId).orElse(null);
        if (rec == null) return ResponseEntity.notFound().build();
        com.example.supabase.domain.ObjetoReclamacion.Estado nuevo =
            analizarEnum(com.example.supabase.domain.ObjetoReclamacion.Estado.class, body.get("estado"));
        if (nuevo == null || nuevo == com.example.supabase.domain.ObjetoReclamacion.Estado.PENDIENTE)
            return ResponseEntity.badRequest().body("Estado inválido (ACEPTADA o RECHAZADA).");

        rec.setEstado(nuevo);
        rec.setNotasStaff(body.get("notasStaff") != null ? body.get("notasStaff").toString() : null);
        rec.setResueltoEn(java.time.LocalDateTime.now());
        reclamRepo.save(rec);

        // Si se acepta, marcar el objeto como entregado al cliente
        if (nuevo == com.example.supabase.domain.ObjetoReclamacion.Estado.ACEPTADA) {
            var obj = rec.getObjeto();
            obj.setEstado(com.example.supabase.domain.ObjetoPerdido.Estado.ENTREGADO);
            obj.setEntregadoEn(java.time.LocalDateTime.now());
            String notasObj = "Entregado por reclamación de " + rec.getUsuario().getNombre()
                + " (" + rec.getUsuario().getEmail() + ")"
                + (rec.getNotasStaff() != null && !rec.getNotasStaff().isBlank() ? " · " + rec.getNotasStaff() : "");
            obj.setNotasEntrega(notasObj);
            objetoRepo.save(obj);
        }
        return ResponseEntity.ok(Map.of("id", rec.getId(), "estado", rec.getEstado().name()));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static <E extends Enum<E>> E analizarEnum(Class<E> type, Object raw) {
        if (raw == null) return null;
        try { return Enum.valueOf(type, raw.toString().trim().toUpperCase()); }
        catch (Exception e) { return null; }
    }

    private static Map<String, Object> aResumen(TareaLimpieza t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("tipo", t.getTipo().name());
        m.put("estado", t.getEstado().name());
        m.put("prioridad", t.getPrioridad().name());
        m.put("notas", t.getNotas());
        m.put("notasFinales", t.getNotasFinales());
        if (t.getHabitacion() != null) {
            m.put("habitacionId", t.getHabitacion().getId());
            m.put("habitacionNumero", t.getHabitacion().getNumero());
            m.put("habitacionEstadoLimpieza", t.getHabitacion().getEstadoLimpieza() != null
                    ? t.getHabitacion().getEstadoLimpieza().name() : null);
        }
        if (t.getAsignadoA() != null) m.put("asignadoEmail", t.getAsignadoA().getEmail());
        return m;
    }
}
