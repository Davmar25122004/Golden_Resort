package com.example.supabase.controller;

import com.example.supabase.domain.CodigoDescuento;
import com.example.supabase.domain.Rol;
import com.example.supabase.domain.TipoDescuento;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.CodigoDescuentoRepository;
import com.example.supabase.repository.RoleRepository;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final CodigoDescuentoRepository codigoDescuentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;

    public AdminController(AdminService adminService,
                           CodigoDescuentoRepository codigoDescuentoRepository,
                           UsuarioRepository usuarioRepository,
                           RoleRepository roleRepository) {
        this.adminService = adminService;
        this.codigoDescuentoRepository = codigoDescuentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.roleRepository = roleRepository;
    }

    private String getEmail(Authentication auth) {
        if (auth instanceof OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return auth.getName();
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return adminService.getStats();
    }

    @GetMapping("/usuarios")
    public List<Map<String, Object>> usuarios() {
        return adminService.getUsuarios();
    }

    @GetMapping("/stats/series")
    public Map<String, Object> statsSeries(@RequestParam(value = "type", required = false) String type,
                                           @RequestParam(value = "year", required = false) Integer year) {
        return adminService.getSeries(type, year);
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, Authentication auth) {
        adminService.eliminarUsuario(id, getEmail(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/habitaciones/tipo/{tipo}/imagen")
    public ResponseEntity<?> uploadImagenHabitacion(
            @PathVariable String tipo,
            @RequestParam("filename") String filename,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminService.uploadImagen(filename, file));
    }

    @PostMapping("/servicios/{id}/imagen")
    public ResponseEntity<?> uploadImagenServicio(
            @PathVariable Long id,
            @RequestParam("filename") String filename,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminService.uploadImagen(filename, file));
    }

    // ── CÓDIGOS DE DESCUENTO ─────────────────────────────────────────────

    @GetMapping("/codigos-descuento")
    public List<CodigoDescuento> listarCodigosDescuento() {
        return codigoDescuentoRepository.findAll();
    }

    @PostMapping("/codigos-descuento")
    public ResponseEntity<?> crearCodigoDescuento(@RequestBody Map<String, Object> body) {
        try {
            String codigo = ((String) body.get("codigo")).trim().toUpperCase();
            if (codigo.isEmpty()) return ResponseEntity.badRequest().body("Código vacío.");
            if (codigoDescuentoRepository.findByCodigoIgnoreCase(codigo).isPresent())
                return ResponseEntity.badRequest().body("Ese código ya existe.");

            CodigoDescuento c = new CodigoDescuento();
            c.setCodigo(codigo);
            c.setTipo(TipoDescuento.valueOf(((String) body.getOrDefault("tipo", "PORCENTAJE"))));
            c.setValor(new BigDecimal(body.get("valor").toString()));
            if (body.get("montoMinimo") != null && !body.get("montoMinimo").toString().isBlank())
                c.setMontoMinimo(new BigDecimal(body.get("montoMinimo").toString()));
            if (body.get("validoHasta") != null && !body.get("validoHasta").toString().isBlank())
                c.setValidoHasta(LocalDate.parse(body.get("validoHasta").toString()));
            if (body.get("usoMaximo") != null && !body.get("usoMaximo").toString().isBlank())
                c.setUsoMaximo(Integer.parseInt(body.get("usoMaximo").toString()));
            c.setActivo(!Boolean.FALSE.equals(body.get("activo")));
            return ResponseEntity.ok(codigoDescuentoRepository.save(c));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Datos inválidos: " + e.getMessage());
        }
    }

    @PutMapping("/codigos-descuento/{id}")
    public ResponseEntity<?> actualizarCodigoDescuento(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return codigoDescuentoRepository.findById(id).map(c -> {
            if (body.containsKey("activo"))       c.setActivo(Boolean.TRUE.equals(body.get("activo")));
            if (body.get("valor") != null)        c.setValor(new BigDecimal(body.get("valor").toString()));
            if (body.get("tipo") != null)         c.setTipo(TipoDescuento.valueOf((String) body.get("tipo")));
            if (body.get("montoMinimo") != null)  c.setMontoMinimo(
                    body.get("montoMinimo").toString().isBlank() ? null : new BigDecimal(body.get("montoMinimo").toString()));
            if (body.get("validoHasta") != null)  c.setValidoHasta(
                    body.get("validoHasta").toString().isBlank() ? null : LocalDate.parse(body.get("validoHasta").toString()));
            if (body.get("usoMaximo") != null)    c.setUsoMaximo(
                    body.get("usoMaximo").toString().isBlank() ? null : Integer.parseInt(body.get("usoMaximo").toString()));
            return ResponseEntity.ok(codigoDescuentoRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/codigos-descuento/{id}")
    public ResponseEntity<?> eliminarCodigoDescuento(@PathVariable Long id) {
        codigoDescuentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── ROLES STAFF ──────────────────────────────────────────────────────────

    private static final java.util.Set<String> ROLES_ASIGNABLES =
            java.util.Set.of("ROLE_RECEPCION", "ROLE_ADMIN");

    @GetMapping("/roles")
    public List<Map<String, Object>> listarRoles() {
        return roleRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareTo(b.getName()))
                .map(r -> Map.<String, Object>of("id", r.getId(), "name", r.getName()))
                .collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/usuarios/{id}/roles")
    public ResponseEntity<?> asignarRol(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String rolName = body.get("rol") != null ? body.get("rol").toString().trim() : null;
        if (rolName == null || rolName.isBlank())
            return ResponseEntity.badRequest().body("Falta el campo 'rol'.");
        if (!rolName.startsWith("ROLE_")) rolName = "ROLE_" + rolName.toUpperCase();
        if (!ROLES_ASIGNABLES.contains(rolName))
            return ResponseEntity.badRequest().body("Rol no asignable: " + rolName);

        Usuario u = usuarioRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();

        final String finalRolName = rolName;
        Rol r = roleRepository.findByName(finalRolName).orElseGet(() -> {
            Rol nr = new Rol();
            nr.setName(finalRolName);
            return roleRepository.save(nr);
        });

        if (u.getRoles() == null) u.setRoles(new java.util.HashSet<>());
        boolean nuevo = u.getRoles().add(r);
        if (nuevo) usuarioRepository.save(u);

        return ResponseEntity.ok(Map.of(
                "usuarioId", u.getId(),
                "email", u.getEmail(),
                "rol", finalRolName,
                "anyadido", nuevo
        ));
    }

    @DeleteMapping("/usuarios/{id}/roles/{rolName}")
    public ResponseEntity<?> revocarRol(@PathVariable Long id, @PathVariable("rolName") String rolNameParam) {
        String rolName = rolNameParam != null && rolNameParam.startsWith("ROLE_")
                ? rolNameParam : "ROLE_" + (rolNameParam == null ? "" : rolNameParam.toUpperCase());
        if (!ROLES_ASIGNABLES.contains(rolName))
            return ResponseEntity.badRequest().body("Rol no revocable: " + rolName);

        Usuario u = usuarioRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        if (u.getRoles() == null || u.getRoles().isEmpty()) return ResponseEntity.noContent().build();

        boolean removed = u.getRoles().removeIf(r -> rolName.equalsIgnoreCase(r.getName()));
        if (removed) usuarioRepository.save(u);
        return ResponseEntity.noContent().build();
    }
}
