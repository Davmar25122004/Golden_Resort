package com.example.supabase.service;

import com.example.supabase.domain.*;
import com.example.supabase.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class MensajeriaService {

    private static final int RATE_MAX = 20;
    private static final long RATE_WINDOW_MS = 10_000L;
    private static final int TEXTO_MAX = 2000;
    private static final int TOP_PASADAS = 5;

    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReservaRepository reservaRepository;
    private final PagoRepository pagoRepository;
    private final MetodoPagoRepository metodoPagoRepository;

    private final Map<Long, Deque<Long>> rateBucket = new ConcurrentHashMap<>();

    public MensajeriaService(ConversacionRepository conversacionRepository,
                             MensajeRepository mensajeRepository,
                             UsuarioRepository usuarioRepository,
                             ReservaRepository reservaRepository,
                             PagoRepository pagoRepository,
                             MetodoPagoRepository metodoPagoRepository) {
        this.conversacionRepository = conversacionRepository;
        this.mensajeRepository = mensajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.reservaRepository = reservaRepository;
        this.pagoRepository = pagoRepository;
        this.metodoPagoRepository = metodoPagoRepository;
    }

    // ── Auto-creación ─────────────────────────────────────────────────────────

    @Transactional
    public Conversacion obtenerOCrearConversacion(Usuario cliente) {
        if (cliente == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado.");
        return conversacionRepository.findByClienteId(cliente.getId())
                .orElseGet(() -> {
                    Conversacion c = new Conversacion();
                    c.setClienteId(cliente.getId());
                    return conversacionRepository.save(c);
                });
    }

    // ── Cliente ───────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> miConversacion(Usuario cliente) {
        Conversacion c = obtenerOCrearConversacion(cliente);
        if (c.getNoLeidosCliente() != null && c.getNoLeidosCliente() > 0) {
            c.setNoLeidosCliente(0);
            conversacionRepository.save(c);
        }
        // Marca los mensajes de RECEPCION como leídos por el cliente
        mensajeRepository.marcarComoLeidos(c.getId(), "RECEPCION", LocalDateTime.now());
        return serializarConversacion(c, mensajeRepository.findByConversacionIdOrderByCreadoEnAsc(c.getId()));
    }

    @Transactional
    public void marcarLeidoCliente(Usuario cliente) {
        Conversacion c = obtenerOCrearConversacion(cliente);
        if (c.getNoLeidosCliente() != null && c.getNoLeidosCliente() > 0) {
            c.setNoLeidosCliente(0);
            conversacionRepository.save(c);
        }
    }

    @Transactional
    public Mensaje enviarMensajeCliente(Usuario cliente, String texto) {
        validarTexto(texto);
        permitirOLanzar(cliente.getId());
        Conversacion c = obtenerOCrearConversacion(cliente);
        Mensaje m = nuevoMensaje(c.getId(), cliente.getId(), "CLIENTE", texto);
        mensajeRepository.save(m);
        c.setNoLeidosRecepcion((c.getNoLeidosRecepcion() == null ? 0 : c.getNoLeidosRecepcion()) + 1);
        c.setUltimaActividad(LocalDateTime.now());
        if (c.getEstado() == Conversacion.Estado.RESUELTA) c.setEstado(Conversacion.Estado.ABIERTA);
        conversacionRepository.save(c);
        return m;
    }

    // ── Recepción ─────────────────────────────────────────────────────────────

    public List<Map<String, Object>> inboxRecepcion() {
        return conversacionRepository.findAllByOrderByUltimaActividadDesc().stream()
                .map(this::serializarItemInbox)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> conversacionParaRecepcion(Long conversacionId) {
        Conversacion c = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada"));
        if (c.getNoLeidosRecepcion() != null && c.getNoLeidosRecepcion() > 0) {
            c.setNoLeidosRecepcion(0);
            conversacionRepository.save(c);
        }
        // Marca los mensajes del CLIENTE como leídos por la recepción
        mensajeRepository.marcarComoLeidos(c.getId(), "CLIENTE", LocalDateTime.now());
        return serializarConversacion(c, mensajeRepository.findByConversacionIdOrderByCreadoEnAsc(c.getId()));
    }

    // ── Estado y eliminación ──────────────────────────────────────────────────

    @Transactional
    public Conversacion cambiarEstado(Long conversacionId, String nuevoEstado) {
        if (nuevoEstado == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado requerido.");
        Conversacion.Estado e;
        try { e = Conversacion.Estado.valueOf(nuevoEstado.trim().toUpperCase()); }
        catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido.");
        }
        Conversacion c = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada"));
        c.setEstado(e);
        return conversacionRepository.save(c);
    }

    @Transactional
    public void eliminarConversacion(Long conversacionId) {
        if (!conversacionRepository.existsById(conversacionId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada");
        mensajeRepository.deleteByConversacionId(conversacionId);
        conversacionRepository.deleteById(conversacionId);
    }

    // ── Adjuntos ──────────────────────────────────────────────────────────────

    @Transactional
    public Mensaje enviarMensajeRecepcionConAdjunto(Usuario staff, Long conversacionId,
                                                    String texto, String adjuntoUrl, String adjuntoNombre) {
        boolean tieneTexto = texto != null && !texto.trim().isEmpty();
        boolean tieneAdjunto = adjuntoUrl != null && !adjuntoUrl.isBlank();
        if (!tieneTexto && !tieneAdjunto)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje debe llevar texto o adjunto.");
        if (tieneTexto && texto.length() > TEXTO_MAX)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje supera los " + TEXTO_MAX + " caracteres.");
        permitirOLanzar(staff.getId());

        Conversacion c = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada"));

        Mensaje m = new Mensaje();
        m.setConversacionId(c.getId());
        m.setAutorId(staff.getId());
        m.setAutorRol("RECEPCION");
        if (tieneTexto) m.setTexto(texto.trim());
        if (tieneAdjunto) {
            m.setAdjuntoUrl(adjuntoUrl);
            m.setAdjuntoNombre(adjuntoNombre);
        }
        mensajeRepository.save(m);

        c.setNoLeidosCliente((c.getNoLeidosCliente() == null ? 0 : c.getNoLeidosCliente()) + 1);
        c.setUltimaActividad(LocalDateTime.now());
        if (c.getEstado() == Conversacion.Estado.RESUELTA) c.setEstado(Conversacion.Estado.ABIERTA);
        conversacionRepository.save(c);
        return m;
    }

    @Transactional
    public Mensaje enviarMensajeRecepcion(Usuario staff, Long conversacionId, String texto) {
        validarTexto(texto);
        permitirOLanzar(staff.getId());
        Conversacion c = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada"));
        Mensaje m = nuevoMensaje(c.getId(), staff.getId(), "RECEPCION", texto);
        mensajeRepository.save(m);
        c.setNoLeidosCliente((c.getNoLeidosCliente() == null ? 0 : c.getNoLeidosCliente()) + 1);
        c.setUltimaActividad(LocalDateTime.now());
        conversacionRepository.save(c);
        return m;
    }

    public long noLeidosTotalRecepcion() {
        return conversacionRepository.sumarNoLeidosRecepcion();
    }

    // ── Cliente 360 ───────────────────────────────────────────────────────────

    public Map<String, Object> fichaCliente(Long clienteId) {
        Usuario u = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

        LocalDate hoy = LocalDate.now();
        var reservas = reservaRepository.findByUsuario(u);

        List<Map<String, Object>> activas = reservas.stream()
                .filter(r -> !r.getFechaEntrada().isAfter(hoy) && r.getFechaSalida().isAfter(hoy))
                .map(this::resumirReserva)
                .collect(Collectors.toList());

        List<Map<String, Object>> proximas = reservas.stream()
                .filter(r -> r.getFechaEntrada().isAfter(hoy))
                .sorted(Comparator.comparing(Reserva::getFechaEntrada))
                .map(this::resumirReserva)
                .collect(Collectors.toList());

        List<Reserva> pasadas = reservas.stream()
                .filter(r -> !r.getFechaSalida().isAfter(hoy))
                .sorted(Comparator.comparing(Reserva::getFechaSalida).reversed())
                .collect(Collectors.toList());

        List<Map<String, Object>> pasadasTop = pasadas.stream()
                .limit(TOP_PASADAS)
                .map(this::resumirReserva)
                .collect(Collectors.toList());

        var pagos = pagoRepository.findByUsuarioIdOrderByCreatedAtDesc(u.getId());
        BigDecimal totalGastado = pagos.stream()
                .filter(p -> p.getEstado() == EstadoPago.COMPLETADO && p.getTotal() != null)
                .map(Pago::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> pagosTop = pagos.stream()
                .filter(p -> p.getEstado() == EstadoPago.COMPLETADO)
                .limit(TOP_PASADAS)
                .map(p -> {
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("id", p.getId());
                    pm.put("referencia", p.getReferencia());
                    pm.put("total", p.getTotal());
                    pm.put("metodoTipo", p.getMetodoTipo());
                    pm.put("completedAt", p.getCompletedAt());
                    return pm;
                })
                .collect(Collectors.toList());

        var metodos = metodoPagoRepository.findByUsuarioIdOrderByEsDefaultDescCreatedAtDesc(u.getId()).stream()
                .map(m -> {
                    Map<String, Object> mm = new LinkedHashMap<>();
                    mm.put("id", m.getId());
                    mm.put("tipo", m.getTipo() != null ? m.getTipo().name() : null);
                    mm.put("marca", m.getMarca());
                    mm.put("ultimosCuatro", m.getUltimosCuatro());
                    mm.put("esDefault", m.isEsDefault());
                    return mm;
                })
                .collect(Collectors.toList());

        Map<String, Object> ficha = new LinkedHashMap<>();
        ficha.put("id", u.getId());
        ficha.put("email", u.getEmail());
        ficha.put("nombre", u.getNombre());
        ficha.put("activas", activas);
        ficha.put("proximas", proximas);
        ficha.put("pasadasTop", pasadasTop);
        ficha.put("pasadasTotal", pasadas.size());
        ficha.put("totalGastado", totalGastado);
        ficha.put("pagosTop", pagosTop);
        ficha.put("metodosPago", metodos);
        return ficha;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validarTexto(String texto) {
        if (texto == null || texto.trim().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje no puede estar vacío.");
        if (texto.length() > TEXTO_MAX)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje supera los " + TEXTO_MAX + " caracteres.");
    }

    private void permitirOLanzar(Long usuarioId) {
        long now = System.currentTimeMillis();
        Deque<Long> q = rateBucket.computeIfAbsent(usuarioId, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > RATE_WINDOW_MS) q.pollFirst();
            if (q.size() >= RATE_MAX)
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Demasiados mensajes en poco tiempo. Espera unos segundos.");
            q.addLast(now);
        }
    }

    private Mensaje nuevoMensaje(Long conversacionId, Long autorId, String autorRol, String texto) {
        Mensaje m = new Mensaje();
        m.setConversacionId(conversacionId);
        m.setAutorId(autorId);
        m.setAutorRol(autorRol);
        m.setTexto(texto.trim());
        return m;
    }

    private Map<String, Object> serializarConversacion(Conversacion c, List<Mensaje> mensajes) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("clienteId", c.getClienteId());
        m.put("ultimaActividad", c.getUltimaActividad());
        m.put("noLeidosCliente", c.getNoLeidosCliente());
        m.put("noLeidosRecepcion", c.getNoLeidosRecepcion());
        m.put("estado", c.getEstado() != null ? c.getEstado().name() : "ABIERTA");
        usuarioRepository.findById(c.getClienteId()).ifPresent(u -> {
            m.put("clienteEmail", u.getEmail());
            m.put("clienteNombre", u.getNombre());
        });
        m.put("mensajes", mensajes.stream().map(this::serializarMensaje).collect(Collectors.toList()));
        return m;
    }

    private Map<String, Object> serializarMensaje(Mensaje msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", msg.getId());
        m.put("autorId", msg.getAutorId());
        m.put("autorRol", msg.getAutorRol());
        m.put("texto", msg.getTexto());
        m.put("creadoEn", msg.getCreadoEn());
        m.put("leidoEn", msg.getLeidoEn());
        m.put("adjuntoUrl", msg.getAdjuntoUrl());
        m.put("adjuntoNombre", msg.getAdjuntoNombre());
        return m;
    }

    private Map<String, Object> serializarItemInbox(Conversacion c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("conversacionId", c.getId());
        m.put("clienteId", c.getClienteId());
        m.put("ultimaActividad", c.getUltimaActividad());
        m.put("noLeidosRecepcion", c.getNoLeidosRecepcion());
        m.put("estado", c.getEstado() != null ? c.getEstado().name() : "ABIERTA");
        usuarioRepository.findById(c.getClienteId()).ifPresent(u -> {
            m.put("clienteEmail", u.getEmail());
            m.put("clienteNombre", u.getNombre());
        });
        mensajeRepository.findTopByConversacionIdOrderByCreadoEnDesc(c.getId()).ifPresent(ult -> {
            m.put("ultimoTexto", ult.getTexto());
            m.put("ultimoAutorRol", ult.getAutorRol());
            m.put("ultimoCreadoEn", ult.getCreadoEn());
        });
        return m;
    }

    private Map<String, Object> resumirReserva(Reserva r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("fechaEntrada", r.getFechaEntrada());
        m.put("fechaSalida", r.getFechaSalida());
        if (r.getHabitacion() != null) {
            m.put("habitacionNumero", r.getHabitacion().getNumero());
            m.put("habitacionTipo", r.getHabitacion().getTipo() != null ? r.getHabitacion().getTipo().name() : null);
            m.put("precioNoche", r.getHabitacion().getPrecioNoche());
        }
        return m;
    }
}
