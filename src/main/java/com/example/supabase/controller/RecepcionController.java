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

    public RecepcionController(RecepcionService recepcionService,
                               UsuarioRepository usuarioRepository) {
        this.recepcionService  = recepcionService;
        this.usuarioRepository = usuarioRepository;
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

    @PostMapping("/api/recepcion/walkin")
    @ResponseBody
    public ResponseEntity<?> walkin(@RequestBody Map<String, Object> body, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        try {
            String email           = stringOrNull(body.get("email"));
            String nombre          = stringOrNull(body.get("nombre"));
            LocalDate fechaEntrada = parseDate(body.get("fechaEntrada"));
            LocalDate fechaSalida  = parseDate(body.get("fechaSalida"));
            String tipoHabitacion  = stringOrNull(body.get("tipoHabitacion"));
            Long habitacionId      = body.get("habitacionId") instanceof Number n ? n.longValue() : null;
            String peticion        = stringOrNull(body.get("peticionEspecial"));

            var r = recepcionService.crearWalkIn(email, nombre, fechaEntrada, fechaSalida,
                    tipoHabitacion, habitacionId, peticion, u);

            return ResponseEntity.ok(Map.of(
                    "id", r.getId(),
                    "habitacionNumero", r.getHabitacion().getNumero(),
                    "habitacionTipo", r.getHabitacion().getTipo().name(),
                    "fechaEntrada", r.getFechaEntrada(),
                    "fechaSalida", r.getFechaSalida(),
                    "clienteEmail", r.getUsuario().getEmail()
            ));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("No se pudo crear: " + e.getMessage());
        }
    }

    private static String stringOrNull(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static LocalDate parseDate(Object o) {
        if (o == null) return null;
        return LocalDate.parse(o.toString());
    }
}
