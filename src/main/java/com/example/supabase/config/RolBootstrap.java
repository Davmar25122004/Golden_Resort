package com.example.supabase.config;

import com.example.supabase.domain.Rol;
import com.example.supabase.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class RolBootstrap {

    private static final Logger log = LoggerFactory.getLogger(RolBootstrap.class);

    private final RoleRepository roleRepository;

    public RolBootstrap(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @PostConstruct
    public void asegurarRolesBase() {
        crearSiNoExiste("ROLE_RECEPCION");
        crearSiNoExiste("ROLE_LIMPIEZA");
        crearSiNoExiste("ROLE_GIMNASIO");
        crearSiNoExiste("ROLE_SPA");
        crearSiNoExiste("ROLE_COCHE");
        crearSiNoExiste("ROLE_HOSTELERIA");
        crearSiNoExiste("ROLE_ROOMSERVICE");
    }

    private void crearSiNoExiste(String name) {
        try {
            if (roleRepository.findByName(name).isEmpty()) {
                Rol r = new Rol();
                r.setName(name);
                roleRepository.save(r);
                log.info("Rol creado: {}", name);
            }
        } catch (Exception e) {
            log.warn("No se pudo asegurar rol {}: {}", name, e.getMessage());
        }
    }
}
