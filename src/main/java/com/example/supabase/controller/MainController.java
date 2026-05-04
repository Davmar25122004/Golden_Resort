package com.example.supabase.controller;

import com.example.supabase.domain.MetodoPago;
import com.example.supabase.domain.TipoMetodoPago;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.MetodoPagoService;
import com.example.supabase.service.SupabaseAuthService;
import com.example.supabase.service.TurnosService;
import com.example.supabase.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class MainController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final SupabaseAuthService supabaseAuthService;
    private final MetodoPagoService metodoPagoService;
    private final TurnosService turnosService;

    public MainController(UsuarioService usuarioService,
                          UsuarioRepository usuarioRepository,
                          SupabaseAuthService supabaseAuthService,
                          MetodoPagoService metodoPagoService,
                          TurnosService turnosService) {
        this.usuarioService      = usuarioService;
        this.usuarioRepository   = usuarioRepository;
        this.supabaseAuthService = supabaseAuthService;
        this.metodoPagoService   = metodoPagoService;
        this.turnosService       = turnosService;
    }

    private Long usuarioIdAutenticado(Authentication auth) {
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        return usuarioRepository.findByEmail(email).map(Usuario::getId).orElse(null);
    }

    private Map<String, Object> metodoToDto(MetodoPago m) {
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id",                  m.getId());
        dto.put("tipo",                m.getTipo() != null ? m.getTipo().name() : null);
        dto.put("marca",               m.getMarca());
        dto.put("ultimosCuatro",       m.getUltimosCuatro());
        dto.put("titular",             m.getTitular());
        dto.put("caducidad",           m.getCaducidad());
        dto.put("direccionFacturacion",m.getDireccionFacturacion());
        dto.put("telefono",            m.getTelefono());
        dto.put("iban",                m.getIban() != null && m.getIban().length() >= 4
                ? "**** " + m.getIban().substring(m.getIban().length() - 4) : m.getIban());
        dto.put("esDefault",           m.isEsDefault());
        return dto;
    }

    @GetMapping("/")
    public String indice() { return "index"; }

    @GetMapping("/habitacion/{tipo}")
    public String habitacionDetalle() { return "habitacion"; }

    @GetMapping("/servicio/{slug}")
    public String servicioDetalle() { return "servicio"; }

    @GetMapping("/mis-reservas")
    public String misReservas(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return "redirect:/";
        return "mis-reservas";
    }

    @GetMapping("/admin")
    public String admin(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return "redirect:/";
        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!esAdmin) return "redirect:/";
        return "admin";
    }

    @GetMapping("/verificar-email")
    public String verificarEmail() {
        return "verificar-email";
    }

    @GetMapping("/perfil")
    public String perfil(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return "redirect:/";
        return "perfil";
    }

    @GetMapping("/api/perfil")
    @ResponseBody
    public ResponseEntity<?> getPerfil(Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();

        boolean esOAuth = auth instanceof OAuth2AuthenticationToken;

        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        java.util.Set<String> nombresRol = usuario.getRoles().stream()
                .map(r -> r.getName())
                .collect(java.util.stream.Collectors.toSet());
        String rol = nombresRol.contains("ROLE_ADMIN")     ? "ROLE_ADMIN"
                   : nombresRol.contains("ROLE_RECEPCION") ? "ROLE_RECEPCION"
                   : nombresRol.contains("ROLE_LIMPIEZA")  ? "ROLE_LIMPIEZA"
                   : nombresRol.contains("ROLE_CLIENTE")   ? "ROLE_CLIENTE"
                   : nombresRol.isEmpty() ? "ROLE_CLIENTE"
                   : nombresRol.iterator().next();

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("nombre",  usuario.getNombre() != null ? usuario.getNombre() : "");
        body.put("email",   usuario.getEmail());
        body.put("rol",     rol);
        body.put("roles",   nombresRol);
        body.put("esOAuth", esOAuth);
        body.put("departamento", usuario.getDepartamento());
        if (usuario.getTurnoPlan() != null) {
            body.put("planId",     usuario.getTurnoPlan().getId());
            body.put("planNombre", usuario.getTurnoPlan().getNombre());
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/api/mi-horario")
    @ResponseBody
    public ResponseEntity<?> miHorario(Authentication auth,
                                       @RequestParam("from") String from,
                                       @RequestParam("to")   String to) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        if (usuario.getTurnoPlan() == null)
            return ResponseEntity.ok(List.of());
        var dias = turnosService.calendarioPlan(
                usuario.getTurnoPlan().getId(),
                LocalDate.parse(from),
                LocalDate.parse(to));
        return ResponseEntity.ok(dias);
    }

    @PutMapping("/api/perfil/nombre")
    @ResponseBody
    public ResponseEntity<?> actualizarNombre(@RequestBody Map<String, String> datos,
                                              Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email  = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        String nombre = datos.get("nombre");

        if (nombre == null || nombre.isBlank() || nombre.trim().length() < 2)
            return ResponseEntity.badRequest().body("El nombre debe tener al menos 2 caracteres.");

        try {
            usuarioService.actualizarNombre(email, nombre.trim());
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al actualizar el nombre.");
        }
    }

    @GetMapping("/api/perfil/metodos-pago")
    @ResponseBody
    public ResponseEntity<?> listarMetodosPago(Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        var lista = metodoPagoService.listar(uid).stream().map(this::metodoToDto).toList();
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/api/perfil/metodos-pago")
    @ResponseBody
    public ResponseEntity<?> crearMetodoPago(@RequestBody Map<String, Object> datos,
                                             Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        String tipoStr = (String) datos.getOrDefault("tipo", "TARJETA");
        TipoMetodoPago tipo;
        try { tipo = TipoMetodoPago.valueOf(tipoStr); }
        catch (Exception e) { return ResponseEntity.badRequest().body("Tipo inválido."); }

        MetodoPago m = new MetodoPago();
        m.setTipo(tipo);
        m.setTitular((String) datos.get("titular"));
        m.setDireccionFacturacion((String) datos.get("direccionFacturacion"));
        m.setEsDefault(Boolean.TRUE.equals(datos.get("esDefault")));

        if (tipo == TipoMetodoPago.TARJETA) {
            String numero = (String) datos.get("numero");
            if (numero == null || numero.replaceAll("\\s+", "").length() < 13)
                return ResponseEntity.badRequest().body("Número de tarjeta inválido.");
            m.setMarca(MetodoPagoService.detectarMarca(numero));
            m.setUltimosCuatro(MetodoPagoService.ultimosCuatroDe(numero));
            m.setCaducidad((String) datos.get("caducidad"));
        } else if (tipo == TipoMetodoPago.BIZUM) {
            String tel = (String) datos.get("telefono");
            if (tel == null || tel.isBlank()) return ResponseEntity.badRequest().body("Teléfono requerido.");
            m.setTelefono(tel);
            m.setMarca("Bizum");
        } else if (tipo == TipoMetodoPago.CUENTA_BANCARIA) {
            String iban = (String) datos.get("iban");
            if (iban == null || iban.replaceAll("\\s+", "").length() < 16)
                return ResponseEntity.badRequest().body("IBAN inválido.");
            m.setIban(iban.replaceAll("\\s+", ""));
            m.setMarca("Cuenta Bancaria");
        }

        MetodoPago guardado = metodoPagoService.crear(uid, m);
        return ResponseEntity.ok(metodoToDto(guardado));
    }

    @PutMapping("/api/perfil/metodos-pago/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarMetodoPago(@PathVariable Long id,
                                                  @RequestBody Map<String, Object> datos,
                                                  Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        MetodoPago cambios = new MetodoPago();
        cambios.setCaducidad((String) datos.get("caducidad"));
        cambios.setTitular((String) datos.get("titular"));
        cambios.setDireccionFacturacion((String) datos.get("direccionFacturacion"));
        cambios.setTelefono((String) datos.get("telefono"));

        try {
            return ResponseEntity.ok(metodoToDto(metodoPagoService.actualizar(uid, id, cambios)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("No se pudo actualizar.");
        }
    }

    @DeleteMapping("/api/perfil/metodos-pago/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarMetodoPago(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        try {
            metodoPagoService.eliminar(uid, id);
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("No se pudo eliminar.");
        }
    }

    @PutMapping("/api/perfil/metodos-pago/{id}/default")
    @ResponseBody
    public ResponseEntity<?> defaultMetodoPago(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        try {
            metodoPagoService.marcarDefault(uid, id);
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("No se pudo actualizar.");
        }
    }

    @PutMapping("/api/perfil/password")
    @ResponseBody
    public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> datos,
                                             Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        if (auth instanceof OAuth2AuthenticationToken)
            return ResponseEntity.badRequest().body("Los usuarios de Google no pueden cambiar la contraseña aquí.");

        String email  = auth.getName();
        String actual = datos.get("actual");
        String nueva  = datos.get("nueva");

        if (actual == null || actual.isBlank())
            return ResponseEntity.badRequest().body("Debes introducir tu contraseña actual.");
        if (nueva == null || nueva.length() < 6)
            return ResponseEntity.badRequest().body("La nueva contraseña debe tener al menos 6 caracteres.");

        try {
            boolean ok = usuarioService.cambiarPassword(email, actual, nueva);
            if (!ok) return ResponseEntity.badRequest().body("La contraseña actual no es correcta.");
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al cambiar la contraseña.");
        }
    }

    @PostMapping("/api/auth/register")
    @ResponseBody
    public ResponseEntity<?> registrar(@RequestBody Map<String, String> datos,
                                       HttpServletRequest request) {
        try {
            String email    = datos.get("email");
            String nombre   = datos.get("nombre");
            String password = datos.get("password");

            usuarioService.registrar(nombre, email, password);

            // No hacemos auto-login: el usuario debe verificar su email primero
            return ResponseEntity.ok(Map.of("message", "CHECK_EMAIL"));

        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/api/auth/confirmar-verificacion")
    @ResponseBody
    public ResponseEntity<?> confirmarVerificacion(@RequestBody Map<String, String> datos) {
        String accessToken = datos.get("accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.badRequest().body("Token no proporcionado.");
        }

        String email = supabaseAuthService.getEmailFromToken(accessToken);
        if (email == null) {
            return ResponseEntity.status(401).body("Token inválido o expirado.");
        }

        boolean ok = usuarioService.confirmarVerificacion(email);
        if (!ok) {
            return ResponseEntity.status(404).body("Usuario no encontrado.");
        }

        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    @GetMapping("/api/usuario-info")
    @ResponseBody
    public Map<String, Object> info(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return Map.of("nombre", "Invitado", "roles", List.of());
        }
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();

        String nombre = usuarioRepository.findByEmail(email)
                .map(u -> u.getNombre() != null ? u.getNombre() : email)
                .orElse(email);

        return Map.of(
                "nombre", nombre,
                "roles", auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()));
    }
}
