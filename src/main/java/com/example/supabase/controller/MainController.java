package com.example.supabase.controller;

import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.SupabaseAuthService;
import com.example.supabase.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class MainController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final SupabaseAuthService supabaseAuthService;

    public MainController(UsuarioService usuarioService,
                          UsuarioRepository usuarioRepository,
                          SupabaseAuthService supabaseAuthService) {
        this.usuarioService      = usuarioService;
        this.usuarioRepository   = usuarioRepository;
        this.supabaseAuthService = supabaseAuthService;
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
