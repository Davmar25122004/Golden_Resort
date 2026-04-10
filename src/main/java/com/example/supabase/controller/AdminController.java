package com.example.supabase.controller;

import com.example.supabase.domain.Reserva;
import com.example.supabase.domain.ReservaServicio;
import com.example.supabase.domain.Usuario;
import com.example.supabase.repository.HabitacionRepository;
import com.example.supabase.repository.PedidoRoomServiceRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.ReservaServicioRepository;
import com.example.supabase.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReservaServicioRepository reservaServicioRepository;
    private final PedidoRoomServiceRepository pedidoRoomServiceRepository;

    public AdminController(ReservaRepository reservaRepository,
                           HabitacionRepository habitacionRepository,
                           UsuarioRepository usuarioRepository,
                           ReservaServicioRepository reservaServicioRepository,
                           PedidoRoomServiceRepository pedidoRoomServiceRepository) {
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.reservaServicioRepository = reservaServicioRepository;
        this.pedidoRoomServiceRepository = pedidoRoomServiceRepository;
    }

    private String getEmail(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return authentication.getName();
    }

    // GET /api/admin/stats → métricas del hotel
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        LocalDate hoy = LocalDate.now();

        long reservasHoy = reservaRepository.findByFechaEntrada(hoy).size();
        long reservasMes = reservaRepository.findByMes(hoy.getYear(), hoy.getMonthValue()).size();

        // Ingresos de este mes: suma de (días × precio_noche) + servicios del mes actual
        BigDecimal ingresosMes = reservaRepository.findByMes(hoy.getYear(), hoy.getMonthValue()).stream()
                .map(r -> {
                    long dias = ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());
                    BigDecimal hab = r.getHabitacion().getPrecioNoche().multiply(BigDecimal.valueOf(dias));
                    BigDecimal servicios = BigDecimal.ZERO;
                    if (r.getServicios() != null) {
                        for (ReservaServicio rs : r.getServicios()) {
                            servicios = servicios.add(
                                    rs.getServicio().getPrecio().multiply(BigDecimal.valueOf(rs.getCantidad()))
                            );
                        }
                    }
                    BigDecimal subtotalRS = pedidoRoomServiceRepository.findByReservaId(r.getId())
                            .stream()
                            .map(p -> p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return hab.add(servicios).add(subtotalRS);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalHabitaciones = habitacionRepository.count();
        long ocupadasHoy = reservaRepository.contarHabitacionesOcupadasHoy(hoy);

        // Próximas llegadas (hasta 10), desde hoy
        List<Reserva> proximas = reservaRepository
                .findByFechaEntradaGreaterThanEqualOrderByFechaEntradaAsc(hoy)
                .stream().limit(10).collect(Collectors.toList());

        List<Map<String, Object>> proximasLlegadas = proximas.stream()
                .map(r -> Map.<String, Object>of(
                        "id",               r.getId(),
                        "clienteNombre",    r.getUsuario().getNombre() != null ? r.getUsuario().getNombre() : r.getUsuario().getEmail(),
                        "clienteEmail",     r.getUsuario().getEmail(),
                        "habitacionNumero", r.getHabitacion().getNumero(),
                        "habitacionTipo",   r.getHabitacion().getTipo().name(),
                        "fechaEntrada",     r.getFechaEntrada().toString(),
                        "fechaSalida",      r.getFechaSalida().toString()
                ))
                .collect(Collectors.toList());

        return Map.of(
                "reservasHoy",       reservasHoy,
                "reservasMes",       reservasMes,
                "ingresosMes",       ingresosMes,
                "totalHabitaciones", totalHabitaciones,
                "ocupadasHoy",       ocupadasHoy,
                "proximasLlegadas",  proximasLlegadas
        );
    }

    // GET /api/admin/usuarios → lista de usuarios con rol (sin password)
    @GetMapping("/usuarios")
    public List<Map<String, Object>> usuarios() {
        return usuarioRepository.findAll().stream()
                .map(u -> {
                    String rol = u.getRoles().stream()
                            .map(r -> r.getName())
                            .findFirst().orElse("SIN ROL");
                    return Map.<String, Object>of(
                            "id",     u.getId(),
                            "nombre", u.getNombre() != null ? u.getNombre() : "",
                            "email",  u.getEmail(),
                            "rol",    rol
                    );
                })
                .collect(Collectors.toList());
    }

    // DELETE /api/admin/usuarios/{id} → eliminar usuario y sus reservas en cascada (solo ADMIN)
    @DeleteMapping("/usuarios/{id}")
    @Transactional
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id,
                                              Authentication authentication) {
        String adminEmail = getEmail(authentication);
        return usuarioRepository.findById(id).map(u -> {
            // Protección: el admin no puede eliminarse a sí mismo
            if (u.getEmail().equals(adminEmail)) {
                return ResponseEntity.badRequest().body("No puedes eliminar tu propia cuenta.");
            }
            // Borrado en cascada: pedidos_room_service → reserva_servicio → reservas → roles → usuario
            List<Reserva> reservas = reservaRepository.findByUsuario(u);
            for (Reserva r : reservas) {
                pedidoRoomServiceRepository.deleteByReservaId(r.getId());
                reservaServicioRepository.deleteByReservaId(r.getId());
            }
            reservaRepository.deleteAll(reservas);
            u.getRoles().clear();
            usuarioRepository.save(u);
            usuarioRepository.delete(u);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // POST /api/admin/habitaciones/tipo/{tipo}/imagen → subir imagen de habitación
    @PostMapping("/habitaciones/tipo/{tipo}/imagen")
    public ResponseEntity<?> uploadImagenHabitacion(
            @PathVariable String tipo,
            @RequestParam("filename") String filename,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {

        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");
        try {
            String safeFilename = java.nio.file.Paths.get(filename).getFileName().toString();
            if (!safeFilename.toLowerCase().endsWith(".jpg") && !safeFilename.toLowerCase().endsWith(".png")) {
                return ResponseEntity.badRequest().body("Only JPG or PNG images are allowed");
            }

            java.nio.file.Path srcPath = java.nio.file.Paths.get("src/main/resources/static/images", safeFilename);
            file.transferTo(srcPath);

            java.nio.file.Path targetPath = java.nio.file.Paths.get("target/classes/static/images", safeFilename);
            if (java.nio.file.Files.exists(targetPath.getParent())) {
                java.nio.file.Files.copy(srcPath, targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            return ResponseEntity.ok(Map.of("message", "Uploaded successfully", "filepath", "/images/" + safeFilename));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // POST /api/admin/servicios/{id}/imagen → subir imagen de servicio
    @PostMapping("/servicios/{id}/imagen")
    public ResponseEntity<?> uploadImagenServicio(
            @PathVariable Long id,
            @RequestParam("filename") String filename,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {

        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");
        try {
            String safeFilename = java.nio.file.Paths.get(filename).getFileName().toString();
            if (!safeFilename.toLowerCase().endsWith(".jpg") && !safeFilename.toLowerCase().endsWith(".png")) {
                return ResponseEntity.badRequest().body("Only JPG or PNG images are allowed");
            }

            java.nio.file.Path srcPath = java.nio.file.Paths.get("src/main/resources/static/images", safeFilename);
            file.transferTo(srcPath);

            java.nio.file.Path targetPath = java.nio.file.Paths.get("target/classes/static/images", safeFilename);
            if (java.nio.file.Files.exists(targetPath.getParent())) {
                java.nio.file.Files.copy(srcPath, targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            return ResponseEntity.ok(Map.of("message", "Uploaded successfully", "filepath", "/images/" + safeFilename));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}
