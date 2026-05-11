package com.example.supabase.service;

import com.example.supabase.domain.PasswordResetToken;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.PasswordResetTokenRepository;
import com.example.supabase.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final UsuarioRepository usuarioRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(UsuarioRepository usuarioRepo,
                                PasswordResetTokenRepository tokenRepo,
                                EmailService emailService,
                                PasswordEncoder passwordEncoder) {
        this.usuarioRepo = usuarioRepo;
        this.tokenRepo = tokenRepo;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String solicitarReset(String email, String baseUrl) {
        Optional<Usuario> opt = usuarioRepo.findByEmail(email);
        if (opt.isEmpty()) return "Si el email está registrado, recibirás un enlace en breve.";

        Usuario usuario = opt.get();

        // Las cuentas Google usan "OAUTH2_USER" como password — no aplicar reset
        if (usuario.getPassword() == null || usuario.getPassword().isBlank()
                || "OAUTH2_USER".equals(usuario.getPassword())) {
            return "Esta cuenta inicia sesión con Google. Usa el botón \"Continuar con Google\" para acceder.";
        }

        // Eliminar tokens anteriores del usuario
        tokenRepo.deleteByUsuarioId(usuario.getId());

        // Crear nuevo token con 1h de expiración
        String tokenValue = UUID.randomUUID().toString();
        PasswordResetToken token = new PasswordResetToken();
        token.setToken(tokenValue);
        token.setUsuario(usuario);
        token.setExpiry(LocalDateTime.now().plusHours(1));
        tokenRepo.save(token);

        String enlace = baseUrl + "/reset-password?token=" + tokenValue;

        Map<String, Object> vars = new HashMap<>();
        vars.put("nombre", usuario.getNombre() != null ? usuario.getNombre() : usuario.getEmail());
        vars.put("enlace", enlace);
        vars.put("logoUrl", baseUrl + "/images/logo.png");

        emailService.enviarConPlantilla(
            usuario.getEmail(),
            "Restablecer contraseña · Golden Resort",
            "emails/reset-password",
            vars
        );

        return "Si el email está registrado, recibirás un enlace en breve.";
    }

    public Optional<Usuario> validarToken(String token) {
        return tokenRepo.findByToken(token)
            .filter(t -> !t.isExpired())
            .map(PasswordResetToken::getUsuario);
    }

    /** Devuelve: "OK", "EXPIRED", "SAME_PASSWORD" */
    @Transactional
    public String resetearPassword(String token, String nuevaPassword) {
        Optional<PasswordResetToken> opt = tokenRepo.findByToken(token);
        if (opt.isEmpty() || opt.get().isExpired()) return "EXPIRED";

        Usuario usuario = opt.get().getUsuario();

        if (passwordEncoder.matches(nuevaPassword, usuario.getPassword())) {
            return "SAME_PASSWORD";
        }

        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepo.save(usuario);
        tokenRepo.deleteByUsuarioId(usuario.getId());
        return "OK";
    }

}
