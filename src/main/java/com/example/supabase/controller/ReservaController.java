package com.example.supabase.controller;

import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Habitacion.TipoHabitacion;
import com.example.supabase.domain.Reserva;
import com.example.supabase.domain.ReservaServicio;
import com.example.supabase.domain.Servicio;
import com.example.supabase.domain.Usuario;
import com.example.supabase.domain.PedidoRoomService;
import com.example.supabase.repository.HabitacionRepository;
import com.example.supabase.repository.PedidoRoomServiceRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.ReservaServicioRepository;
import com.example.supabase.repository.ServicioRepository;
import com.example.supabase.repository.UsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;
    private final ReservaServicioRepository reservaServicioRepository;
    private final PedidoRoomServiceRepository pedidoRoomServiceRepository;

    public ReservaController(ReservaRepository reservaRepository,
                             HabitacionRepository habitacionRepository,
                             UsuarioRepository usuarioRepository,
                             ServicioRepository servicioRepository,
                             ReservaServicioRepository reservaServicioRepository,
                             PedidoRoomServiceRepository pedidoRoomServiceRepository) {
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicioRepository = servicioRepository;
        this.reservaServicioRepository = reservaServicioRepository;
        this.pedidoRoomServiceRepository = pedidoRoomServiceRepository;
    }

    private String getEmail(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return authentication.getName();
    }

    // GET /api/reservas → todas las reservas enriquecidas (solo ADMIN)
    @GetMapping
    public ResponseEntity<?> listar(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<ReservaDTO> dtos = reservaRepository.findAll().stream()
                .map(r -> {
                    long dias = ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());
                    List<ServicioDTO> serviciosDTOs = new ArrayList<>();
                    BigDecimal totalServicios = BigDecimal.ZERO;
                    if (r.getServicios() != null) {
                        for (ReservaServicio rs : r.getServicios()) {
                            BigDecimal subtotal = rs.getServicio().getPrecio()
                                    .multiply(BigDecimal.valueOf(rs.getCantidad()));
                            totalServicios = totalServicios.add(subtotal);
                            serviciosDTOs.add(new ServicioDTO(
                                    rs.getServicio().getNombre(),
                                    rs.getServicio().getPrecio(),
                                    rs.getCantidad()
                            ));
                        }
                    }
                    BigDecimal subtotalRoomService = pedidoRoomServiceRepository.findByReservaId(r.getId())
                            .stream()
                            .map(p -> p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalHabitacion = r.getHabitacion().getPrecioNoche()
                            .multiply(BigDecimal.valueOf(dias));
                    BigDecimal total = totalHabitacion.add(totalServicios).add(subtotalRoomService);
                    List<PedidoRSDTO> pedidosRS = pedidoRoomServiceRepository.findByReservaId(r.getId())
                            .stream()
                            .map(p -> new PedidoRSDTO(
                                    p.getItem().getNombre(),
                                    p.getCantidad(),
                                    p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad()))
                            ))
                            .collect(Collectors.toList());

                    return new ReservaDTO(
                            r.getId(),
                            r.getFechaEntrada(),
                            r.getFechaSalida(),
                            r.getHabitacion().getTipo().name(),
                            r.getHabitacion().getNumero(),
                            r.getHabitacion().getPrecioNoche(),
                            serviciosDTOs,
                            total,
                            subtotalRoomService,
                            pedidosRS,
                            r.getUsuario().getNombre() != null ? r.getUsuario().getNombre() : r.getUsuario().getEmail(),
                            r.getUsuario().getEmail(),
                            r.getPeticionEspecial()
                    );
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // GET /api/reservas/mis-reservas → reservas del usuario autenticado (DTO plano, sin ciclos)
    @GetMapping("/mis-reservas")
    public ResponseEntity<?> misReservas(Authentication authentication) {
        String email = getEmail(authentication);
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado");
        }
        List<ReservaDTO> dtos = reservaRepository.findByUsuario(usuario).stream()
                .map(r -> {
                    long dias = ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());

                    List<ServicioDTO> serviciosDTOs = new ArrayList<>();
                    BigDecimal totalServicios = BigDecimal.ZERO;

                    if (r.getServicios() != null) {
                        for (ReservaServicio rs : r.getServicios()) {
                            BigDecimal subtotal = rs.getServicio().getPrecio()
                                    .multiply(BigDecimal.valueOf(rs.getCantidad()));
                            totalServicios = totalServicios.add(subtotal);
                            serviciosDTOs.add(new ServicioDTO(
                                    rs.getServicio().getNombre(),
                                    rs.getServicio().getPrecio(),
                                    rs.getCantidad()
                            ));
                        }
                    }

                    BigDecimal subtotalRoomService = pedidoRoomServiceRepository.findByReservaId(r.getId())
                            .stream()
                            .map(p -> p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalHabitacion = r.getHabitacion().getPrecioNoche()
                            .multiply(BigDecimal.valueOf(dias));
                    BigDecimal total = totalHabitacion.add(totalServicios).add(subtotalRoomService);

                    List<PedidoRSDTO> pedidosRS = pedidoRoomServiceRepository.findByReservaId(r.getId())
                            .stream()
                            .map(p -> new PedidoRSDTO(
                                    p.getItem().getNombre(),
                                    p.getCantidad(),
                                    p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad()))
                            ))
                            .collect(Collectors.toList());

                    return new ReservaDTO(
                            r.getId(),
                            r.getFechaEntrada(),
                            r.getFechaSalida(),
                            r.getHabitacion().getTipo().name(),
                            r.getHabitacion().getNumero(),
                            r.getHabitacion().getPrecioNoche(),
                            serviciosDTOs,
                            total,
                            subtotalRoomService,
                            pedidosRS,
                            r.getPeticionEspecial()
                    );
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // GET /api/reservas/usuario/1 → reservas de un usuario (solo el propio o ADMIN)
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> porUsuario(@PathVariable Long usuarioId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Usuario solicitante = usuarioRepository.findByEmail(getEmail(authentication)).orElse(null);
        if (solicitante == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!isAdmin && !solicitante.getId().equals(usuarioId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return usuarioRepository.findById(usuarioId)
                .map(usuario -> ResponseEntity.ok(reservaRepository.findByUsuario(usuario)))
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/reservas → crear reserva por habitacion específica
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ReservaRequest request, Authentication authentication) {
        Usuario usuario = usuarioRepository.findByEmail(getEmail(authentication)).orElse(null);
        Habitacion habitacion = habitacionRepository.findById(request.habitacionId).orElse(null);

        if (usuario == null || habitacion == null) {
            return ResponseEntity.badRequest().body("Usuario o habitación no encontrados");
        }

        long solapadas = reservaRepository.contarReservasSolapadas(
                habitacion, request.fechaEntrada, request.fechaSalida);

        if (solapadas > 0) {
            return ResponseEntity.badRequest().body("La habitación no está disponible en esas fechas");
        }

        Reserva reserva = new Reserva();
        reserva.setUsuario(usuario);
        reserva.setHabitacion(habitacion);
        reserva.setFechaEntrada(request.fechaEntrada);
        reserva.setFechaSalida(request.fechaSalida);
        reserva.setPeticionEspecial(request.peticionEspecial);

        return ResponseEntity.ok(reservaRepository.save(reserva));
    }

    // POST /api/reservas/por-tipo → reservar por tipo (el backend elige la habitacion libre)
    @PostMapping("/por-tipo")
    public ResponseEntity<?> crearPorTipo(@RequestBody ReservaPorTipoRequest request,
                                          Authentication authentication) {
        if (request.fechaEntrada == null || request.fechaSalida == null) {
            return ResponseEntity.badRequest().body("Las fechas son obligatorias");
        }
        if (request.fechaEntrada.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body("La reserva debe ser posterior a hoy");
        }
        if (!request.fechaEntrada.isBefore(request.fechaSalida)) {
            return ResponseEntity.badRequest().body("La fecha de entrada no puede ser posterior a la de salida");
        }

        TipoHabitacion tipo;
        try {
            tipo = TipoHabitacion.valueOf(request.tipo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Tipo de habitación inválido");
        }

        String email = getEmail(authentication);
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado");
        }

        List<Habitacion> disponibles = habitacionRepository.findAvailableByTipo(
                tipo, request.fechaEntrada, request.fechaSalida, PageRequest.of(0, 1));

        if (disponibles.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Sin disponibilidad para ese tipo de habitación en las fechas indicadas");
        }

        // Validar servicios si se enviaron
        List<ReservaServicio> serviciosReserva = new ArrayList<>();
        if (request.servicios != null && !request.servicios.isEmpty()) {
            for (ServicioRequest sr : request.servicios) {
                Servicio servicio = servicioRepository.findById(sr.servicioId).orElse(null);
                if (servicio == null) {
                    return ResponseEntity.badRequest()
                            .body("Servicio no encontrado: id=" + sr.servicioId);
                }
                ReservaServicio rs = new ReservaServicio();
                rs.setServicio(servicio);
                rs.setCantidad(sr.cantidad);
                serviciosReserva.add(rs);
            }
        }

        Reserva reserva = new Reserva();
        reserva.setUsuario(usuario);
        reserva.setHabitacion(disponibles.get(0));
        reserva.setFechaEntrada(request.fechaEntrada);
        reserva.setFechaSalida(request.fechaSalida);
        reserva.setPeticionEspecial(request.peticionEspecial);

        // Enlazar servicios con la reserva antes de guardar (CascadeType.ALL los persiste)
        if (!serviciosReserva.isEmpty()) {
            for (ReservaServicio rs : serviciosReserva) {
                rs.setReserva(reserva);
            }
            reserva.setServicios(serviciosReserva);
        }

        return ResponseEntity.ok(reservaRepository.save(reserva));
    }

    // POST /api/reservas/{id}/servicios → agregar servicio a reserva existente
    @PostMapping("/{id}/servicios")
    public ResponseEntity<?> agregarServicio(@PathVariable Long id,
                                             @RequestBody ServicioRequest request) {
        Reserva reserva = reservaRepository.findById(id).orElse(null);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }
        Servicio servicio = servicioRepository.findById(request.servicioId).orElse(null);
        if (servicio == null) {
            return ResponseEntity.notFound().build();
        }

        ReservaServicio rs = new ReservaServicio();
        rs.setReserva(reserva);
        rs.setServicio(servicio);
        rs.setCantidad(request.cantidad);
        reservaServicioRepository.save(rs);

        return ResponseEntity.ok(Map.of("mensaje", "Servicio agregado correctamente"));
    }

    // DELETE /api/reservas/{id}/servicios/{servicioId} → quitar servicio de reserva existente
    @DeleteMapping("/{id}/servicios/{servicioId}")
    public ResponseEntity<Void> quitarServicio(@PathVariable Long id,
                                               @PathVariable Long servicioId) {
        if (!reservaServicioRepository.existsByReservaIdAndServicioId(id, servicioId)) {
            return ResponseEntity.notFound().build();
        }
        reservaServicioRepository.deleteByReservaIdAndServicioId(id, servicioId);
        return ResponseEntity.noContent().build();
    }

    // PUT /api/reservas/{id} → modificar reserva (fechas y servicios básicos)
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> modificar(@PathVariable Long id, @RequestBody ReservaRequest request, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Reserva reserva = reservaRepository.findById(id).orElse(null);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.fechaEntrada != null && request.fechaSalida != null) {
            if (request.fechaEntrada.isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest().body("La reserva debe ser posterior a hoy");
            }
            if (!request.fechaEntrada.isBefore(request.fechaSalida)) {
                return ResponseEntity.badRequest().body("La fecha de entrada no puede ser posterior a la de salida");
            }
            long solapadas = reservaRepository.contarReservasSolapadasExcluyendo(
                    reserva.getHabitacion(), request.fechaEntrada, request.fechaSalida, id);
            
            if (solapadas > 0) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("La habitación no está disponible para las nuevas fechas");
            }
            reserva.setFechaEntrada(request.fechaEntrada);
            reserva.setFechaSalida(request.fechaSalida);
        }

        if (request.servicios != null) {
            reservaServicioRepository.deleteByReservaId(id);
            reserva.getServicios().clear();
            List<ReservaServicio> nuevosServicios = new ArrayList<>();
            
            for (ServicioRequest sr : request.servicios) {
                if (sr.cantidad > 0) {
                    Servicio servicio = servicioRepository.findById(sr.servicioId).orElse(null);
                    if (servicio != null) {
                        ReservaServicio rs = new ReservaServicio();
                        rs.setReserva(reserva);
                        rs.setServicio(servicio);
                        rs.setCantidad(sr.cantidad);
                        nuevosServicios.add(rs);
                    }
                }
            }
            reserva.getServicios().addAll(nuevosServicios);
        }
        return ResponseEntity.ok(reservaRepository.save(reserva));
    }

    // PATCH /api/reservas/{id}/peticion → actualizar petición especial (cliente o admin)
    @PatchMapping("/{id}/peticion")
    public ResponseEntity<?> actualizarPeticion(@PathVariable Long id,
                                                @RequestBody PeticionRequest request,
                                                Authentication authentication) {
        Reserva reserva = reservaRepository.findById(id).orElse(null);
        if (reserva == null) return ResponseEntity.notFound().build();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !reserva.getUsuario().getEmail().equals(getEmail(authentication))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        reserva.setPeticionEspecial(request.peticionEspecial);
        reservaRepository.save(reserva);
        return ResponseEntity.ok(Map.of("mensaje", "Petición actualizada"));
    }

    // DELETE /api/reservas/{id} → cancelar reserva (admin: cualquiera; cliente: solo la suya)
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> cancelar(@PathVariable Long id, Authentication authentication) {
        Reserva reserva = reservaRepository.findById(id).orElse(null);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !reserva.getUsuario().getEmail().equals(getEmail(authentication))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        pedidoRoomServiceRepository.deleteByReservaId(id);
        reservaServicioRepository.deleteByReservaId(id);
        reservaRepository.delete(reserva);
        return ResponseEntity.noContent().build();
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    static class ServicioDTO {
        public String nombre;
        public BigDecimal precio;
        public Integer cantidad;

        ServicioDTO(String nombre, BigDecimal precio, Integer cantidad) {
            this.nombre = nombre;
            this.precio = precio;
            this.cantidad = cantidad;
        }
    }

    static class PedidoRSDTO {
        public String nombre;
        public Integer cantidad;
        public BigDecimal subtotal;

        PedidoRSDTO(String nombre, Integer cantidad, BigDecimal subtotal) {
            this.nombre   = nombre;
            this.cantidad = cantidad;
            this.subtotal = subtotal;
        }
    }

    static class ReservaDTO {
        public Long id;
        public LocalDate fechaEntrada;
        public LocalDate fechaSalida;
        public String habitacionTipo;
        public String habitacionNumero;
        public BigDecimal precioNoche;
        public List<ServicioDTO> servicios;
        public BigDecimal total;
        public BigDecimal subtotalRoomService;
        public List<PedidoRSDTO> pedidosRoomService;
        public String clienteNombre;
        public String clienteEmail;
        public String peticionEspecial;

        // Constructor para mis-reservas (sin datos de cliente)
        ReservaDTO(Long id, LocalDate fechaEntrada, LocalDate fechaSalida,
                   String habitacionTipo, String habitacionNumero, BigDecimal precioNoche,
                   List<ServicioDTO> servicios, BigDecimal total, BigDecimal subtotalRoomService,
                   List<PedidoRSDTO> pedidosRoomService, String peticionEspecial) {
            this.id = id;
            this.fechaEntrada = fechaEntrada;
            this.fechaSalida = fechaSalida;
            this.habitacionTipo = habitacionTipo;
            this.habitacionNumero = habitacionNumero;
            this.precioNoche = precioNoche;
            this.servicios = servicios;
            this.total = total;
            this.subtotalRoomService = subtotalRoomService;
            this.pedidosRoomService = pedidosRoomService;
            this.peticionEspecial = peticionEspecial;
        }

        // Constructor para admin (con datos de cliente)
        ReservaDTO(Long id, LocalDate fechaEntrada, LocalDate fechaSalida,
                   String habitacionTipo, String habitacionNumero, BigDecimal precioNoche,
                   List<ServicioDTO> servicios, BigDecimal total, BigDecimal subtotalRoomService,
                   List<PedidoRSDTO> pedidosRoomService,
                   String clienteNombre, String clienteEmail, String peticionEspecial) {
            this(id, fechaEntrada, fechaSalida, habitacionTipo, habitacionNumero, precioNoche,
                 servicios, total, subtotalRoomService, pedidosRoomService, peticionEspecial);
            this.clienteNombre = clienteNombre;
            this.clienteEmail = clienteEmail;
        }
    }

    // ── Request bodies ────────────────────────────────────────────────────────

    static class ReservaRequest {
        public Long habitacionId;
        public LocalDate fechaEntrada;
        public LocalDate fechaSalida;
        public List<ServicioRequest> servicios;
        public String peticionEspecial;
    }

    static class ServicioRequest {
        public Long servicioId;
        public Integer cantidad;
    }

    static class ReservaPorTipoRequest {
        public String tipo;
        public LocalDate fechaEntrada;
        public LocalDate fechaSalida;
        public List<ServicioRequest> servicios;
        public String peticionEspecial;
    }

    static class PeticionRequest {
        public String peticionEspecial;
    }
}
