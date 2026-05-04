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

    public LimpiezaController(LimpiezaService limpiezaService,
                              UsuarioRepository usuarioRepository,
                              AdminService adminService) {
        this.limpiezaService = limpiezaService;
        this.usuarioRepository = usuarioRepository;
        this.adminService = adminService;
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
        try { return ResponseEntity.ok(toResumen(limpiezaService.iniciar(id, u.getId()))); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/tarea/{id}/completar") @ResponseBody
    public ResponseEntity<?> completar(@PathVariable Long id,
                                       @RequestBody(required = false) Map<String, Object> body) {
        String notas = body != null && body.get("notasFinales") != null ? body.get("notasFinales").toString() : null;
        try { return ResponseEntity.ok(toResumen(limpiezaService.completar(id, notas))); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/tarea/{id}/cancelar") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        try { return ResponseEntity.ok(toResumen(limpiezaService.cancelar(id))); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/tarea") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> crearManual(@RequestBody Map<String, Object> body) {
        try {
            Long habitacionId = body.get("habitacionId") instanceof Number n ? n.longValue() : null;
            if (habitacionId == null) return ResponseEntity.badRequest().body("habitacionId requerido.");
            TareaLimpieza t = limpiezaService.crearManual(habitacionId,
                    parseEnum(TareaLimpieza.Tipo.class, body.get("tipo")),
                    parseEnum(TareaLimpieza.Prioridad.class, body.get("prioridad")),
                    body.get("notas") != null ? body.get("notas").toString() : null);
            return ResponseEntity.ok(toResumen(t));
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
        EstadoLimpieza nuevo = parseEnum(EstadoLimpieza.class, body.get("estado"));
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
                    parseEnum(IncidenciaLimpieza.Tipo.class, body.get("tipo")),
                    parseEnum(IncidenciaLimpieza.Prioridad.class, body.get("prioridad")),
                    descripcion, u);
            return ResponseEntity.ok(Map.of("id", i.getId(), "estado", i.getEstado().name()));
        } catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/api/limpieza/incidencias/{id}/estado") @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION','LIMPIEZA')")
    public ResponseEntity<?> cambiarEstadoIncidencia(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        IncidenciaLimpieza.Estado nuevo = parseEnum(IncidenciaLimpieza.Estado.class, body.get("estado"));
        if (nuevo == null) return ResponseEntity.badRequest().body("estado inválido.");
        String resolucion = body.get("resolucion") != null ? body.get("resolucion").toString() : null;
        var i = limpiezaService.cambiarEstadoIncidencia(id, nuevo, resolucion);
        return ResponseEntity.ok(Map.of("id", i.getId(), "estado", i.getEstado().name()));
    }

    // ── API: objetos perdidos ────────────────────────────────────────────────

    @GetMapping("/api/limpieza/objetos") @ResponseBody
    public List<Map<String, Object>> listarObjetos(@RequestParam(value = "soloDisponibles", defaultValue = "false") boolean solo) {
        return limpiezaService.listarObjetos(solo);
    }

    @PostMapping(path = "/api/limpieza/objetos", consumes = "multipart/form-data") @ResponseBody
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
                Map<String, String> r = adminService.uploadImagen(unique, file);
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
    public ResponseEntity<?> cambiarEstadoObjeto(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ObjetoPerdido.Estado nuevo = parseEnum(ObjetoPerdido.Estado.class, body.get("estado"));
        if (nuevo == null) return ResponseEntity.badRequest().body("estado inválido.");
        String notas = body.get("notasEntrega") != null ? body.get("notasEntrega").toString() : null;
        var o = limpiezaService.cambiarEstadoObjeto(id, nuevo, notas);
        return ResponseEntity.ok(Map.of("id", o.getId(), "estado", o.getEstado().name()));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static <E extends Enum<E>> E parseEnum(Class<E> type, Object raw) {
        if (raw == null) return null;
        try { return Enum.valueOf(type, raw.toString().trim().toUpperCase()); }
        catch (Exception e) { return null; }
    }

    private static Map<String, Object> toResumen(TareaLimpieza t) {
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
