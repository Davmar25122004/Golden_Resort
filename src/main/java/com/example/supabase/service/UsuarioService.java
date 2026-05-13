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

import java.time.LocalDate;
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

    public void registrar(String nombre, String email, String password,
                          String tipoDocumento, String numDocumento, LocalDate fechaNacimiento,
                          String telefonoPrefijo, String telefono) {
        if (email == null || !email.contains("@"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email no es válido.");
        if (usuarioRepository.findByEmail(email).isPresent())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email ya está registrado.");

        // Si ya existe un registro pendiente para este email, guardamos el UID y lo borramos
        String previousUid = null;
        PendingRegistration existingPending = pendingRepository.findByEmail(email).orElse(null);
        if (existingPending != null) {
            previousUid = existingPending.getSupabaseUid();
            pendingRepository.delete(existingPending);
        }

        // Unicidad de documento (solo contra usuarios verificados)
        if (numDocumento != null && !numDocumento.isBlank()) {
            String docNorm = numDocumento.trim().toUpperCase();
            if (usuarioRepository.findFirstByNumDocumento(docNorm).isPresent())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ya existe una cuenta registrada con ese número de documento.");
            // Liberar documento de registros pendientes no verificados
            pendingRepository.findFirstByNumDocumento(docNorm).ifPresent(pendingRepository::delete);
            numDocumento = docNorm;
        }

        // Unicidad de teléfono (solo contra usuarios verificados)
        if (telefono != null && !telefono.isBlank()) {
            String telNorm = telefono.trim().replaceAll("\\s+", "");
            if (usuarioRepository.findFirstByTelefono(telNorm).isPresent())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ya existe una cuenta registrada con ese número de teléfono.");
            // Liberar teléfono de registros pendientes no verificados
            pendingRepository.findFirstByTelefono(telNorm).ifPresent(pendingRepository::delete);
            telefono = telNorm;
        }

        String supabaseUid = supabaseAuthService.signUp(email, password, previousUid);

        PendingRegistration pending = new PendingRegistration();
        pending.setEmail(email);
        pending.setNombre(nombre);
        pending.setPasswordHash(passwordEncoder.encode(password));
        pending.setSupabaseUid(supabaseUid);
        pending.setCreatedAt(LocalDateTime.now());
        pending.setTipoDocumento(tipoDocumento);
        pending.setNumDocumento(numDocumento);
        pending.setFechaNacimiento(fechaNacimiento);
        pending.setTelefonoPrefijo(telefonoPrefijo);
        pending.setTelefono(telefono);
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

    public void reenviarVerificacion(String email) {
        if (email == null || email.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email no proporcionado.");
        if (pendingRepository.findByEmail(email).isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No existe un registro pendiente para este email.");
        supabaseAuthService.resendVerificationEmail(email);
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
        usuario.setTipoDocumento(pending.getTipoDocumento());
        usuario.setNumDocumento(pending.getNumDocumento());
        usuario.setFechaNacimiento(pending.getFechaNacimiento());
        usuario.setTelefonoPrefijo(pending.getTelefonoPrefijo());
        usuario.setTelefono(pending.getTelefono());
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
