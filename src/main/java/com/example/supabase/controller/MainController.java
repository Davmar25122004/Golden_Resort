package com.example.supabase.controller;

import com.example.supabase.domain.Usuario;
import com.example.supabase.domain.Rol;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.repository.RoleRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
public class MainController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/")
    public String indice() {
        return "index";
    }

    @GetMapping("/habitacion/{tipo}")
    public String habitacionDetalle() {
        return "habitacion";
    }

    @GetMapping("/servicio/{slug}")
    public String servicioDetalle() {
        return "servicio";
    }

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

    @PostMapping("/api/auth/register")
    @ResponseBody
    public ResponseEntity<?> registrar(@RequestBody Map<String, String> datos, HttpServletRequest request) {
        try {
            String email = datos.get("email");
            String nombre = datos.get("nombre");
            String password = datos.get("password");

            if (usuarioRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("El email ya está registrado.");
            }

            Usuario nuevoUsuario = new Usuario();
            nuevoUsuario.setNombre(nombre);
            nuevoUsuario.setEmail(email);
            nuevoUsuario.setPassword(passwordEncoder.encode(password));
            if (nuevoUsuario.getRoles() == null) {
                nuevoUsuario.setRoles(new HashSet<>());
            }

            Rol rolCliente = roleRepository.findById(2L)
                    .orElseThrow(() -> new RuntimeException("Error: Rol ROLE_CLIENTE no encontrado."));

            nuevoUsuario.getRoles().add(rolCliente);
            usuarioRepository.save(nuevoUsuario);

            try {
                request.login(email, password);
            } catch (ServletException e) {
                return ResponseEntity.ok(Map.of("message", "Usuario creado, pero error al iniciar sesión automática."));
            }

            return ResponseEntity.ok(Map.of("message", "OK"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/api/usuario-info")
    @ResponseBody
    public Map<String, Object> info(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return Map.of("nombre", "Invitado", "roles", List.of());
        }

        String email;
        if (auth instanceof OAuth2AuthenticationToken token) {
            email = (String) token.getPrincipal().getAttributes().get("email");
        } else {
            email = auth.getName();
        }

        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email);
        String nombreAMostrar = userOpt.isPresent() ? userOpt.get().getNombre() : email;

        return Map.of(
                "nombre", nombreAMostrar,
                "roles", auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()));
    }
}
