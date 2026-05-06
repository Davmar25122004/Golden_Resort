package com.example.supabase.controller;

import com.example.supabase.domain.*;
import com.example.supabase.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class MensajeriaStaffController {

    private static final Set<String> ROLES_STAFF_NO_ADMIN = Set.of(
        "ROLE_RECEPCION","ROLE_LIMPIEZA","ROLE_GIMNASIO","ROLE_SPA",
        "ROLE_COCHE","ROLE_HOSTELERIA","ROLE_ROOMSERVICE"
    );

    private final ConversacionStaffRepository convRepo;
    private final MensajeStaffRepository msgRepo;
    private final UsuarioRepository usuarioRepo;
    private final EmpleadoRepository empleadoRepo;

    public MensajeriaStaffController(ConversacionStaffRepository convRepo,
                                     MensajeStaffRepository msgRepo,
                                     UsuarioRepository usuarioRepo,
                                     EmpleadoRepository empleadoRepo) {
        this.convRepo = convRepo;
        this.msgRepo = msgRepo;
        this.usuarioRepo = usuarioRepo;
        this.empleadoRepo = empleadoRepo;
    }

    private Usuario usuarioActual(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        String email = auth instanceof OAuth2AuthenticationToken token
            ? (String) token.getPrincipal().getAttributes().get("email")
            : auth.getName();
        return usuarioRepo.findByEmail(email).orElse(null);
    }

    private boolean esPersonalSinAdmin(Authentication auth) {
        return auth.getAuthorities().stream().map(a -> a.getAuthority())
            .anyMatch(ROLES_STAFF_NO_ADMIN::contains);
    }

    private ConversacionStaff obtenerOCrearConversacion(Usuario staff) {
        return convRepo.findByStaffUsuarioId(staff.getId()).orElseGet(() -> {
            ConversacionStaff c = new ConversacionStaff();
            c.setStaffUsuario(staff);
            return convRepo.save(c);
        });
    }

    private Map<String, Object> mensajeAMapa(MensajeStaff m) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", m.getId());
        dto.put("texto", m.getTexto());
        dto.put("autorEsAdmin", m.isAutorEsAdmin());
        dto.put("leido", m.isLeido());
        dto.put("creadoEn", m.getCreadoEn() != null ? m.getCreadoEn().toString() : null);
        return dto;
    }

    // ── STAFF ↔ ADMIN: vista del empleado ────────────────────────────────────

    @GetMapping("/api/perfil/mensajes-staff")
    @Transactional
    public ResponseEntity<?> misMensajes(Authentication auth) {
        Usuario u = usuarioActual(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        if (!esPersonalSinAdmin(auth)) return ResponseEntity.status(403).body("Solo personal puede usar este chat.");
        ConversacionStaff c = obtenerOCrearConversacion(u);
        // Marcar como leídos los mensajes del admin
        msgRepo.marcarLeidos(c.getId(), true);
        var lista = msgRepo.findByConversacionIdOrderByCreadoEnAsc(c.getId()).stream()
            .map(this::mensajeAMapa).collect(Collectors.toList());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("conversacionId", c.getId());
        body.put("mensajes", lista);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/api/perfil/mensajes-staff")
    @Transactional
    public ResponseEntity<?> enviarMensajeStaff(@RequestBody Map<String, Object> body, Authentication auth) {
        Usuario u = usuarioActual(auth);
        if (u == null) return ResponseEntity.status(401).body("No autenticado.");
        if (!esPersonalSinAdmin(auth)) return ResponseEntity.status(403).body("Solo personal puede enviar mensajes aquí.");
        String texto = body.get("texto") != null ? body.get("texto").toString().trim() : "";
        if (texto.isEmpty()) return ResponseEntity.badRequest().body("El mensaje no puede estar vacío.");

        ConversacionStaff c = obtenerOCrearConversacion(u);
        MensajeStaff m = new MensajeStaff();
        m.setConversacion(c);
        m.setAutorUsuario(u);
        m.setAutorEsAdmin(false);
        m.setTexto(texto);
        m.setLeido(false);
        msgRepo.save(m);
        c.setUltimoMensajeEn(LocalDateTime.now());
        convRepo.save(c);
        return ResponseEntity.ok(mensajeAMapa(m));
    }

    // ── ADMIN: bandeja de todas las conversaciones ───────────────────────────

    @GetMapping("/api/admin/mensajes-staff/conversaciones")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> listarConversaciones() {
        return convRepo.findAllByOrderByUltimoMensajeEnDesc().stream().map(c -> {
            Usuario u = c.getStaffUsuario();
            Empleado e = empleadoRepo.findByUsuarioId(u.getId()).orElse(null);
            String rol = u.getRoles().stream().map(Rol::getName)
                .filter(ROLES_STAFF_NO_ADMIN::contains)
                .findFirst().orElse(u.getRoles().stream().map(Rol::getName).findFirst().orElse("—"));

            long noLeidos = msgRepo.countNoLeidos(c.getId(), false);
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("conversacionId",  c.getId());
            dto.put("usuarioId",       u.getId());
            dto.put("nombre",          u.getNombre());
            dto.put("apellidos",       e != null ? e.getApellidos() : null);
            dto.put("tipoDocumento",   e != null ? e.getTipoDocumento() : null);
            dto.put("numDocumento",    e != null ? e.getNumDocumento() : null);
            dto.put("rol",             rol);
            dto.put("ultimoMensajeEn", c.getUltimoMensajeEn() != null ? c.getUltimoMensajeEn().toString() : null);
            dto.put("noLeidos",        noLeidos);
            return dto;
        }).collect(Collectors.toList());
    }

    @GetMapping("/api/admin/mensajes-staff/conversaciones/{convId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> verConversacion(@PathVariable Long convId) {
        ConversacionStaff c = convRepo.findById(convId).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();
        // Marcar como leídos los mensajes del staff
        msgRepo.marcarLeidos(convId, false);

        Usuario u = c.getStaffUsuario();
        Empleado e = empleadoRepo.findByUsuarioId(u.getId()).orElse(null);
        String rol = u.getRoles().stream().map(Rol::getName)
            .filter(ROLES_STAFF_NO_ADMIN::contains)
            .findFirst().orElse(u.getRoles().stream().map(Rol::getName).findFirst().orElse("—"));

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("conversacionId", c.getId());
        info.put("usuarioId",      u.getId());
        info.put("nombre",         u.getNombre());
        info.put("apellidos",      e != null ? e.getApellidos() : null);
        info.put("tipoDocumento",  e != null ? e.getTipoDocumento() : null);
        info.put("numDocumento",   e != null ? e.getNumDocumento() : null);
        info.put("rol",            rol);
        info.put("mensajes", msgRepo.findByConversacionIdOrderByCreadoEnAsc(convId).stream()
            .map(this::mensajeAMapa).collect(Collectors.toList()));
        return ResponseEntity.ok(info);
    }

    @PostMapping("/api/admin/mensajes-staff/conversaciones/{convId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> responderConversacion(@PathVariable Long convId,
                                                   @RequestBody Map<String, Object> body,
                                                   Authentication auth) {
        Usuario admin = usuarioActual(auth);
        if (admin == null) return ResponseEntity.status(401).build();
        ConversacionStaff c = convRepo.findById(convId).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();
        String texto = body.get("texto") != null ? body.get("texto").toString().trim() : "";
        if (texto.isEmpty()) return ResponseEntity.badRequest().body("El mensaje no puede estar vacío.");

        MensajeStaff m = new MensajeStaff();
        m.setConversacion(c);
        m.setAutorUsuario(admin);
        m.setAutorEsAdmin(true);
        m.setTexto(texto);
        m.setLeido(false);
        msgRepo.save(m);
        c.setUltimoMensajeEn(LocalDateTime.now());
        convRepo.save(c);
        return ResponseEntity.ok(mensajeAMapa(m));
    }
}
