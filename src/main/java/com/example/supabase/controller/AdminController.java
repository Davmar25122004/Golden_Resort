package com.example.supabase.controller;

import com.example.supabase.domain.CodigoDescuento;
import com.example.supabase.domain.Empleado;
import com.example.supabase.domain.EstadoPago;
import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Pago;
import com.example.supabase.domain.Reserva;
import com.example.supabase.domain.Rol;
import com.example.supabase.domain.TipoDescuento;
import com.example.supabase.domain.Usuario;
import com.example.supabase.dto.ReservaPorTipoRequest;
import com.example.supabase.dto.ReservaRequest;
import com.example.supabase.repository.CodigoDescuentoRepository;
import com.example.supabase.repository.EmpleadoRepository;
import com.example.supabase.repository.HabitacionRepository;
import com.example.supabase.repository.PagoRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.RoleRepository;
import com.example.supabase.repository.PendingRegistrationRepository;
import com.example.supabase.repository.UsuarioRepository;
import com.example.supabase.service.AdminService;
import com.example.supabase.service.ReservaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final CodigoDescuentoRepository codigoDescuentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReservaService reservaService;
    private final HabitacionRepository habitacionRepository;
    private final ReservaRepository reservaRepository;
    private final PagoRepository pagoRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;

    public AdminController(AdminService adminService,
                           CodigoDescuentoRepository codigoDescuentoRepository,
                           UsuarioRepository usuarioRepository,
                           RoleRepository roleRepository,
                           EmpleadoRepository empleadoRepository,
                           PasswordEncoder passwordEncoder,
                           ReservaService reservaService,
                           HabitacionRepository habitacionRepository,
                           ReservaRepository reservaRepository,
                           PagoRepository pagoRepository,
                           PendingRegistrationRepository pendingRegistrationRepository) {
        this.adminService = adminService;
        this.codigoDescuentoRepository = codigoDescuentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.roleRepository = roleRepository;
        this.empleadoRepository = empleadoRepository;
        this.passwordEncoder = passwordEncoder;
        this.reservaService = reservaService;
        this.habitacionRepository = habitacionRepository;
        this.reservaRepository = reservaRepository;
        this.pagoRepository = pagoRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
    }

    private String obtenerEmail(Authentication auth) {
        if (auth instanceof OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return auth.getName();
    }

    @GetMapping("/stats")
    public Map<String, Object> estadisticas() {
        return adminService.obtenerEstadisticas();
    }

    @GetMapping("/usuarios")
    public List<Map<String, Object>> usuarios() {
        return adminService.obtenerUsuarios();
    }

    @GetMapping("/stats/series")
    public ResponseEntity<?> statsSeries(@RequestParam(required = false) String type,
                                         @RequestParam(required = false) Integer year) {
        if (type != null && !type.equals("monthly") && !type.equals("yearly"))
            return ResponseEntity.badRequest().body("Tipo inválido. Use 'monthly' o 'yearly'.");
        if (year != null && (year < 2000 || year > 2100))
            return ResponseEntity.badRequest().body("Año fuera de rango.");
        return ResponseEntity.ok(adminService.obtenerSeries(type, year));
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, Authentication auth) {
        adminService.eliminarUsuario(id, obtenerEmail(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/habitaciones/tipo/{tipo}/imagen")
    public ResponseEntity<?> uploadImagenHabitacion(
            @PathVariable String tipo,
            @RequestParam("filename") String filename,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminService.subirImagen(filename, file));
    }

    @PostMapping("/servicios/{id}/imagen")
    public ResponseEntity<?> uploadImagenServicio(
            @PathVariable Long id,
            @RequestParam("filename") String filename,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminService.subirImagen(filename, file));
    }

    // ── CÓDIGOS DE DESCUENTO ─────────────────────────────────────────────

    @GetMapping("/codigos-descuento")
    public List<CodigoDescuento> listarCodigosDescuento() {
        return codigoDescuentoRepository.findAll();
    }

    @PostMapping("/codigos-descuento")
    public ResponseEntity<?> crearCodigoDescuento(@RequestBody Map<String, Object> body) {
        try {
            String codigo = ((String) body.get("codigo")).trim().toUpperCase();
            if (codigo.isEmpty()) return ResponseEntity.badRequest().body("Código vacío.");
            if (!codigo.matches("^[A-Z0-9-]{3,30}$"))
                return ResponseEntity.badRequest().body("El código solo puede tener letras mayúsculas, números y guiones (3-30 caracteres).");
            if (codigoDescuentoRepository.findByCodigoIgnoreCase(codigo).isPresent())
                return ResponseEntity.badRequest().body("Ese código ya existe.");

            CodigoDescuento c = new CodigoDescuento();
            c.setCodigo(codigo);
            TipoDescuento tipo;
            try { tipo = TipoDescuento.valueOf(((String) body.getOrDefault("tipo", "PORCENTAJE"))); }
            catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body("Tipo de descuento inválido."); }
            c.setTipo(tipo);
            BigDecimal valor = new BigDecimal(body.get("valor").toString());
            if (valor.compareTo(BigDecimal.ZERO) <= 0)
                return ResponseEntity.badRequest().body("El valor debe ser mayor que cero.");
            if (tipo == TipoDescuento.PORCENTAJE && valor.compareTo(new BigDecimal("100")) > 0)
                return ResponseEntity.badRequest().body("El porcentaje no puede superar el 100%.");
            c.setValor(valor);
            if (body.get("montoMinimo") != null && !body.get("montoMinimo").toString().isBlank()) {
                BigDecimal montoMinimo = new BigDecimal(body.get("montoMinimo").toString());
                if (montoMinimo.compareTo(BigDecimal.ZERO) < 0)
                    return ResponseEntity.badRequest().body("El monto mínimo no puede ser negativo.");
                c.setMontoMinimo(montoMinimo);
            }
            if (body.get("validoHasta") != null && !body.get("validoHasta").toString().isBlank())
                c.setValidoHasta(LocalDate.parse(body.get("validoHasta").toString()));
            if (body.get("usoMaximo") != null && !body.get("usoMaximo").toString().isBlank()) {
                int usoMaximo = Integer.parseInt(body.get("usoMaximo").toString());
                if (usoMaximo <= 0) return ResponseEntity.badRequest().body("El uso máximo debe ser mayor que cero.");
                c.setUsoMaximo(usoMaximo);
            }
            c.setActivo(!Boolean.FALSE.equals(body.get("activo")));
            return ResponseEntity.ok(codigoDescuentoRepository.save(c));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Datos inválidos: " + e.getMessage());
        }
    }

    @PutMapping("/codigos-descuento/{id}")
    public ResponseEntity<?> actualizarCodigoDescuento(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return codigoDescuentoRepository.findById(id).map(c -> {
            if (body.containsKey("activo")) c.setActivo(Boolean.TRUE.equals(body.get("activo")));
            if (body.get("tipo") != null)   c.setTipo(TipoDescuento.valueOf((String) body.get("tipo")));
            if (body.get("valor") != null) {
                BigDecimal valor = new BigDecimal(body.get("valor").toString());
                if (valor.compareTo(BigDecimal.ZERO) <= 0)
                    return ResponseEntity.badRequest().body("El valor debe ser mayor que cero.");
                TipoDescuento tipo = body.get("tipo") != null ? TipoDescuento.valueOf((String) body.get("tipo")) : c.getTipo();
                if (tipo == TipoDescuento.PORCENTAJE && valor.compareTo(new BigDecimal("100")) > 0)
                    return ResponseEntity.badRequest().body("El porcentaje no puede superar el 100%.");
                c.setValor(valor);
            }
            if (body.get("montoMinimo") != null) {
                if (!body.get("montoMinimo").toString().isBlank()) {
                    BigDecimal montoMinimo = new BigDecimal(body.get("montoMinimo").toString());
                    if (montoMinimo.compareTo(BigDecimal.ZERO) < 0)
                        return ResponseEntity.badRequest().body("El monto mínimo no puede ser negativo.");
                    c.setMontoMinimo(montoMinimo);
                } else {
                    c.setMontoMinimo(null);
                }
            }
            if (body.get("validoHasta") != null)
                c.setValidoHasta(body.get("validoHasta").toString().isBlank() ? null : LocalDate.parse(body.get("validoHasta").toString()));
            if (body.get("usoMaximo") != null) {
                if (!body.get("usoMaximo").toString().isBlank()) {
                    int usoMaximo = Integer.parseInt(body.get("usoMaximo").toString());
                    if (usoMaximo <= 0)
                        return ResponseEntity.badRequest().body("El uso máximo debe ser mayor que cero.");
                    c.setUsoMaximo(usoMaximo);
                } else {
                    c.setUsoMaximo(null);
                }
            }
            return ResponseEntity.ok(codigoDescuentoRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/codigos-descuento/{id}")
    public ResponseEntity<?> eliminarCodigoDescuento(@PathVariable Long id) {
        codigoDescuentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── ROLES STAFF ──────────────────────────────────────────────────────────

    private static final java.util.Set<String> ROLES_ASIGNABLES =
            java.util.Set.of("ROLE_RECEPCION", "ROLE_ADMIN", "ROLE_LIMPIEZA", "ROLE_GIMNASIO", "ROLE_SPA", "ROLE_COCHE", "ROLE_HOSTELERIA", "ROLE_ROOMSERVICE");

    @GetMapping("/roles")
    public List<Map<String, Object>> listarRoles() {
        return roleRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareTo(b.getName()))
                .map(r -> Map.<String, Object>of("id", r.getId(), "name", r.getName()))
                .collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/usuarios/{id}/roles")
    public ResponseEntity<?> asignarRol(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String rolName = body.get("rol") != null ? body.get("rol").toString().trim() : null;
        if (rolName == null || rolName.isBlank())
            return ResponseEntity.badRequest().body("Falta el campo 'rol'.");
        if (!rolName.startsWith("ROLE_")) rolName = "ROLE_" + rolName.toUpperCase();
        if (!ROLES_ASIGNABLES.contains(rolName))
            return ResponseEntity.badRequest().body("Rol no asignable: " + rolName);

        Usuario u = usuarioRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();

        final String finalRolName = rolName;
        Rol r = roleRepository.findByName(finalRolName).orElseGet(() -> {
            Rol nr = new Rol();
            nr.setName(finalRolName);
            return roleRepository.save(nr);
        });

        if (u.getRoles() == null) u.setRoles(new java.util.HashSet<>());
        boolean nuevo = u.getRoles().add(r);
        if (nuevo) {
            usuarioRepository.save(u);
            if (empleadoRepository.findByUsuarioId(u.getId()).isEmpty()) {
                Empleado emp = new Empleado();
                emp.setUsuario(u);
                empleadoRepository.save(emp);
            }
        }

        return ResponseEntity.ok(Map.of(
                "usuarioId", u.getId(),
                "email", u.getEmail(),
                "rol", finalRolName,
                "anyadido", nuevo
        ));
    }

    @DeleteMapping("/usuarios/{id}/roles/{rolName}")
    public ResponseEntity<?> revocarRol(@PathVariable Long id, @PathVariable("rolName") String rolNameParam) {
        String rolName = rolNameParam != null && rolNameParam.startsWith("ROLE_")
                ? rolNameParam : "ROLE_" + (rolNameParam == null ? "" : rolNameParam.toUpperCase());
        if (!ROLES_ASIGNABLES.contains(rolName))
            return ResponseEntity.badRequest().body("Rol no revocable: " + rolName);

        Usuario u = usuarioRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        if (u.getRoles() == null || u.getRoles().isEmpty()) return ResponseEntity.noContent().build();

        boolean removed = u.getRoles().removeIf(r -> rolName.equalsIgnoreCase(r.getName()));
        if (removed) usuarioRepository.save(u);
        return ResponseEntity.noContent().build();
    }

    // ── CREAR EMPLEADO COMPLETO ──────────────────────────────────────────────

    @PostMapping("/empleados")
    @Transactional
    public ResponseEntity<?> crearEmpleado(@RequestBody Map<String, Object> body) {
        // Recoger todos los campos
        String email    = getStr(body, "email");
        String password = getStr(body, "password");
        String nombre   = getStr(body, "nombre");
        String rolName  = getStr(body, "rol");
        String apellidos        = getStr(body, "apellidos");
        String genero           = getStr(body, "genero");
        String tipoDocumento    = getStr(body, "tipoDocumento");
        String numDocumento     = getStr(body, "numDocumento");
        String telefono         = getStr(body, "telefono");
        String cargo            = getStr(body, "cargo");
        String tipoContratacion = getStr(body, "tipoContratacion");
        String tipoEmpleado     = getStr(body, "tipoEmpleado");
        String departamento     = getStr(body, "departamento");
        String lugarNacimiento  = getStr(body, "lugarNacimiento");
        String pais             = getStr(body, "pais");
        String telefonoCasa     = getStr(body, "telefonoCasa");
        String direccionCasa    = getStr(body, "direccionCasa");
        String telefonoOficina  = getStr(body, "telefonoOficina");
        String direccionOficina = getStr(body, "direccionOficina");
        String fnStr            = getStr(body, "fechaNacimiento");
        String fcStr            = getStr(body, "fechaContratacion");

        // ── Todos los campos son OBLIGATORIOS ──────────────────────────────
        String missing = primerCampoFaltante(
            "Nombre", nombre,    "Apellidos", apellidos,
            "Email", email,      "Contraseña", password,
            "Rol", rolName,      "Género", genero,
            "Tipo de documento", tipoDocumento, "Número de documento", numDocumento,
            "Teléfono", telefono,  "Cargo", cargo,
            "Tipo de contratación", tipoContratacion,
            "Tipo de empleado",     tipoEmpleado,
            "Departamento", departamento,
            "Lugar de nacimiento", lugarNacimiento,
            "País", pais,
            "Teléfono de casa", telefonoCasa,
            "Dirección de casa", direccionCasa,
            "Teléfono de oficina", telefonoOficina,
            "Dirección de oficina", direccionOficina,
            "Fecha de nacimiento", fnStr,
            "Fecha de contratación", fcStr
        );
        if (missing != null)
            return ResponseEntity.badRequest().body("El campo «" + missing + "» es obligatorio.");

        if (password.length() < 6)
            return ResponseEntity.badRequest().body("La contraseña debe tener al menos 6 caracteres.");

        // ── Validar duplicados (email, número de documento, teléfono) ──────
        String emailL = email.toLowerCase();
        if (usuarioRepository.findByEmail(emailL).isPresent())
            return ResponseEntity.status(409).body("Ya existe un usuario con ese correo electrónico.");

        String telN = normalizarTelefono(telefono);
        if (existeNumDocumento(numDocumento, null))
            return ResponseEntity.status(409).body("Ya existe un usuario con ese número de documento.");
        if (existeTelefono(telN, null))
            return ResponseEntity.status(409).body("Ya existe un usuario con ese teléfono.");

        // ── Crear usuario + rol ────────────────────────────────────────────
        Usuario u = new Usuario();
        u.setEmail(emailL);
        u.setNombre(nombre);
        u.setPassword(passwordEncoder.encode(password));
        u.setRoles(new java.util.HashSet<>());

        String rn = rolName.startsWith("ROLE_") ? rolName.toUpperCase() : "ROLE_" + rolName.toUpperCase();
        if (!ROLES_ASIGNABLES.contains(rn))
            return ResponseEntity.badRequest().body("Rol no válido: " + rn);
        final String finalRn = rn;
        Rol r = roleRepository.findByName(finalRn).orElseGet(() -> {
            Rol nr = new Rol(); nr.setName(finalRn); return roleRepository.save(nr);
        });
        u.getRoles().add(r);
        u = usuarioRepository.save(u);

        // ── Crear ficha empleado ───────────────────────────────────────────
        Empleado emp = new Empleado();
        emp.setUsuario(u);
        emp.setApellidos(apellidos);
        emp.setGenero(genero);
        emp.setTipoDocumento(tipoDocumento);
        emp.setNumDocumento(numDocumento);
        emp.setTelefono(telefono);
        emp.setCargo(cargo);
        emp.setTipoContratacion(tipoContratacion);
        emp.setTipoEmpleado(tipoEmpleado);
        emp.setDepartamento(departamento);
        emp.setLugarNacimiento(lugarNacimiento);
        emp.setPais(pais);
        emp.setTelefonoCasa(telefonoCasa);
        emp.setDireccionCasa(direccionCasa);
        emp.setTelefonoOficina(telefonoOficina);
        emp.setDireccionOficina(direccionOficina);
        try { emp.setFechaNacimiento(LocalDate.parse(fnStr)); }
        catch (Exception ignored) { return ResponseEntity.badRequest().body("Fecha de nacimiento inválida."); }
        try { emp.setFechaContratacion(LocalDate.parse(fcStr)); }
        catch (Exception ignored) { return ResponseEntity.badRequest().body("Fecha de contratación inválida."); }

        empleadoRepository.save(emp);

        return ResponseEntity.ok(Map.of(
                "id",     u.getId(),
                "email",  u.getEmail(),
                "nombre", u.getNombre() != null ? u.getNombre() : ""
        ));
    }

    @PutMapping("/empleados/{usuarioId}")
    @Transactional
    public ResponseEntity<?> editarEmpleado(@PathVariable Long usuarioId, @RequestBody Map<String, Object> body) {
        Usuario u = usuarioRepository.findById(usuarioId).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        Empleado e = empleadoRepository.findByUsuarioId(usuarioId).orElse(null);
        if (e == null) return ResponseEntity.badRequest().body("Este usuario no tiene ficha de empleado.");

        String email = getStr(body, "email");
        String nombre = getStr(body, "nombre");
        String apellidos = getStr(body, "apellidos");
        String genero = getStr(body, "genero");
        String tipoDocumento = getStr(body, "tipoDocumento");
        String numDocumento = getStr(body, "numDocumento");
        String telefono = getStr(body, "telefono");
        String cargo = getStr(body, "cargo");
        String tipoContratacion = getStr(body, "tipoContratacion");
        String tipoEmpleado = getStr(body, "tipoEmpleado");
        String departamento = getStr(body, "departamento");
        String lugarNacimiento = getStr(body, "lugarNacimiento");
        String pais = getStr(body, "pais");
        String telefonoCasa = getStr(body, "telefonoCasa");
        String direccionCasa = getStr(body, "direccionCasa");
        String telefonoOficina = getStr(body, "telefonoOficina");
        String direccionOficina = getStr(body, "direccionOficina");
        String fnStr = getStr(body, "fechaNacimiento");
        String fcStr = getStr(body, "fechaContratacion");

        String missing = primerCampoFaltante(
            "Nombre", nombre, "Apellidos", apellidos,
            "Email", email,
            "Género", genero,
            "Tipo de documento", tipoDocumento, "Número de documento", numDocumento,
            "Teléfono", telefono, "Cargo", cargo,
            "Tipo de contratación", tipoContratacion,
            "Tipo de empleado", tipoEmpleado,
            "Departamento", departamento,
            "Lugar de nacimiento", lugarNacimiento,
            "País", pais,
            "Teléfono de casa", telefonoCasa, "Dirección de casa", direccionCasa,
            "Teléfono de oficina", telefonoOficina, "Dirección de oficina", direccionOficina,
            "Fecha de nacimiento", fnStr, "Fecha de contratación", fcStr
        );
        if (missing != null)
            return ResponseEntity.badRequest().body("El campo «" + missing + "» es obligatorio.");

        // Duplicados (excluyendo este propio usuario)
        String emailL = email.toLowerCase();
        var existeEmail = usuarioRepository.findByEmail(emailL);
        if (existeEmail.isPresent() && !existeEmail.get().getId().equals(usuarioId))
            return ResponseEntity.status(409).body("Ya existe otro usuario con ese correo electrónico.");
        String telN = normalizarTelefono(telefono);
        if (existeNumDocumento(numDocumento, usuarioId))
            return ResponseEntity.status(409).body("Ya existe otro usuario con ese número de documento.");
        if (existeTelefono(telN, usuarioId))
            return ResponseEntity.status(409).body("Ya existe otro usuario con ese teléfono.");

        u.setEmail(emailL);
        u.setNombre(nombre);
        usuarioRepository.save(u);

        e.setApellidos(apellidos);
        e.setGenero(genero);
        e.setTipoDocumento(tipoDocumento);
        e.setNumDocumento(numDocumento);
        e.setTelefono(telefono);
        e.setCargo(cargo);
        e.setTipoContratacion(tipoContratacion);
        e.setTipoEmpleado(tipoEmpleado);
        e.setDepartamento(departamento);
        e.setLugarNacimiento(lugarNacimiento);
        e.setPais(pais);
        e.setTelefonoCasa(telefonoCasa);
        e.setDireccionCasa(direccionCasa);
        e.setTelefonoOficina(telefonoOficina);
        e.setDireccionOficina(direccionOficina);
        try { e.setFechaNacimiento(LocalDate.parse(fnStr)); }
        catch (Exception ignored) { return ResponseEntity.badRequest().body("Fecha de nacimiento inválida."); }
        try { e.setFechaContratacion(LocalDate.parse(fcStr)); }
        catch (Exception ignored) { return ResponseEntity.badRequest().body("Fecha de contratación inválida."); }
        empleadoRepository.save(e);

        return ResponseEntity.ok(Map.of("id", u.getId(), "email", u.getEmail(), "nombre", u.getNombre()));
    }

    private static String getStr(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static String primerCampoFaltante(String... pares) {
        for (int i = 0; i < pares.length; i += 2) {
            String label = pares[i];
            String val   = i + 1 < pares.length ? pares[i + 1] : null;
            if (val == null || val.isBlank()) return label;
        }
        return null;
    }

    /** Normaliza un teléfono: elimina espacios, guiones, paréntesis, puntos. */
    private static String normalizarTelefono(String t) {
        if (t == null) return null;
        return t.replaceAll("[\\s\\-().]", "");
    }

    private boolean existeNumDocumento(String num, Long excluirUsuarioId) {
        if (num == null || num.isBlank()) return false;
        return empleadoRepository.findAll().stream().anyMatch(e ->
            num.equalsIgnoreCase(String.valueOf(e.getNumDocumento()).trim())
            && (excluirUsuarioId == null || !e.getUsuario().getId().equals(excluirUsuarioId)));
    }

    private boolean existeTelefono(String telNormalizado, Long excluirUsuarioId) {
        if (telNormalizado == null || telNormalizado.isBlank()) return false;
        return empleadoRepository.findAll().stream().anyMatch(e -> {
            String otro = normalizarTelefono(e.getTelefono());
            return telNormalizado.equals(otro)
                && (excluirUsuarioId == null || !e.getUsuario().getId().equals(excluirUsuarioId));
        });
    }

    // ── DETALLE DE USUARIO (info + ficha de empleado si aplica) ────────────
    @GetMapping("/usuarios/{id}/detalle")
    public ResponseEntity<?> detalleUsuario(@PathVariable Long id) {
        Usuario u = usuarioRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();

        Map<String, Object> usrMap = new java.util.LinkedHashMap<>();
        usrMap.put("id",     u.getId());
        usrMap.put("nombre", u.getNombre());
        usrMap.put("email",  u.getEmail());
        usrMap.put("departamento", u.getDepartamento());
        usrMap.put("roles",  u.getRoles().stream().map(Rol::getName).sorted().collect(java.util.stream.Collectors.toList()));
        usrMap.put("tipoDocumento",   u.getTipoDocumento());
        usrMap.put("numDocumento",    u.getNumDocumento());
        usrMap.put("fechaNacimiento", u.getFechaNacimiento() != null ? u.getFechaNacimiento().toString() : null);
        usrMap.put("telefonoPrefijo", u.getTelefonoPrefijo());
        usrMap.put("telefono",        u.getTelefono());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("usuario", usrMap);

        Empleado e = empleadoRepository.findByUsuarioId(id).orElse(null);
        if (e != null) {
            Map<String, Object> emp = new java.util.LinkedHashMap<>();
            emp.put("id",                e.getId());
            emp.put("apellidos",         e.getApellidos());
            emp.put("genero",            e.getGenero());
            emp.put("tipoDocumento",     e.getTipoDocumento());
            emp.put("numDocumento",      e.getNumDocumento());
            emp.put("telefono",          e.getTelefono());
            emp.put("cargo",             e.getCargo());
            emp.put("fechaNacimiento",   e.getFechaNacimiento() != null ? e.getFechaNacimiento().toString() : null);
            emp.put("fechaContratacion", e.getFechaContratacion() != null ? e.getFechaContratacion().toString() : null);
            emp.put("tipoContratacion",  e.getTipoContratacion());
            emp.put("tipoEmpleado",      e.getTipoEmpleado());
            emp.put("lugarNacimiento",   e.getLugarNacimiento());
            emp.put("pais",              e.getPais());
            emp.put("telefonoCasa",      e.getTelefonoCasa());
            emp.put("direccionCasa",     e.getDireccionCasa());
            emp.put("telefonoOficina",   e.getTelefonoOficina());
            emp.put("direccionOficina",  e.getDireccionOficina());
            emp.put("departamento",      e.getDepartamento());
            emp.put("turnoPlanId",       e.getTurnoPlan() != null ? e.getTurnoPlan().getId() : null);
            emp.put("turnoPlanNombre",   e.getTurnoPlan() != null ? e.getTurnoPlan().getNombre() : null);
            result.put("empleado", emp);
        }

        return ResponseEntity.ok(result);
    }

    // ── CLIENTES ──────────────────────────────────────────────────────────────

    @PostMapping("/clientes")
    @Transactional
    public ResponseEntity<?> crearCliente(@RequestBody Map<String, String> datos) {
        String nombre   = datos.get("nombre");
        String email    = datos.get("email");
        String password = datos.get("password");

        if (nombre == null || nombre.isBlank())   return ResponseEntity.badRequest().body("El nombre es obligatorio.");
        if (email  == null || email.isBlank())    return ResponseEntity.badRequest().body("El email es obligatorio.");
        if (password == null || password.length() < 6) return ResponseEntity.badRequest().body("La contraseña debe tener mínimo 6 caracteres.");

        if (usuarioRepository.findByEmail(email.trim()).isPresent())
            return ResponseEntity.badRequest().body("Ya existe un usuario con ese email.");

        String numDoc = datos.get("numDocumento");
        if (numDoc != null && !numDoc.isBlank()) {
            String docNorm = numDoc.trim().toUpperCase();
            if (usuarioRepository.findByNumDocumento(docNorm).isPresent() ||
                pendingRegistrationRepository.findByNumDocumento(docNorm).isPresent())
                return ResponseEntity.status(409).body("Ya existe una cuenta con ese número de documento.");
            numDoc = docNorm;
        }

        String telefono = datos.get("telefono");
        if (telefono != null && !telefono.isBlank()) {
            String telNorm = telefono.trim().replaceAll("\\s+", "");
            if (usuarioRepository.findByTelefono(telNorm).isPresent() ||
                pendingRegistrationRepository.findByTelefono(telNorm).isPresent())
                return ResponseEntity.status(409).body("Ya existe una cuenta con ese número de teléfono.");
            telefono = telNorm;
        }

        Rol rolCliente = roleRepository.findAll().stream()
                .filter(r -> r.getName().equals("ROLE_CLIENTE"))
                .findFirst().orElse(null);
        if (rolCliente == null) return ResponseEntity.status(500).body("Rol ROLE_CLIENTE no encontrado.");

        Usuario u = new Usuario();
        u.setNombre(nombre.trim());
        u.setEmail(email.trim());
        u.setPassword(passwordEncoder.encode(password));
        u.setTipoDocumento(datos.get("tipoDocumento"));
        u.setNumDocumento(numDoc);
        u.setTelefonoPrefijo(datos.get("telefonoPrefijo"));
        u.setTelefono(telefono);
        String fn = datos.get("fechaNacimiento");
        if (fn != null && !fn.isBlank()) {
            try { u.setFechaNacimiento(LocalDate.parse(fn)); } catch (Exception ignored) {}
        }
        u.setRoles(new java.util.HashSet<>(java.util.List.of(rolCliente)));
        usuarioRepository.save(u);

        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    // ── DISPONIBILIDAD DE HABITACIONES ────────────────────────────────────────

    @GetMapping("/habitaciones/disponibilidad")
    public List<Map<String, Object>> disponibilidad(
            @RequestParam String fechaEntrada,
            @RequestParam String fechaSalida) {

        LocalDate desde = LocalDate.parse(fechaEntrada);
        LocalDate hasta = LocalDate.parse(fechaSalida);

        // Reservas activas (sin checkout) que solapan el rango
        List<Reserva> solapadas = reservaRepository.findSolapanRango(desde, hasta).stream()
                .filter(r -> r.getCheckoutEn() == null)
                .toList();

        return habitacionRepository.findAll().stream()
                .sorted(java.util.Comparator
                        .comparing((Habitacion h) -> h.getTipo().ordinal())
                        .thenComparing(Habitacion::getNumero))
                .map(h -> {
                    Reserva reservaActiva = solapadas.stream()
                            .filter(r -> r.getHabitacion().getId().equals(h.getId()))
                            .findFirst().orElse(null);

                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", h.getId());
                    m.put("numero", h.getNumero());
                    m.put("tipo", h.getTipo().name());
                    m.put("precioNoche", h.getPrecioNoche());
                    m.put("disponible", reservaActiva == null);
                    if (reservaActiva != null) {
                        Usuario u = reservaActiva.getUsuario();
                        m.put("clienteNombre", u.getNombre() != null ? u.getNombre() : u.getEmail());
                        m.put("clienteEmail", u.getEmail());
                        m.put("reservaEntrada", reservaActiva.getFechaEntrada().toString());
                        m.put("reservaSalida", reservaActiva.getFechaSalida().toString());
                    }
                    return m;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    // ── RESERVAS MANUALES ─────────────────────────────────────────────────────

    @PostMapping("/reservas/manual/habitacion")
    @Transactional
    public ResponseEntity<?> asignarHabitacionManual(@RequestBody Map<String, Object> datos) {
        Object cidObj = datos.get("clienteId");
        Object hidObj = datos.get("habitacionId");
        if (cidObj == null || hidObj == null) return ResponseEntity.badRequest().body("Faltan datos.");

        Long clienteId, habitacionId;
        try {
            clienteId    = Long.parseLong(cidObj.toString());
            habitacionId = Long.parseLong(hidObj.toString());
        } catch (NumberFormatException e) { return ResponseEntity.badRequest().body("IDs inválidos."); }

        Usuario cliente = usuarioRepository.findById(clienteId).orElse(null);
        if (cliente == null) return ResponseEntity.badRequest().body("Cliente no encontrado.");

        boolean confirmar = Boolean.TRUE.equals(datos.get("confirmar"));

        try {
            String feStr = (String) datos.get("fechaEntrada");
            String fsStr = (String) datos.get("fechaSalida");
            if (feStr == null || fsStr == null) return ResponseEntity.badRequest().body("Fechas obligatorias.");
            LocalDate fechaEntrada, fechaSalida;
            try {
                fechaEntrada = LocalDate.parse(feStr);
                fechaSalida  = LocalDate.parse(fsStr);
            } catch (Exception e) { return ResponseEntity.badRequest().body("Formato de fecha inválido (AAAA-MM-DD)."); }
            if (!fechaEntrada.isBefore(fechaSalida)) return ResponseEntity.badRequest().body("La entrada debe ser anterior a la salida.");
            long noches = java.time.temporal.ChronoUnit.DAYS.between(fechaEntrada, fechaSalida);
            if (noches <= 0) return ResponseEntity.badRequest().body("La estancia debe ser de al menos 1 noche.");

            ReservaRequest req = new ReservaRequest();
            req.habitacionId     = habitacionId;
            req.fechaEntrada     = fechaEntrada;
            req.fechaSalida      = fechaSalida;
            req.peticionEspecial = (String) datos.getOrDefault("peticionEspecial", null);

            Reserva reserva = reservaService.crear(req, cliente.getEmail());

            if (confirmar) {
                Habitacion hab = habitacionRepository.findById(habitacionId).orElse(null);
                BigDecimal precioNoche = hab != null ? hab.getPrecioNoche() : BigDecimal.ZERO;
                BigDecimal total = precioNoche.multiply(BigDecimal.valueOf(noches));

                Pago pago = new Pago();
                pago.setReservaId(reserva.getId());
                pago.setUsuarioId(cliente.getId());
                pago.setSubtotal(total);
                pago.setDescuento(BigDecimal.ZERO);
                pago.setTotal(total);
                pago.setEstado(EstadoPago.COMPLETADO);
                pago.setMetodoTipo("RECEPCION");
                pago.setCompletedAt(java.time.LocalDateTime.now());
                pago.setReferencia("ADM-" + reserva.getId());
                pagoRepository.save(pago);
            }

            return ResponseEntity.ok(Map.of("id", reserva.getId(), "confirmada", confirmar));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reservas/manual")
    public ResponseEntity<?> crearReservaManual(@RequestBody Map<String, Object> datos) {
        Object cidObj = datos.get("clienteId");
        if (cidObj == null) return ResponseEntity.badRequest().body("Falta clienteId.");

        Long clienteId;
        try { clienteId = Long.parseLong(cidObj.toString()); }
        catch (NumberFormatException e) { return ResponseEntity.badRequest().body("clienteId inválido."); }

        Usuario cliente = usuarioRepository.findById(clienteId).orElse(null);
        if (cliente == null) return ResponseEntity.badRequest().body("Cliente no encontrado.");

        try {
            ReservaPorTipoRequest req = new ReservaPorTipoRequest();
            req.tipo           = (String) datos.get("tipo");
            req.fechaEntrada   = LocalDate.parse((String) datos.get("fechaEntrada"));
            req.fechaSalida    = LocalDate.parse((String) datos.get("fechaSalida"));
            req.peticionEspecial = (String) datos.getOrDefault("peticionEspecial", null);

            var reserva = reservaService.crearPorTipo(req, cliente.getEmail());
            return ResponseEntity.ok(reserva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
