package com.example.supabase.controller;

import com.example.supabase.domain.HabitacionGuardada;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.HabitacionGuardadaRepository;
import com.example.supabase.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/guardadas")
public class HabitacionGuardadaController {

    @Autowired private HabitacionGuardadaRepository guardadaRepo;
    @Autowired private UsuarioRepository usuarioRepo;

    private Usuario usuario(Authentication auth) {
        if (auth == null) return null;
        String email = (auth instanceof OAuth2AuthenticationToken token)
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        if (email == null) return null;
        return usuarioRepo.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> listar(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).build();
        List<Map<String, Object>> lista = guardadaRepo.findByUsuario(u).stream()
            .map(g -> Map.<String, Object>of("tipo", g.getTipo()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{tipo}/estado")
    public ResponseEntity<?> estado(@PathVariable String tipo, Authentication auth) {
        Usuario u = usuario(auth);
        boolean guardada = u != null && guardadaRepo.existsByUsuarioAndTipo(u, tipo.toUpperCase());
        return ResponseEntity.ok(Map.of("guardada", guardada));
    }

    @PostMapping("/{tipo}")
    public ResponseEntity<?> guardar(@PathVariable String tipo, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).build();
        String tipoUp = tipo.toUpperCase();
        if (!guardadaRepo.existsByUsuarioAndTipo(u, tipoUp)) {
            HabitacionGuardada g = new HabitacionGuardada();
            g.setUsuario(u);
            g.setTipo(tipoUp);
            guardadaRepo.save(g);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{tipo}")
    @Transactional
    public ResponseEntity<?> quitar(@PathVariable String tipo, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).build();
        guardadaRepo.deleteByUsuarioAndTipo(u, tipo.toUpperCase());
        return ResponseEntity.ok().build();
    }
}
