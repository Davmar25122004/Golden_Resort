package com.example.supabase.service;

import com.example.supabase.domain.*;
import com.example.supabase.domain.Habitacion.TipoHabitacion;
import com.example.supabase.dto.*;
import com.example.supabase.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReservaService {

    private static final String SERVICIO_COCHE = "Servicio de Coche Privado";

    /** Precio fijo por ubicación para el servicio de coche */
    private static BigDecimal precioCochePorUbicacion(String ubicacion) {
        if (ubicacion == null) return BigDecimal.ZERO;
        return switch (ubicacion) {
            case "AEROPUERTO_VALENCIA"   -> new BigDecimal("120.00");
            case "RENFE_JOAQUIN_SOROLLA" -> new BigDecimal("80.00");
            case "RENFE_CULLERA"         -> new BigDecimal("40.00");
            default -> BigDecimal.ZERO;
        };
    }

    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;
    private final ReservaServicioRepository reservaServicioRepository;
    private final PedidoRoomServiceRepository pedidoRoomServiceRepository;
    private final PagoRepository pagoRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          HabitacionRepository habitacionRepository,
                          UsuarioRepository usuarioRepository,
                          ServicioRepository servicioRepository,
                          ReservaServicioRepository reservaServicioRepository,
                          PedidoRoomServiceRepository pedidoRoomServiceRepository,
                          PagoRepository pagoRepository) {
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicioRepository = servicioRepository;
        this.reservaServicioRepository = reservaServicioRepository;
        this.pedidoRoomServiceRepository = pedidoRoomServiceRepository;
        this.pagoRepository = pagoRepository;
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    public List<ReservaDTO> listarTodas() {
        return reservaRepository.findAll().stream()
                .map(r -> toDTO(r, true))
                .collect(Collectors.toList());
    }

    public List<ReservaDTO> misReservas(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        return reservaRepository.findByUsuario(usuario).stream()
                .map(r -> toDTO(r, false))
                .collect(Collectors.toList());
    }

    /** Solo reservas con pago COMPLETADO — para "Mis Reservas" */
    public List<ReservaDTO> misReservasPagadas(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        Set<Long> pagadas = pagoRepository.findByUsuarioIdOrderByCreatedAtDesc(usuario.getId()).stream()
                .filter(p -> p.getEstado() == EstadoPago.COMPLETADO)
                .map(p -> p.getReservaId())
                .collect(Collectors.toSet());
        return reservaRepository.findByUsuario(usuario).stream()
                .filter(r -> pagadas.contains(r.getId()))
                .map(r -> toDTO(r, false))
                .collect(Collectors.toList());
    }

    /** Reservas SIN pago confirmado — para "Habitaciones Guardadas" */
    public List<ReservaDTO> misReservasGuardadas(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        Set<Long> pagadas = pagoRepository.findByUsuarioIdOrderByCreatedAtDesc(usuario.getId()).stream()
                .filter(p -> p.getEstado() == EstadoPago.COMPLETADO)
                .map(p -> p.getReservaId())
                .collect(Collectors.toSet());
        return reservaRepository.findByUsuario(usuario).stream()
                .filter(r -> !pagadas.contains(r.getId()))
                .map(r -> toDTO(r, false))
                .collect(Collectors.toList());
    }

    public List<Reserva> porUsuario(Long usuarioId, String email, boolean isAdmin) {
        if (!isAdmin) {
            Usuario solicitante = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
            if (!solicitante.getId().equals(usuarioId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return reservaRepository.findByUsuario(usuario);
    }

    // ── Creación ──────────────────────────────────────────────────────────────

    public Reserva crear(ReservaRequest request, String email) {
        if (request.fechaEntrada == null || request.fechaSalida == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas son obligatorias");
        if (request.fechaEntrada.isBefore(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de entrada no puede ser anterior a hoy");
        if (!request.fechaEntrada.isBefore(request.fechaSalida))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de entrada debe ser anterior a la de salida");
        if (request.habitacionId == null || request.habitacionId <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Habitación inválida");

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        Habitacion habitacion = habitacionRepository.findById(request.habitacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Habitación no encontrada"));

        long solapadas = reservaRepository.contarReservasSolapadas(
                habitacion, request.fechaEntrada, request.fechaSalida);
        if (solapadas > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La habitación no está disponible en esas fechas");
        }

        Reserva reserva = new Reserva();
        reserva.setUsuario(usuario);
        reserva.setHabitacion(habitacion);
        reserva.setFechaEntrada(request.fechaEntrada);
        reserva.setFechaSalida(request.fechaSalida);
        reserva.setPeticionEspecial(request.peticionEspecial);
        return reservaRepository.save(reserva);
    }

    public Reserva crearPorTipo(ReservaPorTipoRequest request, String email) {
        if (request.fechaEntrada == null || request.fechaSalida == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas son obligatorias");
        }
        if (request.fechaEntrada.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La reserva debe ser posterior a hoy");
        }
        if (!request.fechaEntrada.isBefore(request.fechaSalida)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de entrada no puede ser posterior a la de salida");
        }

        TipoHabitacion tipo;
        try {
            tipo = TipoHabitacion.valueOf(request.tipo);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de habitación inválido");
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        List<Habitacion> disponibles = habitacionRepository.findAvailableByTipo(
                tipo, request.fechaEntrada, request.fechaSalida, PageRequest.of(0, 1));
        if (disponibles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sin disponibilidad para ese tipo de habitación en las fechas indicadas");
        }

        List<ReservaServicio> serviciosReserva = new ArrayList<>();
        if (request.servicios != null && !request.servicios.isEmpty()) {
            for (ServicioRequest sr : request.servicios) {
                if (sr.servicioId == null || sr.servicioId <= 0)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID de servicio inválido");
                if (sr.cantidad == null || sr.cantidad <= 0)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor que cero");
                Servicio servicio = servicioRepository.findById(sr.servicioId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Servicio no encontrado: id=" + sr.servicioId));
                ReservaServicio rs = new ReservaServicio();
                rs.setServicio(servicio);
                rs.setCantidad(sr.cantidad);
                rs.setHora(parseHora(sr.hora));
                if (SERVICIO_COCHE.equals(servicio.getNombre()) && sr.ubicacion != null) {
                    rs.setUbicacion(sr.ubicacion);
                    rs.setPrecioServicio(precioCochePorUbicacion(sr.ubicacion));
                }
                serviciosReserva.add(rs);
            }
        }

        Reserva reserva = new Reserva();
        reserva.setUsuario(usuario);
        reserva.setHabitacion(disponibles.get(0));
        reserva.setFechaEntrada(request.fechaEntrada);
        reserva.setFechaSalida(request.fechaSalida);
        reserva.setPeticionEspecial(request.peticionEspecial);

        if (!serviciosReserva.isEmpty()) {
            for (ReservaServicio rs : serviciosReserva) {
                rs.setReserva(reserva);
            }
            reserva.setServicios(serviciosReserva);
        }

        return reservaRepository.save(reserva);
    }

    // ── Servicios en reserva ──────────────────────────────────────────────────

    public void agregarServicio(Long reservaId, ServicioRequest request, String email, boolean isAdmin) {
        if (request.servicioId == null || request.servicioId <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Servicio inválido");
        if (request.cantidad == null || request.cantidad <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor que cero");

        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!isAdmin && !reserva.getUsuario().getEmail().equals(email))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para modificar esta reserva");
        Servicio servicio = servicioRepository.findById(request.servicioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        ReservaServicio rs = new ReservaServicio();
        rs.setReserva(reserva);
        rs.setServicio(servicio);
        rs.setCantidad(request.cantidad);
        rs.setHora(parseHora(request.hora));
        if (SERVICIO_COCHE.equals(servicio.getNombre()) && request.ubicacion != null) {
            rs.setUbicacion(request.ubicacion);
            rs.setPrecioServicio(precioCochePorUbicacion(request.ubicacion));
        }
        reservaServicioRepository.save(rs);
    }

    public void quitarServicio(Long reservaId, Long servicioId, String email, boolean isAdmin) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!isAdmin && !reserva.getUsuario().getEmail().equals(email))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para modificar esta reserva");
        if (!reservaServicioRepository.existsByReservaIdAndServicioId(reservaId, servicioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        reservaServicioRepository.deleteByReservaIdAndServicioId(reservaId, servicioId);
    }

    // ── Modificación ──────────────────────────────────────────────────────────

    @Transactional
    public Reserva modificar(Long id, ReservaRequest request) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (request.fechaEntrada != null && request.fechaSalida != null) {
            if (!request.fechaEntrada.isBefore(request.fechaSalida)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "La fecha de entrada no puede ser posterior a la de salida");
            }
            long solapadas = reservaRepository.contarReservasSolapadasExcluyendo(
                    reserva.getHabitacion(), request.fechaEntrada, request.fechaSalida, id);
            if (solapadas > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "La habitación no está disponible para las nuevas fechas");
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
                    servicioRepository.findById(sr.servicioId).ifPresent(servicio -> {
                        ReservaServicio rs = new ReservaServicio();
                        rs.setReserva(reserva);
                        rs.setServicio(servicio);
                        rs.setCantidad(sr.cantidad);
                        rs.setHora(parseHora(sr.hora));
                        if (SERVICIO_COCHE.equals(servicio.getNombre()) && sr.ubicacion != null) {
                            rs.setUbicacion(sr.ubicacion);
                            rs.setPrecioServicio(precioCochePorUbicacion(sr.ubicacion));
                        }
                        nuevosServicios.add(rs);
                    });
                }
            }
            reserva.getServicios().addAll(nuevosServicios);
        }

        return reservaRepository.save(reserva);
    }

    public void actualizarFechas(Long id, String fechaEntradaStr, String fechaSalidaStr, String email, boolean isAdmin) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!isAdmin && !reserva.getUsuario().getEmail().equals(email))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        LocalDate entrada = LocalDate.parse(fechaEntradaStr);
        LocalDate salida  = LocalDate.parse(fechaSalidaStr);
        if (!entrada.isBefore(salida))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de entrada debe ser anterior a la de salida");
        reserva.setFechaEntrada(entrada);
        reserva.setFechaSalida(salida);
        reservaRepository.save(reserva);
    }

    public void actualizarPeticion(Long id, String peticion, String email, boolean isAdmin) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!isAdmin && !reserva.getUsuario().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        reserva.setPeticionEspecial(peticion);
        reservaRepository.save(reserva);
    }

    @Transactional
    public void cancelar(Long id, String email, boolean isAdmin) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!isAdmin && !reserva.getUsuario().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        pedidoRoomServiceRepository.deleteByReservaId(id);
        reservaServicioRepository.deleteByReservaId(id);
        reservaRepository.delete(reserva);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static LocalTime parseHora(String hora) {
        if (hora == null || hora.isBlank()) return null;
        try {
            String h = hora.trim();
            if (h.length() == 5) h = h + ":00"; // HH:mm → HH:mm:ss
            return LocalTime.parse(h);
        } catch (Exception e) {
            return null;
        }
    }

    public ReservaDTO toDTO(Reserva r, boolean includeCliente) {
        long dias = ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());

        List<ServicioDTO> serviciosDTOs = new ArrayList<>();
        BigDecimal totalServicios = BigDecimal.ZERO;
        if (r.getServicios() != null) {
            for (ReservaServicio rs : r.getServicios()) {
                // Usar precioServicio si existe (ej. coche con ubicación), si no el precio base
                BigDecimal precioEfectivo = rs.getPrecioServicio() != null
                        ? rs.getPrecioServicio()
                        : rs.getServicio().getPrecio();
                BigDecimal subtotal = precioEfectivo.multiply(BigDecimal.valueOf(rs.getCantidad()));
                totalServicios = totalServicios.add(subtotal);
                serviciosDTOs.add(new ServicioDTO(
                        rs.getServicio().getNombre(),
                        precioEfectivo,
                        rs.getCantidad(),
                        rs.getUbicacion()
                ));
            }
        }

        BigDecimal subtotalRoomService = pedidoRoomServiceRepository.findByReservaId(r.getId())
                .stream()
                .map(p -> p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = r.getHabitacion().getPrecioNoche()
                .multiply(BigDecimal.valueOf(dias))
                .add(totalServicios)
                .add(subtotalRoomService);

        List<PedidoRSDTO> pedidosRS = pedidoRoomServiceRepository.findByReservaId(r.getId())
                .stream()
                .map(p -> new PedidoRSDTO(
                        p.getItem().getNombre(),
                        p.getCantidad(),
                        p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad()))
                ))
                .collect(Collectors.toList());

        ReservaDTO dto;
        if (includeCliente) {
            dto = new ReservaDTO(
                    r.getId(), r.getFechaEntrada(), r.getFechaSalida(),
                    r.getHabitacion().getTipo().name(), r.getHabitacion().getNumero(),
                    r.getHabitacion().getPrecioNoche(), serviciosDTOs, total, subtotalRoomService,
                    pedidosRS,
                    r.getUsuario().getNombre() != null ? r.getUsuario().getNombre() : r.getUsuario().getEmail(),
                    r.getUsuario().getEmail(),
                    r.getPeticionEspecial()
            );
        } else {
            dto = new ReservaDTO(
                    r.getId(), r.getFechaEntrada(), r.getFechaSalida(),
                    r.getHabitacion().getTipo().name(), r.getHabitacion().getNumero(),
                    r.getHabitacion().getPrecioNoche(), serviciosDTOs, total, subtotalRoomService,
                    pedidosRS,
                    r.getPeticionEspecial()
            );
        }
        dto.checkoutEn = r.getCheckoutEn();
        return dto;
    }

    /** Usado por AdminService para calcular ingresos del mes */
    public BigDecimal calcularTotal(Reserva r) {
        long dias = ChronoUnit.DAYS.between(r.getFechaEntrada(), r.getFechaSalida());
        BigDecimal hab = r.getHabitacion().getPrecioNoche().multiply(BigDecimal.valueOf(dias));
        BigDecimal servicios = BigDecimal.ZERO;
        if (r.getServicios() != null) {
            for (ReservaServicio rs : r.getServicios()) {
                BigDecimal precioEfectivo = rs.getPrecioServicio() != null
                        ? rs.getPrecioServicio() : rs.getServicio().getPrecio();
                servicios = servicios.add(precioEfectivo.multiply(BigDecimal.valueOf(rs.getCantidad())));
            }
        }
        BigDecimal subtotalRS = pedidoRoomServiceRepository.findByReservaId(r.getId())
                .stream()
                .map(p -> p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return hab.add(servicios).add(subtotalRS);
    }
}
