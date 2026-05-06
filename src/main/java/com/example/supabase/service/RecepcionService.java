package com.example.supabase.service;

import com.example.supabase.domain.*;
import com.example.supabase.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecepcionService {

    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final HabitacionRepository habitacionRepository;
    private final NotaReservaRepository notaReservaRepository;
    private final PagoRepository pagoRepository;
    private final RoleRepository roleRepository;
    private final PedidoRoomServiceRepository pedidoRoomServiceRepository;

    public RecepcionService(ReservaRepository reservaRepository,
                            UsuarioRepository usuarioRepository,
                            HabitacionRepository habitacionRepository,
                            NotaReservaRepository notaReservaRepository,
                            PagoRepository pagoRepository,
                            RoleRepository roleRepository,
                            PedidoRoomServiceRepository pedidoRoomServiceRepository) {
        this.reservaRepository      = reservaRepository;
        this.usuarioRepository      = usuarioRepository;
        this.habitacionRepository   = habitacionRepository;
        this.notaReservaRepository  = notaReservaRepository;
        this.pagoRepository         = pagoRepository;
        this.roleRepository         = roleRepository;
        this.pedidoRoomServiceRepository = pedidoRoomServiceRepository;
    }

    // ── Listados del panel ────────────────────────────────────────────────────

    public List<Map<String, Object>> llegadasHoy() {
        LocalDate hoy = LocalDate.now();
        return reservaRepository.findByFechaEntrada(hoy).stream()
                .sorted(Comparator.comparing(Reserva::getId))
                .map(this::toRow)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> enEstancia() {
        LocalDate hoy = LocalDate.now();
        return reservaRepository.findAll().stream()
                .filter(r -> !r.getFechaEntrada().isAfter(hoy) && r.getFechaSalida().isAfter(hoy)
                          && r.getCheckoutEn() == null)
                .sorted(Comparator.comparing(r -> r.getHabitacion().getNumero()))
                .map(this::toRow)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> salidasHoy() {
        LocalDate hoy = LocalDate.now();
        return reservaRepository.findAll().stream()
                .filter(r -> r.getFechaSalida().equals(hoy) && r.getCheckoutEn() == null)
                .sorted(Comparator.comparing(r -> r.getHabitacion().getNumero()))
                .map(this::toRow)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> buscar(String q) {
        if (q == null || q.isBlank()) return List.of();
        String needle = q.toLowerCase().trim();
        return reservaRepository.findAll().stream()
                .filter(r -> matches(r, needle))
                .sorted(Comparator.comparing(Reserva::getFechaEntrada).reversed())
                .limit(50)
                .map(this::toRow)
                .collect(Collectors.toList());
    }

    private boolean matches(Reserva r, String needle) {
        try {
            if (String.valueOf(r.getId()).contains(needle)) return true;
            if (r.getHabitacion() != null && r.getHabitacion().getNumero() != null
                    && r.getHabitacion().getNumero().toLowerCase().contains(needle)) return true;
            if (r.getUsuario() != null) {
                if (r.getUsuario().getEmail() != null
                        && r.getUsuario().getEmail().toLowerCase().contains(needle)) return true;
                if (r.getUsuario().getNombre() != null
                        && r.getUsuario().getNombre().toLowerCase().contains(needle)) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    public Map<String, Object> detalle(Long reservaId) {
        Reserva r = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        Map<String, Object> m = toRow(r);
        m.put("peticionEspecial", r.getPeticionEspecial());
        m.put("notas", listarNotas(reservaId));
        m.put("pagos", pagoRepository.findByReservaIdOrderByCreatedAtDesc(reservaId).stream()
                .map(p -> {
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("id", p.getId());
                    pm.put("referencia", p.getReferencia());
                    pm.put("estado", p.getEstado() != null ? p.getEstado().name() : null);
                    pm.put("total", p.getTotal());
                    pm.put("metodoTipo", p.getMetodoTipo());
                    pm.put("completedAt", p.getCompletedAt());
                    return pm;
                }).collect(Collectors.toList()));
        return m;
    }

    // ── Notas ─────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listarNotas(Long reservaId) {
        return notaReservaRepository.findByReservaIdOrderByCreadoEnDesc(reservaId).stream()
                .map(n -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", n.getId());
                    m.put("texto", n.getTexto());
                    m.put("autorEmail", n.getAutorEmail());
                    m.put("creadoEn", n.getCreadoEn());
                    return m;
                })
                .collect(Collectors.toList());
    }

    public NotaReserva crearNota(Long reservaId, String texto, Usuario autor) {
        if (texto == null || texto.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nota no puede estar vacía.");
        if (!reservaRepository.existsById(reservaId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada");

        NotaReserva n = new NotaReserva();
        n.setReservaId(reservaId);
        n.setAutorId(autor.getId());
        n.setAutorEmail(autor.getEmail());
        n.setTexto(texto.trim());
        return notaReservaRepository.save(n);
    }

    public void eliminarNota(Long notaId) {
        notaReservaRepository.deleteById(notaId);
    }

    // ── Calendario ────────────────────────────────────────────────────────────

    /**
     * Devuelve un mapa fecha → conteo de reservas que cubren ese día.
     * Una reserva con fechaEntrada=1 y fechaSalida=4 cuenta para los días 1, 2 y 3 (salida exclusiva).
     */
    public Map<String, Integer> calendarioRango(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null || hasta.isBefore(desde))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango inválido.");

        List<Reserva> reservas = reservaRepository.findSolapanRango(desde, hasta);

        Map<String, Integer> conteo = new LinkedHashMap<>();
        LocalDate cursor = desde;
        while (!cursor.isAfter(hasta)) {
            conteo.put(cursor.toString(), 0);
            cursor = cursor.plusDays(1);
        }
        for (Reserva r : reservas) {
            LocalDate ini = r.getFechaEntrada().isBefore(desde) ? desde : r.getFechaEntrada();
            LocalDate fin = r.getFechaSalida().isAfter(hasta.plusDays(1)) ? hasta.plusDays(1) : r.getFechaSalida();
            LocalDate d = ini;
            while (d.isBefore(fin)) {
                conteo.merge(d.toString(), 1, (x, y) -> x + y);
                d = d.plusDays(1);
            }
        }
        return conteo;
    }

    /**
     * Lista todas las reservas que cubren un día concreto, con datos para mostrar en el modal.
     */
    public List<Map<String, Object>> calendarioDia(LocalDate dia) {
        if (dia == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fecha requerida.");

        List<Reserva> reservas = reservaRepository.findSolapanRango(dia, dia.plusDays(1));
        return reservas.stream()
                .sorted(Comparator.comparing((Reserva r) -> r.getHabitacion().getNumero()))
                .map(r -> {
                    Map<String, Object> m = toRow(r);
                    String estado;
                    if (r.getFechaEntrada().equals(dia))      estado = "ENTRA";
                    else if (r.getFechaSalida().equals(dia))  estado = "SALE";
                    else                                       estado = "EN_CURSO";
                    m.put("estadoDia", estado);
                    enriquecerConExtras(m, r);
                    return m;
                })
                .collect(Collectors.toList());
    }

    private void enriquecerConExtras(Map<String, Object> m, Reserva r) {
        // Servicios extra (spa, etc.)
        List<Map<String, Object>> servicios = new ArrayList<>();
        if (r.getServicios() != null) {
            for (ReservaServicio rs : r.getServicios()) {
                if (rs.getServicio() == null) continue;
                Map<String, Object> sm = new LinkedHashMap<>();
                sm.put("nombre",   rs.getServicio().getNombre());
                sm.put("cantidad", rs.getCantidad());
                sm.put("precio",   rs.getServicio().getPrecio());
                servicios.add(sm);
            }
        }
        m.put("servicios", servicios);

        // Pedidos room service
        List<Map<String, Object>> pedidos = new ArrayList<>();
        try {
            var lista = pedidoRoomServiceRepository.findByReservaId(r.getId());
            if (lista != null) {
                for (var p : lista) {
                    if (p.getItem() == null) continue;
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("nombre",   p.getItem().getNombre());
                    pm.put("cantidad", p.getCantidad());
                    pm.put("precio",   p.getItem().getPrecio());
                    pedidos.add(pm);
                }
            }
        } catch (Exception ignored) {}
        m.put("pedidosRoomService", pedidos);
    }

    public List<Map<String, Object>> peticiones() {
        return reservaRepository.findConPeticionEspecial().stream()
                .map(this::toRow)
                .collect(Collectors.toList());
    }

    // ── Walk-in ───────────────────────────────────────────────────────────────

    @Transactional
    public Reserva crearWalkIn(String emailCliente,
                               String nombreCliente,
                               LocalDate fechaEntrada,
                               LocalDate fechaSalida,
                               String tipoHabitacion,
                               Long habitacionId,
                               String peticionEspecial,
                               Usuario autor) {
        if (fechaEntrada == null || fechaSalida == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fechas requeridas.");
        if (fechaEntrada.isBefore(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede crear walk-in para fechas pasadas.");
        if (!fechaSalida.isAfter(fechaEntrada))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de salida debe ser posterior a la de entrada.");
        if (emailCliente == null || emailCliente.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email del cliente requerido.");

        Usuario cliente = usuarioRepository.findByEmail(emailCliente.trim().toLowerCase())
                .orElseGet(() -> {
                    Usuario u = new Usuario();
                    u.setEmail(emailCliente.trim().toLowerCase());
                    u.setNombre(nombreCliente != null && !nombreCliente.isBlank() ? nombreCliente.trim() : null);
                    Set<Rol> roles = new HashSet<>();
                    roleRepository.findByName("ROLE_CLIENTE").ifPresent(roles::add);
                    u.setRoles(roles);
                    return usuarioRepository.save(u);
                });

        if (nombreCliente != null && !nombreCliente.isBlank() && cliente.getNombre() == null) {
            cliente.setNombre(nombreCliente.trim());
            usuarioRepository.save(cliente);
        }

        Habitacion habitacion;
        if (habitacionId != null) {
            habitacion = habitacionRepository.findById(habitacionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Habitación no encontrada"));
            long solapadas = reservaRepository.contarReservasSolapadas(habitacion, fechaEntrada, fechaSalida);
            if (solapadas > 0)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Esa habitación no está disponible en esas fechas.");
        } else {
            if (tipoHabitacion == null || tipoHabitacion.isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipoHabitacion o habitacionId requerido.");
            Habitacion.TipoHabitacion tipo;
            try {
                tipo = Habitacion.TipoHabitacion.valueOf(tipoHabitacion.toUpperCase());
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de habitación inválido.");
            }
            habitacion = habitacionRepository.findByTipo(tipo).stream()
                    .filter(h -> reservaRepository.contarReservasSolapadas(h, fechaEntrada, fechaSalida) == 0)
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                            "No hay habitaciones de tipo " + tipo + " disponibles en esas fechas."));
        }

        Reserva r = new Reserva();
        r.setUsuario(cliente);
        r.setHabitacion(habitacion);
        r.setFechaEntrada(fechaEntrada);
        r.setFechaSalida(fechaSalida);
        r.setPeticionEspecial(peticionEspecial);
        Reserva guardada = reservaRepository.save(r);

        try {
            NotaReserva n = new NotaReserva();
            n.setReservaId(guardada.getId());
            n.setAutorId(autor.getId());
            n.setAutorEmail(autor.getEmail());
            n.setTexto("Reserva creada walk-in en recepción.");
            notaReservaRepository.save(n);
        } catch (Exception ignored) {}

        return guardada;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toRow(Reserva r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("fechaEntrada", r.getFechaEntrada());
        m.put("fechaSalida", r.getFechaSalida());
        if (r.getHabitacion() != null) {
            m.put("habitacionId", r.getHabitacion().getId());
            m.put("habitacionNumero", r.getHabitacion().getNumero());
            m.put("habitacionTipo", r.getHabitacion().getTipo() != null ? r.getHabitacion().getTipo().name() : null);
            m.put("precioNoche", r.getHabitacion().getPrecioNoche());
        }
        if (r.getUsuario() != null) {
            m.put("clienteEmail", r.getUsuario().getEmail());
            m.put("clienteNombre", r.getUsuario().getNombre());
        }
        m.put("peticionEspecial", r.getPeticionEspecial());
        m.put("checkoutEn", r.getCheckoutEn());

        var ultimoPago = pagoRepository.findTopByReservaIdAndEstadoOrderByCreatedAtDesc(r.getId(), EstadoPago.COMPLETADO);
        m.put("pagada", ultimoPago.isPresent());
        ultimoPago.ifPresent(p -> {
            m.put("pagoTotal", p.getTotal());
            m.put("pagoReferencia", p.getReferencia());
        });
        return m;
    }
}
