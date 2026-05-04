package com.example.supabase.config;

import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.MensajeriaService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MensajeriaBootstrap {

    private static final Logger log = LoggerFactory.getLogger(MensajeriaBootstrap.class);

    private final UsuarioRepository usuarioRepository;
    private final MensajeriaService mensajeriaService;

    public MensajeriaBootstrap(UsuarioRepository usuarioRepository,
                               MensajeriaService mensajeriaService) {
        this.usuarioRepository = usuarioRepository;
        this.mensajeriaService = mensajeriaService;
    }

    @PostConstruct
    @Transactional
    public void backfill() {
        try {
            int creadas = 0;
            for (var u : usuarioRepository.findAll()) {
                boolean esCliente = u.getRoles() != null && u.getRoles().stream()
                        .anyMatch(r -> "ROLE_CLIENTE".equals(r.getName()));
                if (!esCliente) continue;
                mensajeriaService.obtenerOCrearConversacion(u);
                creadas++;
            }
            if (creadas > 0) log.info("Mensajería bootstrap: aseguradas {} conversaciones de cliente.", creadas);
        } catch (Exception e) {
            log.warn("MensajeriaBootstrap: no se pudo completar el backfill: {}", e.getMessage());
        }
    }
}
