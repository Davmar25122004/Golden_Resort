package com.example.supabase.controller;

import com.example.supabase.domain.Mensaje;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.AdminService;
import com.example.supabase.service.MensajeriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Controller
public class MensajeriaController {

    private final MensajeriaService mensajeriaService;
    private final UsuarioRepository usuarioRepository;
    private final AdminService adminService;

    public MensajeriaController(MensajeriaService mensajeriaService,
                                UsuarioRepository usuarioRepository,
                                AdminService adminService) {
        this.mensajeriaService = mensajeriaService;
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

    // ── Vista del panel staff ─────────────────────────────────────────────────

    @GetMapping("/mensajeria")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public String panel() {
        return "mensajeria";
    }

    // ── API CLIENTE ───────────────────────────────────────────────────────────

    @GetMapping("/api/mensajeria/mi-conversacion")
    @ResponseBody
    public ResponseEntity<?> miConversacion(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        return ResponseEntity.ok(mensajeriaService.miConversacion(u));
    }

    @PostMapping("/api/mensajeria/mi-conversacion/leer")
    @ResponseBody
    public ResponseEntity<?> marcarLeidoCliente(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        mensajeriaService.marcarLeidoCliente(u);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/mensajeria/mi-conversacion/mensajes")
    @ResponseBody
    public ResponseEntity<?> enviarMensajeCliente(@RequestBody Map<String, Object> body, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        try {
            String texto = body.get("texto") != null ? body.get("texto").toString() : null;
            Mensaje m = mensajeriaService.enviarMensajeCliente(u, texto);
            return ResponseEntity.ok(serializar(m));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    // ── API RECEPCIÓN ─────────────────────────────────────────────────────────

    @GetMapping("/api/mensajeria/recepcion/conversaciones")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public List<Map<String, Object>> inbox() {
        return mensajeriaService.inboxRecepcion();
    }

    @GetMapping("/api/mensajeria/recepcion/conversaciones/{id}")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> detalle(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(mensajeriaService.conversacionParaRecepcion(id));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @PostMapping("/api/mensajeria/recepcion/conversaciones/{id}/mensajes")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> responder(@PathVariable Long id,
                                       @RequestBody Map<String, Object> body,
                                       Authentication auth) {
        Usuario staff = usuario(auth);
        if (staff == null) return ResponseEntity.status(401).body("No autenticado.");
        try {
            String texto = body.get("texto") != null ? body.get("texto").toString() : null;
            Mensaje m = mensajeriaService.enviarMensajeRecepcion(staff, id, texto);
            return ResponseEntity.ok(serializar(m));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @GetMapping("/api/mensajeria/recepcion/no-leidos")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public Map<String, Object> noLeidos() {
        return Map.of("total", mensajeriaService.noLeidosTotalRecepcion());
    }

    @PatchMapping("/api/mensajeria/recepcion/conversaciones/{id}/estado")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        try {
            String nuevo = body.get("estado") != null ? body.get("estado").toString() : null;
            var c = mensajeriaService.cambiarEstado(id, nuevo);
            return ResponseEntity.ok(Map.of("id", c.getId(), "estado", c.getEstado().name()));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @DeleteMapping("/api/mensajeria/recepcion/conversaciones/{id}")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> eliminarConversacion(@PathVariable Long id) {
        try {
            mensajeriaService.eliminarConversacion(id);
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @PostMapping(path = "/api/mensajeria/recepcion/conversaciones/{id}/mensajes/multipart",
                 consumes = "multipart/form-data")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> responderConAdjunto(@PathVariable Long id,
                                                 @RequestParam(value = "texto", required = false) String texto,
                                                 @RequestParam(value = "file",  required = false) MultipartFile file,
                                                 Authentication auth) {
        Usuario staff = usuario(auth);
        if (staff == null) return ResponseEntity.status(401).body("No autenticado.");
        try {
            String adjuntoUrl    = null;
            String adjuntoNombre = null;
            if (file != null && !file.isEmpty()) {
                String nombreOriginal = file.getOriginalFilename() != null ? file.getOriginalFilename() : "adjunto";
                String safe = nombreOriginal.replaceAll("[^A-Za-z0-9._-]", "_");
                String unique = System.currentTimeMillis() + "_" + safe;
                Map<String, String> r = adminService.uploadImagen(unique, file);
                adjuntoUrl    = r.get("filepath");
                adjuntoNombre = nombreOriginal;
            }
            Mensaje m = mensajeriaService.enviarMensajeRecepcionConAdjunto(staff, id, texto, adjuntoUrl, adjuntoNombre);
            return ResponseEntity.ok(serializar(m));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @GetMapping("/api/mensajeria/recepcion/cliente/{id}/ficha")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    public ResponseEntity<?> ficha(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(mensajeriaService.fichaCliente(id));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    private Map<String, Object> serializar(Mensaje m) {
        return Map.of(
                "id", m.getId(),
                "autorId", m.getAutorId(),
                "autorRol", m.getAutorRol(),
                "texto", m.getTexto(),
                "creadoEn", m.getCreadoEn()
        );
    }
}
