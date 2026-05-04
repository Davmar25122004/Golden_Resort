package com.example.supabase.service;

import com.example.supabase.domain.PendingRegistration;
import com.example.supabase.domain.Rol;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.PendingRegistrationRepository;
import com.example.supabase.repository.RoleRepository;
import com.example.supabase.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashSet;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PendingRegistrationRepository pendingRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SupabaseAuthService supabaseAuthService;
    private final MensajeriaService mensajeriaService;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          PendingRegistrationRepository pendingRepository,
                          RoleRepository roleRepository,
                          PasswordEncoder passwordEncoder,
                          SupabaseAuthService supabaseAuthService,
                          MensajeriaService mensajeriaService) {
        this.usuarioRepository  = usuarioRepository;
        this.pendingRepository  = pendingRepository;
        this.roleRepository     = roleRepository;
        this.passwordEncoder    = passwordEncoder;
        this.supabaseAuthService = supabaseAuthService;
        this.mensajeriaService  = mensajeriaService;
    }

    public void registrar(String nombre, String email, String password) {
        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email ya está registrado.");
        }
        if (pendingRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Ya existe un registro pendiente de verificación para este email. Revisa tu bandeja de entrada.");
        }

        // Llama a Supabase Auth → envía el email de verificación
        String supabaseUid = supabaseAuthService.signUp(email, password);

        // Guarda datos temporalmente hasta que el usuario verifique
        PendingRegistration pending = new PendingRegistration(
            email,
            nombre,
            passwordEncoder.encode(password),
            supabaseUid,
            LocalDateTime.now()
        );
        pendingRepository.save(pending);
    }

    @Transactional
    public void actualizarNombre(String email, String nombre) {
        Usuario u = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        u.setNombre(nombre);
        usuarioRepository.save(u);
    }

    @Transactional
    public boolean cambiarPassword(String email, String actual, String nueva) {
        Usuario u = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        if (!passwordEncoder.matches(actual, u.getPassword())) return false;
        u.setPassword(passwordEncoder.encode(nueva));
        usuarioRepository.save(u);
        return true;
    }

    @Transactional
    public boolean confirmarVerificacion(String email) {
        PendingRegistration pending = pendingRepository.findByEmail(email).orElse(null);
        if (pending == null) return false;

        Usuario usuario = new Usuario();
        usuario.setNombre(pending.getNombre());
        usuario.setEmail(pending.getEmail());
        usuario.setPassword(pending.getPasswordHash());
        usuario.setSupabaseUid(pending.getSupabaseUid());
        usuario.setRoles(new HashSet<>());

        Rol rolCliente = roleRepository.findById(2L)
            .orElseThrow(() -> new RuntimeException("Rol ROLE_CLIENTE no encontrado."));
        usuario.getRoles().add(rolCliente);
        Usuario guardado = usuarioRepository.save(usuario);

        pendingRepository.delete(pending);

        try {
            mensajeriaService.obtenerOCrearConversacion(guardado);
        } catch (Exception ignored) {}

        return true;
    }
}
