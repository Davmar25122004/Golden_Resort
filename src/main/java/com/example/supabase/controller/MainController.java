package com.example.supabase.controller;

import com.example.supabase.domain.Empleado;
import com.example.supabase.domain.MetodoPago;
import com.example.supabase.domain.TipoMetodoPago;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.EmpleadoRepository;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.MetodoPagoService;
import com.example.supabase.service.RateLimitService;
import com.example.supabase.service.SupabaseAuthService;
import com.example.supabase.service.TurnosService;
import com.example.supabase.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class MainController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SupabaseAuthService supabaseAuthService;
    private final MetodoPagoService metodoPagoService;
    private final TurnosService turnosService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.example.supabase.service.PasswordResetService passwordResetService;
    private final RateLimitService rateLimitService;

    public MainController(UsuarioService usuarioService,
                          UsuarioRepository usuarioRepository,
                          EmpleadoRepository empleadoRepository,
                          SupabaseAuthService supabaseAuthService,
                          MetodoPagoService metodoPagoService,
                          TurnosService turnosService,
                          org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                          com.example.supabase.service.PasswordResetService passwordResetService,
                          RateLimitService rateLimitService) {
        this.usuarioService       = usuarioService;
        this.usuarioRepository    = usuarioRepository;
        this.empleadoRepository   = empleadoRepository;
        this.supabaseAuthService  = supabaseAuthService;
        this.metodoPagoService    = metodoPagoService;
        this.turnosService        = turnosService;
        this.passwordEncoder      = passwordEncoder;
        this.passwordResetService = passwordResetService;
        this.rateLimitService     = rateLimitService;
    }

    private Long usuarioIdAutenticado(Authentication auth) {
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        return usuarioRepository.findByEmail(email).map(Usuario::getId).orElse(null);
    }

    private Map<String, Object> metodoToDto(MetodoPago m) {
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id",                  m.getId());
        dto.put("tipo",                m.getTipo() != null ? m.getTipo().name() : null);
        dto.put("marca",               m.getMarca());
        dto.put("ultimosCuatro",       m.getUltimosCuatro());
        dto.put("titular",             m.getTitular());
        dto.put("caducidad",           m.getCaducidad());
        dto.put("direccionFacturacion",m.getDireccionFacturacion());
        dto.put("telefono",            m.getTelefono());
        dto.put("iban",                m.getIban() != null && m.getIban().length() >= 4
                ? "**** " + m.getIban().substring(m.getIban().length() - 4) : m.getIban());
        dto.put("esDefault",           m.isEsDefault());
        return dto;
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

    @GetMapping("/completar-perfil")
    public String completarPerfil(Authentication auth,
                                  jakarta.servlet.http.HttpServletRequest request,
                                  org.springframework.ui.Model model) {
        if (auth == null || !auth.isAuthenticated()) return "redirect:/";
        if (!(auth instanceof OAuth2AuthenticationToken oauthToken)) return "redirect:/";

        String email = (String) oauthToken.getPrincipal().getAttributes().get("email");
        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return "redirect:/";

        boolean perfilIncompleto = usuario.getTipoDocumento() == null
                || usuario.getNumDocumento() == null
                || usuario.getFechaNacimiento() == null
                || usuario.getTelefono() == null;
        if (!perfilIncompleto) return "redirect:/";

        model.addAttribute("nombre", usuario.getNombre() != null ? usuario.getNombre() : "");
        return "completar-perfil";
    }

    @PostMapping("/api/perfil/completar")
    @ResponseBody
    public ResponseEntity<?> guardarPerfilCompleto(@RequestBody Map<String, Object> datos,
                                                   Authentication auth,
                                                   jakarta.servlet.http.HttpServletRequest request) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        if (!(auth instanceof OAuth2AuthenticationToken oauthToken))
            return ResponseEntity.badRequest().body("Solo para usuarios de Google.");

        String email = (String) oauthToken.getPrincipal().getAttributes().get("email");
        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        String tipoDocumento   = nib((String) datos.get("tipoDocumento"));
        String numDocumento    = nib((String) datos.get("numDocumento"));
        String telefonoPrefijo = nib((String) datos.get("telefonoPrefijo"));
        String telefono        = nib((String) datos.get("telefono"));

        if (tipoDocumento == null) return ResponseEntity.badRequest().body("El tipo de documento es obligatorio.");
        if (numDocumento == null)  return ResponseEntity.badRequest().body("El número de documento es obligatorio.");
        if (telefono == null)      return ResponseEntity.badRequest().body("El teléfono es obligatorio.");

        LocalDate fechaNacimiento = null;
        try {
            String fn = (String) datos.get("fechaNacimiento");
            if (fn != null && !fn.isBlank()) fechaNacimiento = LocalDate.parse(fn);
        } catch (DateTimeParseException ignored) {}
        if (fechaNacimiento == null) return ResponseEntity.badRequest().body("La fecha de nacimiento es obligatoria.");

        usuario.setTipoDocumento(tipoDocumento);
        usuario.setNumDocumento(numDocumento);
        usuario.setFechaNacimiento(fechaNacimiento);
        usuario.setTelefonoPrefijo(telefonoPrefijo);
        usuario.setTelefono(telefono);
        usuarioRepository.save(usuario);

        String redirect = (String) request.getSession().getAttribute("completar_perfil_redirect");
        request.getSession().removeAttribute("completar_perfil_redirect");
        return ResponseEntity.ok(Map.of("redirect", redirect != null ? redirect : "/"));
    }

    @GetMapping("/privacidad")
    public String privacidad() { return "privacidad"; }

    @GetMapping("/cookies")
    public String cookies() { return "cookies"; }

    @GetMapping("/verificar-email")
    public String verificarEmail(@RequestParam(required = false) String token, Model model) {
        if (token != null && !token.isBlank()) {
            boolean ok = usuarioService.confirmarVerificacionPorToken(token);
            model.addAttribute("verificado", ok);
            model.addAttribute("tokenProvided", true);
        } else {
            model.addAttribute("tokenProvided", false);
        }
        return "verificar-email";
    }

    @GetMapping("/perfil")
    public String perfil(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return "redirect:/";
        return "perfil";
    }

    @GetMapping("/api/perfil")
    @ResponseBody
    public ResponseEntity<?> obtenerPerfil(Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();

        boolean esOAuth = auth instanceof OAuth2AuthenticationToken;

        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        java.util.Set<String> nombresRol = usuario.getRoles().stream()
                .map(r -> r.getName())
                .collect(java.util.stream.Collectors.toSet());
        String rol = nombresRol.contains("ROLE_ADMIN")     ? "ROLE_ADMIN"
                   : nombresRol.contains("ROLE_RECEPCION") ? "ROLE_RECEPCION"
                   : nombresRol.contains("ROLE_LIMPIEZA")  ? "ROLE_LIMPIEZA"
                   : nombresRol.contains("ROLE_CLIENTE")   ? "ROLE_CLIENTE"
                   : nombresRol.isEmpty() ? "ROLE_CLIENTE"
                   : nombresRol.iterator().next();

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("nombre",  usuario.getNombre() != null ? usuario.getNombre() : "");
        body.put("email",   usuario.getEmail());
        body.put("rol",     rol);
        body.put("roles",   nombresRol);
        body.put("esOAuth", esOAuth);
        boolean tienePasswordLocal = usuario.getPassword() != null
                && !usuario.getPassword().isBlank()
                && !"OAUTH2_USER".equals(usuario.getPassword());
        body.put("tienePasswordLocal", tienePasswordLocal);
        body.put("tipoDocumento",   usuario.getTipoDocumento());
        body.put("numDocumento",    usuario.getNumDocumento());
        body.put("fechaNacimiento", usuario.getFechaNacimiento() != null ? usuario.getFechaNacimiento().toString() : null);
        body.put("telefonoPrefijo", usuario.getTelefonoPrefijo());
        body.put("telefono",        usuario.getTelefono());
        Empleado emp = empleadoRepository.findByUsuarioId(usuario.getId()).orElse(null);
        if (emp != null) {
            body.put("apellidos",         emp.getApellidos());
            body.put("genero",            emp.getGenero());
            body.put("tipoDocumento",     emp.getTipoDocumento());
            body.put("numDocumento",      emp.getNumDocumento());
            body.put("telefono",          emp.getTelefono());
            body.put("cargo",             emp.getCargo());
            body.put("departamento",      emp.getDepartamento());
            body.put("tipoEmpleado",      emp.getTipoEmpleado());
            body.put("tipoContratacion",  emp.getTipoContratacion());
            body.put("fechaNacimiento",   emp.getFechaNacimiento()   != null ? emp.getFechaNacimiento().toString()   : null);
            body.put("fechaContratacion", emp.getFechaContratacion() != null ? emp.getFechaContratacion().toString() : null);
            body.put("lugarNacimiento",   emp.getLugarNacimiento());
            body.put("pais",              emp.getPais());
            body.put("telefonoCasa",      emp.getTelefonoCasa());
            body.put("direccionCasa",     emp.getDireccionCasa());
            body.put("telefonoOficina",   emp.getTelefonoOficina());
            body.put("direccionOficina",  emp.getDireccionOficina());
            if (emp.getTurnoPlan() != null) {
                body.put("planId",     emp.getTurnoPlan().getId());
                body.put("planNombre", emp.getTurnoPlan().getNombre());
            }
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/api/mi-horario")
    @ResponseBody
    public ResponseEntity<?> miHorario(Authentication auth,
                                       @RequestParam("from") String from,
                                       @RequestParam("to")   String to) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        var emp = empleadoRepository.findByUsuarioId(usuario.getId()).orElse(null);
        if (emp == null || emp.getTurnoPlan() == null)
            return ResponseEntity.ok(List.of());
        var dias = turnosService.calendarioPlan(
                emp.getTurnoPlan().getId(),
                LocalDate.parse(from),
                LocalDate.parse(to));
        return ResponseEntity.ok(dias);
    }

    @PutMapping("/api/perfil/nombre")
    @ResponseBody
    public ResponseEntity<?> actualizarNombre(@RequestBody Map<String, String> datos,
                                              Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email  = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        String nombre = datos.get("nombre");

        if (nombre == null || nombre.isBlank() || nombre.trim().length() < 2)
            return ResponseEntity.badRequest().body("El nombre debe tener al menos 2 caracteres.");

        try {
            usuarioService.actualizarNombre(email, nombre.trim());
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al actualizar el nombre.");
        }
    }

    @PutMapping("/api/perfil/datos")
    @ResponseBody
    public ResponseEntity<?> actualizarDatosPerfil(@RequestBody Map<String, String> datos,
                                                    Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        String nombre = datos.get("nombre");
        if (nombre != null && !nombre.isBlank() && nombre.trim().length() >= 2) usuario.setNombre(nombre.trim());

        String tipoDocumento = datos.get("tipoDocumento");
        if (tipoDocumento != null && !tipoDocumento.isBlank()) usuario.setTipoDocumento(tipoDocumento.trim());

        String numDocumento = datos.get("numDocumento");
        if (numDocumento != null && !numDocumento.isBlank()) {
            String numUpper = numDocumento.trim().toUpperCase();
            var existente = usuarioRepository.findAll().stream()
                    .filter(u -> !u.getId().equals(usuario.getId()))
                    .filter(u -> numUpper.equalsIgnoreCase(u.getNumDocumento()))
                    .findFirst();
            if (existente.isPresent()) {
                return ResponseEntity.status(409).body("Ya existe un usuario con ese número de documento.");
            }
            usuario.setNumDocumento(numUpper);
        }

        String fechaNac = datos.get("fechaNacimiento");
        if (fechaNac != null && !fechaNac.isBlank()) {
            try { usuario.setFechaNacimiento(LocalDate.parse(fechaNac)); }
            catch (Exception ignored) {}
        }

        String telefonoPrefijo = datos.get("telefonoPrefijo");
        if (telefonoPrefijo != null) usuario.setTelefonoPrefijo(telefonoPrefijo.trim());

        String telefono = datos.get("telefono");
        if (telefono != null && !telefono.isBlank()) usuario.setTelefono(telefono.trim());

        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("message", "Datos actualizados correctamente."));
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @DeleteMapping("/api/perfil/eliminar-cuenta")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> eliminarCuenta(@RequestBody Map<String, String> datos,
                                            Authentication auth,
                                            jakarta.servlet.http.HttpServletRequest request) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();
        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        boolean esOAuth = "OAUTH2_USER".equals(usuario.getPassword());
        if (!esOAuth) {
            String password = datos.get("password");
            if (password == null || password.isBlank())
                return ResponseEntity.badRequest().body("Introduce tu contraseña.");
            if (!passwordEncoder.matches(password, usuario.getPassword()))
                return ResponseEntity.badRequest().body("Contraseña incorrecta.");
        }

        Long uid = usuario.getId();
        try {
            entityManager.createNativeQuery("DELETE FROM mensaje WHERE autor_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM conversacion WHERE cliente_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM mensaje_staff ms USING conversacion_staff cs WHERE ms.conversacion_id = cs.id AND cs.staff_usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM conversacion_staff WHERE staff_usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM nota_reserva WHERE autor_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM objeto_reclamacion WHERE usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM pedido_room_service WHERE reserva_id IN (SELECT id FROM reserva WHERE usuario_id = :uid)").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM reserva_servicio WHERE reserva_id IN (SELECT id FROM reserva WHERE usuario_id = :uid)").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM tarea_limpieza WHERE asignado_a = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM pagos WHERE usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM reserva WHERE usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM metodos_pago WHERE usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM password_reset_tokens WHERE usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM codigos_descuento WHERE usuario_asignado_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM empleados WHERE usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM usuarios_roles WHERE usuario_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM usuarios WHERE id = :uid").setParameter("uid", uid).executeUpdate();

            // Invalidar sesión
            request.getSession().invalidate();
            org.springframework.security.core.context.SecurityContextHolder.clearContext();

            return ResponseEntity.ok(Map.of("message", "Cuenta eliminada."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar la cuenta: " + e.getMessage());
        }
    }

    @GetMapping("/api/perfil/metodos-pago")
    @ResponseBody
    public ResponseEntity<?> listarMetodosPago(Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        var lista = metodoPagoService.listar(uid).stream().map(this::metodoToDto).toList();
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/api/perfil/metodos-pago")
    @ResponseBody
    public ResponseEntity<?> crearMetodoPago(@RequestBody Map<String, Object> datos,
                                             Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        String tipoStr = (String) datos.getOrDefault("tipo", "TARJETA");
        TipoMetodoPago tipo;
        try { tipo = TipoMetodoPago.valueOf(tipoStr); }
        catch (Exception e) { return ResponseEntity.badRequest().body("Tipo inválido."); }

        MetodoPago m = new MetodoPago();
        m.setTipo(tipo);
        m.setTitular((String) datos.get("titular"));
        m.setDireccionFacturacion((String) datos.get("direccionFacturacion"));
        m.setEsDefault(Boolean.TRUE.equals(datos.get("esDefault")));

        if (tipo == TipoMetodoPago.TARJETA) {
            String numero = (String) datos.get("numero");
            if (numero == null || numero.replaceAll("\\s+", "").length() < 13)
                return ResponseEntity.badRequest().body("Número de tarjeta inválido.");
            m.setMarca(MetodoPagoService.detectarMarca(numero));
            m.setUltimosCuatro(MetodoPagoService.ultimosCuatroDe(numero));
            m.setCaducidad((String) datos.get("caducidad"));
        } else if (tipo == TipoMetodoPago.BIZUM) {
            String tel = (String) datos.get("telefono");
            if (tel == null || tel.isBlank()) return ResponseEntity.badRequest().body("Teléfono requerido.");
            m.setTelefono(tel);
            m.setMarca("Bizum");
        } else if (tipo == TipoMetodoPago.CUENTA_BANCARIA) {
            String iban = (String) datos.get("iban");
            if (iban == null || iban.replaceAll("\\s+", "").length() < 16)
                return ResponseEntity.badRequest().body("IBAN inválido.");
            m.setIban(iban.replaceAll("\\s+", ""));
            m.setMarca("Cuenta Bancaria");
        }

        MetodoPago guardado = metodoPagoService.crear(uid, m);
        return ResponseEntity.ok(metodoToDto(guardado));
    }

    @PutMapping("/api/perfil/metodos-pago/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarMetodoPago(@PathVariable Long id,
                                                  @RequestBody Map<String, Object> datos,
                                                  Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        MetodoPago cambios = new MetodoPago();
        cambios.setCaducidad((String) datos.get("caducidad"));
        cambios.setTitular((String) datos.get("titular"));
        cambios.setDireccionFacturacion((String) datos.get("direccionFacturacion"));
        cambios.setTelefono((String) datos.get("telefono"));

        try {
            return ResponseEntity.ok(metodoToDto(metodoPagoService.actualizar(uid, id, cambios)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("No se pudo actualizar.");
        }
    }

    @DeleteMapping("/api/perfil/metodos-pago/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarMetodoPago(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        try {
            metodoPagoService.eliminar(uid, id);
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("No se pudo eliminar.");
        }
    }

    @PutMapping("/api/perfil/metodos-pago/{id}/default")
    @ResponseBody
    public ResponseEntity<?> defaultMetodoPago(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        Long uid = usuarioIdAutenticado(auth);
        if (uid == null) return ResponseEntity.status(404).body("Usuario no encontrado.");
        try {
            metodoPagoService.marcarDefault(uid, id);
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("No se pudo actualizar.");
        }
    }

    @PostMapping("/api/perfil/restablecer-password")
    @ResponseBody
    public ResponseEntity<?> restablecerPassword(Authentication auth,
                                                  jakarta.servlet.http.HttpServletRequest request) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email = auth instanceof OAuth2AuthenticationToken oauthToken
                ? (String) oauthToken.getPrincipal().getAttributes().get("email")
                : auth.getName();

        String baseUrl = request.getScheme() + "://" + request.getServerName()
                + (request.getServerPort() != 80 && request.getServerPort() != 443
                    ? ":" + request.getServerPort() : "");

        String mensaje = passwordResetService.solicitarReset(email, baseUrl);
        return ResponseEntity.ok(Map.of("mensaje", mensaje));
    }

    @PostMapping("/api/perfil/password/crear")
    @ResponseBody
    public ResponseEntity<?> crearPasswordOAuth(@RequestBody Map<String, String> datos,
                                                Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");
        if (!(auth instanceof OAuth2AuthenticationToken oauthToken))
            return ResponseEntity.badRequest().body("Solo para cuentas Google.");

        String email = (String) oauthToken.getPrincipal().getAttributes().get("email");
        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        String nueva = datos.get("nueva");
        if (nueva == null || nueva.length() < 6)
            return ResponseEntity.badRequest().body("La contraseña debe tener al menos 6 caracteres.");

        usuario.setPassword(passwordEncoder.encode(nueva));
        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    @PutMapping("/api/perfil/password")
    @ResponseBody
    public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> datos,
                                             Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email = auth instanceof OAuth2AuthenticationToken oauthToken
                ? (String) oauthToken.getPrincipal().getAttributes().get("email")
                : auth.getName();

        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        // OAuth sin contraseña local — usar el endpoint /crear
        if ("OAUTH2_USER".equals(usuario.getPassword()) || usuario.getPassword() == null)
            return ResponseEntity.badRequest().body("Primero añade una contraseña desde el panel de seguridad.");

        String actual = datos.get("actual");
        String nueva  = datos.get("nueva");

        if (actual == null || actual.isBlank())
            return ResponseEntity.badRequest().body("Debes introducir tu contraseña actual.");
        if (nueva == null || nueva.length() < 6)
            return ResponseEntity.badRequest().body("La nueva contraseña debe tener al menos 6 caracteres.");

        try {
            boolean ok = usuarioService.cambiarPassword(email, actual, nueva);
            if (!ok) return ResponseEntity.badRequest().body("La contraseña actual no es correcta.");
            return ResponseEntity.ok(Map.of("message", "OK"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al cambiar la contraseña.");
        }
    }

    @PutMapping("/api/perfil/empleado")
    @ResponseBody
    public ResponseEntity<?> actualizarEmpleado(@RequestBody Map<String, Object> datos,
                                                 Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).body("No autenticado.");

        String email = auth instanceof OAuth2AuthenticationToken token
                ? (String) token.getPrincipal().getAttributes().get("email")
                : auth.getName();

        var usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return ResponseEntity.status(404).body("Usuario no encontrado.");

        String nombre = (String) datos.get("nombre");
        if (nombre != null && !nombre.isBlank() && nombre.trim().length() >= 2)
            usuarioService.actualizarNombre(email, nombre.trim());

        var emp = empleadoRepository.findByUsuarioId(usuario.getId()).orElse(null);
        if (emp != null) {
            emp.setApellidos(nib((String) datos.get("apellidos")));
            emp.setGenero(nib((String) datos.get("genero")));
            emp.setTipoDocumento(nib((String) datos.get("tipoDocumento")));
            emp.setNumDocumento(nib((String) datos.get("numDocumento")));
            emp.setTelefono(nib((String) datos.get("telefono")));
            emp.setLugarNacimiento(nib((String) datos.get("lugarNacimiento")));
            emp.setPais(nib((String) datos.get("pais")));
            String fn = (String) datos.get("fechaNacimiento");
            emp.setFechaNacimiento(fn != null && !fn.isBlank() ? LocalDate.parse(fn) : null);
            emp.setTelefonoCasa(nib((String) datos.get("telefonoCasa")));
            emp.setDireccionCasa(nib((String) datos.get("direccionCasa")));
            emp.setTelefonoOficina(nib((String) datos.get("telefonoOficina")));
            emp.setDireccionOficina(nib((String) datos.get("direccionOficina")));
            empleadoRepository.save(emp);
        }

        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    private String nib(String s) { return (s != null && !s.isBlank()) ? s.trim() : null; }

    @PostMapping("/api/auth/register")
    @ResponseBody
    public ResponseEntity<?> registrar(@RequestBody Map<String, String> datos,
                                       HttpServletRequest request) {
        if (!rateLimitService.bucketRegistro(request.getRemoteAddr()).tryConsume(1))
            return ResponseEntity.status(429).body("Demasiados intentos de registro. Espera un momento.");
        try {
            String email           = datos.get("email");
            String nombre          = datos.get("nombre");
            String password        = datos.get("password");
            String tipoDocumento   = datos.get("tipoDocumento");
            String numDocumento    = datos.get("numDocumento");
            String telefonoPrefijo = datos.get("telefonoPrefijo");
            String telefono        = datos.get("telefono");

            LocalDate fechaNacimiento = null;
            try {
                String fn = datos.get("fechaNacimiento");
                if (fn != null && !fn.isBlank()) fechaNacimiento = LocalDate.parse(fn);
            } catch (DateTimeParseException ignored) {}

            usuarioService.registrar(nombre, email, password,
                    tipoDocumento, numDocumento, fechaNacimiento,
                    telefonoPrefijo, telefono);

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

    @PostMapping("/api/auth/reenviar-verificacion")
    @ResponseBody
    public ResponseEntity<?> reenviarVerificacion(@RequestBody Map<String, String> datos,
                                                   HttpServletRequest request) {
        if (!rateLimitService.bucketRegistro(request.getRemoteAddr()).tryConsume(1))
            return ResponseEntity.status(429).body("Demasiados intentos. Espera un momento.");
        try {
            usuarioService.reenviarVerificacion(datos.get("email"));
            return ResponseEntity.ok(Map.of("message", "CHECK_EMAIL"));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al reenviar: " + e.getMessage());
        }
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
