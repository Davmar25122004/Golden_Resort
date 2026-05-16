package com.example.supabase.service;

import com.example.supabase.domain.*;
import com.example.supabase.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LimpiezaService {

    private static final List<TareaLimpieza.Estado> ESTADOS_ABIERTOS =
            List.of(TareaLimpieza.Estado.PENDIENTE, TareaLimpieza.Estado.EN_PROGRESO);

    private final HabitacionRepository habitacionRepository;
    private final ReservaRepository    reservaRepository;
    private final UsuarioRepository    usuarioRepository;
    private final TareaLimpiezaRepository tareaRepository;
    private final IncidenciaLimpiezaRepository incidenciaRepository;
    private final ObjetoPerdidoRepository objetoPerdidoRepository;

    public LimpiezaService(HabitacionRepository habitacionRepository,
                           ReservaRepository reservaRepository,
                           UsuarioRepository usuarioRepository,
                           TareaLimpiezaRepository tareaRepository,
                           IncidenciaLimpiezaRepository incidenciaRepository,
                           ObjetoPerdidoRepository objetoPerdidoRepository) {
        this.habitacionRepository = habitacionRepository;
        this.reservaRepository    = reservaRepository;
        this.usuarioRepository    = usuarioRepository;
        this.tareaRepository      = tareaRepository;
        this.incidenciaRepository = incidenciaRepository;
        this.objetoPerdidoRepository = objetoPerdidoRepository;
    }

    // ── Objetos perdidos ─────────────────────────────────────────────────────

    public List<Map<String, Object>> listarObjetos(boolean soloDisponibles) {
        var lista = soloDisponibles
                ? objetoPerdidoRepository.findByEstadoInOrderByEncontradoEnDesc(List.of(ObjetoPerdido.Estado.DISPONIBLE))
                : objetoPerdidoRepository.findAllByOrderByEncontradoEnDesc();
        return lista.stream().map(this::toRowObjeto).collect(Collectors.toList());
    }

    @Transactional
    public ObjetoPerdido crearObjeto(Long habitacionId, String descripcion,
                                     String imagenUrl, LocalDateTime encontradoEn,
                                     Usuario reportador) {
        ObjetoPerdido o = new ObjetoPerdido();
        if (habitacionId != null) o.setHabitacion(habitacionRepository.findById(habitacionId).orElse(null));
        o.setDescripcion(descripcion != null ? descripcion.trim() : "");
        o.setImagenUrl(imagenUrl);
        o.setEncontradoEn(encontradoEn != null ? encontradoEn : LocalDateTime.now());
        o.setEstado(ObjetoPerdido.Estado.DISPONIBLE);
        o.setReportadoPor(reportador);
        return objetoPerdidoRepository.save(o);
    }

    @Transactional
    public ObjetoPerdido cambiarEstadoObjeto(Long id, ObjetoPerdido.Estado nuevo, String notas) {
        ObjetoPerdido o = objetoPerdidoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Objeto no encontrado"));
        o.setEstado(nuevo);
        if (notas != null && !notas.isBlank()) o.setNotasEntrega(notas.trim());
        if (nuevo == ObjetoPerdido.Estado.ENTREGADO) o.setEntregadoEn(LocalDateTime.now());
        return objetoPerdidoRepository.save(o);
    }

    private Map<String, Object> toRowObjeto(ObjetoPerdido o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            o.getId());
        m.put("descripcion",   o.getDescripcion());
        m.put("imagenUrl",     o.getImagenUrl());
        m.put("encontradoEn",  o.getEncontradoEn());
        m.put("estado",        o.getEstado().name());
        m.put("notasEntrega",  o.getNotasEntrega());
        m.put("creadaEn",      o.getCreadaEn());
        m.put("entregadoEn",   o.getEntregadoEn());
        if (o.getHabitacion() != null) {
            m.put("habitacionId",     o.getHabitacion().getId());
            m.put("habitacionNumero", o.getHabitacion().getNumero());
            m.put("habitacionTipo",   o.getHabitacion().getTipo() != null ? o.getHabitacion().getTipo().name() : null);
        }
        if (o.getReportadoPor() != null) {
            m.put("reportadoEmail",  o.getReportadoPor().getEmail());
            m.put("reportadoNombre", o.getReportadoPor().getNombre());
        }
        return m;
    }

    // ── Panel principal: una fila por habitación con su estado y tarea pendiente
    public List<Map<String, Object>> panel() {
        LocalDate hoy = LocalDate.now();
        List<TareaLimpieza> abiertas = tareaRepository.findAbiertasOrdenadasPorPrioridad(ESTADOS_ABIERTOS);
        Map<Long, TareaLimpieza> tareaPorHab = new LinkedHashMap<>();
        for (TareaLimpieza t : abiertas) tareaPorHab.putIfAbsent(t.getHabitacion().getId(), t);

        return habitacionRepository.findAll().stream()
                .sorted(Comparator.comparing(Habitacion::getNumero))
                .map(h -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("habitacionId",     h.getId());
                    m.put("habitacionNumero", h.getNumero());
                    m.put("habitacionTipo",   h.getTipo() != null ? h.getTipo().name() : null);
                    m.put("estadoLimpieza",   h.getEstadoLimpieza() != null ? h.getEstadoLimpieza().name() : "LIMPIA");

                    LocalDate proxSalida = reservaRepository.findByHabitacion(h).stream()
                            .map(Reserva::getFechaSalida)
                            .filter(f -> !f.isBefore(hoy))
                            .min(Comparator.naturalOrder()).orElse(null);
                    m.put("proximaSalida", proxSalida);

                    TareaLimpieza t = tareaPorHab.get(h.getId());
                    if (t != null) {
                        m.put("tareaId",        t.getId());
                        m.put("tareaTipo",      t.getTipo().name());
                        m.put("tareaEstado",    t.getEstado().name());
                        m.put("tareaPrioridad", t.getPrioridad().name());
                        m.put("tareaCreadaEn",  t.getCreadaEn());
                        m.put("tareaIniciadaEn", t.getIniciadaEn());
                        m.put("tareaAsignadoEmail",
                                t.getAsignadoA() != null ? t.getAsignadoA().getEmail() : null);
                        m.put("tareaNotas", t.getNotas());
                    }
                    return m;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> tareasAbiertas() {
        return tareaRepository.findAbiertasOrdenadasPorPrioridad(ESTADOS_ABIERTOS).stream()
                .map(this::toRowTarea).collect(Collectors.toList());
    }

    public List<Map<String, Object>> misTareas(Long usuarioId) {
        if (usuarioId == null) return List.of();
        return tareaRepository.findByAsignadoAIdAndEstadoIn(usuarioId, ESTADOS_ABIERTOS).stream()
                .map(this::toRowTarea).collect(Collectors.toList());
    }

    // ── Acciones sobre tareas ─────────────────────────────────────────────────

    @Transactional
    public TareaLimpieza iniciar(Long tareaId, Long usuarioId) {
        TareaLimpieza t = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarea no encontrada"));
        if (t.getEstado() == TareaLimpieza.Estado.COMPLETADA || t.getEstado() == TareaLimpieza.Estado.CANCELADA)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La tarea ya está cerrada");
        Usuario u = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        t.setEstado(TareaLimpieza.Estado.EN_PROGRESO);
        t.setAsignadoA(u);
        if (t.getIniciadaEn() == null) t.setIniciadaEn(LocalDateTime.now());

        Habitacion h = t.getHabitacion();
        if (h.getEstadoLimpieza() != EstadoLimpieza.MANTENIMIENTO) {
            h.setEstadoLimpieza(EstadoLimpieza.EN_LIMPIEZA);
            habitacionRepository.save(h);
        }
        return tareaRepository.save(t);
    }

    @Transactional
    public TareaLimpieza completar(Long tareaId, String notasFinales) {
        TareaLimpieza t = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarea no encontrada"));
        if (t.getEstado() == TareaLimpieza.Estado.COMPLETADA || t.getEstado() == TareaLimpieza.Estado.CANCELADA)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La tarea ya está cerrada");

        t.setEstado(TareaLimpieza.Estado.COMPLETADA);
        t.setCompletadaEn(LocalDateTime.now());
        if (notasFinales != null && !notasFinales.isBlank()) t.setNotasFinales(notasFinales.trim());

        Habitacion h = t.getHabitacion();
        if (h.getEstadoLimpieza() != EstadoLimpieza.MANTENIMIENTO) {
            h.setEstadoLimpieza(EstadoLimpieza.LIMPIA);
            habitacionRepository.save(h);
        }
        return tareaRepository.save(t);
    }

    @Transactional
    public TareaLimpieza cancelar(Long tareaId) {
        TareaLimpieza t = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarea no encontrada"));
        if (t.getEstado() == TareaLimpieza.Estado.COMPLETADA)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La tarea ya está completada");
        t.setEstado(TareaLimpieza.Estado.CANCELADA);
        return tareaRepository.save(t);
    }

    @Transactional
    public TareaLimpieza crearManual(Long habitacionId, TareaLimpieza.Tipo tipo,
                                     TareaLimpieza.Prioridad prioridad, String notas) {
        Habitacion h = habitacionRepository.findById(habitacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Habitación no encontrada"));
        TareaLimpieza t = new TareaLimpieza();
        t.setHabitacion(h);
        t.setTipo(tipo != null ? tipo : TareaLimpieza.Tipo.OTRA);
        t.setPrioridad(prioridad != null ? prioridad : TareaLimpieza.Prioridad.NORMAL);
        t.setEstado(TareaLimpieza.Estado.PENDIENTE);
        if (notas != null && !notas.isBlank()) t.setNotas(notas.trim());
        TareaLimpieza guardada = tareaRepository.save(t);

        if (h.getEstadoLimpieza() != EstadoLimpieza.MANTENIMIENTO
                && (t.getTipo() == TareaLimpieza.Tipo.SALIDA || t.getTipo() == TareaLimpieza.Tipo.DIARIA)) {
            h.setEstadoLimpieza(EstadoLimpieza.SUCIA);
            habitacionRepository.save(h);
        }
        return guardada;
    }

    // ── Generación automática de tareas SALIDA ───────────────────────────────

    @Transactional
    public int generarTareasSalidaHoy() {
        LocalDate hoy = LocalDate.now();
        int creadas = 0;
        for (Reserva r : reservaRepository.findByFechaSalida(hoy)) {
            if (tareaRepository.existsByReservaIdAndTipo(r.getId(), TareaLimpieza.Tipo.SALIDA)) continue;
            TareaLimpieza t = new TareaLimpieza();
            t.setHabitacion(r.getHabitacion());
            t.setReserva(r);
            t.setTipo(TareaLimpieza.Tipo.SALIDA);
            t.setEstado(TareaLimpieza.Estado.PENDIENTE);
            t.setPrioridad(TareaLimpieza.Prioridad.NORMAL);
            t.setNotas("Limpieza tras checkout (auto)");
            tareaRepository.save(t);

            Habitacion h = r.getHabitacion();
            if (h.getEstadoLimpieza() != EstadoLimpieza.MANTENIMIENTO) {
                h.setEstadoLimpieza(EstadoLimpieza.SUCIA);
                habitacionRepository.save(h);
            }
            creadas++;
        }
        return creadas;
    }

    /** Job programado: cada día a las 11:30 (poco después del checkout) genera las tareas SALIDA. */
    @Scheduled(cron = "0 30 11 * * *")
    @Transactional
    public void jobGenerarSalidas() {
        try { generarTareasSalidaHoy(); } catch (Exception ignored) {}
    }

    @Transactional
    public Habitacion cambiarEstadoHabitacion(Long habitacionId, EstadoLimpieza nuevoEstado) {
        Habitacion h = habitacionRepository.findById(habitacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Habitación no encontrada"));
        h.setEstadoLimpieza(nuevoEstado != null ? nuevoEstado : EstadoLimpieza.LIMPIA);
        return habitacionRepository.save(h);
    }

    // ── Calendario: checkouts (que requieren limpieza) por rango ─────────────

    public Map<String, Integer> calendarioRango(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null || hasta.isBefore(desde))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango inválido.");
        Map<String, Integer> conteo = new LinkedHashMap<>();
        LocalDate cursor = desde;
        while (!cursor.isAfter(hasta)) { conteo.put(cursor.toString(), 0); cursor = cursor.plusDays(1); }
        for (Reserva r : reservaRepository.findAll()) {
            LocalDate s = r.getFechaSalida();
            if (s != null && !s.isBefore(desde) && !s.isAfter(hasta)) {
                conteo.merge(s.toString(), 1, (x, y) -> x + y);
            }
        }
        return conteo;
    }

    public List<Map<String, Object>> calendarioDia(LocalDate dia) {
        if (dia == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fecha requerida.");
        return reservaRepository.findByFechaSalida(dia).stream()
                .sorted(Comparator.comparing(r -> r.getHabitacion().getNumero()))
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("reservaId",        r.getId());
                    m.put("habitacionId",     r.getHabitacion().getId());
                    m.put("habitacionNumero", r.getHabitacion().getNumero());
                    m.put("habitacionTipo",   r.getHabitacion().getTipo() != null ? r.getHabitacion().getTipo().name() : null);
                    m.put("estadoLimpieza",   r.getHabitacion().getEstadoLimpieza() != null ? r.getHabitacion().getEstadoLimpieza().name() : "LIMPIA");
                    m.put("fechaEntrada",     r.getFechaEntrada());
                    m.put("fechaSalida",      r.getFechaSalida());
                    if (r.getUsuario() != null) {
                        m.put("clienteNombre", r.getUsuario().getNombre());
                        m.put("clienteEmail",  r.getUsuario().getEmail());
                    }
                    boolean tareaCreada = tareaRepository.existsByReservaIdAndTipo(r.getId(), TareaLimpieza.Tipo.SALIDA);
                    m.put("tareaCreada", tareaCreada);
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ── Incidencias ─────────────────────────────────────────────────────────

    public List<Map<String, Object>> listarIncidencias(boolean soloAbiertas) {
        var lista = soloAbiertas
                ? incidenciaRepository.findByEstadoInOrderByCreadaEnDesc(
                    List.of(IncidenciaLimpieza.Estado.ABIERTA, IncidenciaLimpieza.Estado.EN_PROCESO))
                : incidenciaRepository.findAllByOrderByCreadaEnDesc();
        return lista.stream().map(this::toRowIncidencia).collect(Collectors.toList());
    }

    @Transactional
    public IncidenciaLimpieza crearIncidencia(Long habitacionId, IncidenciaLimpieza.Tipo tipo,
                                              IncidenciaLimpieza.Prioridad prioridad,
                                              String descripcion, Usuario reportador) {
        if (descripcion == null || descripcion.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Descripción requerida.");
        IncidenciaLimpieza i = new IncidenciaLimpieza();
        if (habitacionId != null) {
            i.setHabitacion(habitacionRepository.findById(habitacionId).orElse(null));
        }
        i.setTipo(tipo != null ? tipo : IncidenciaLimpieza.Tipo.MANTENIMIENTO);
        i.setPrioridad(prioridad != null ? prioridad : IncidenciaLimpieza.Prioridad.NORMAL);
        i.setDescripcion(descripcion.trim());
        i.setEstado(IncidenciaLimpieza.Estado.ABIERTA);
        i.setReportadoPor(reportador);

        // Si es MANTENIMIENTO sobre una habitación concreta, marca la habitación
        if (i.getHabitacion() != null && i.getTipo() == IncidenciaLimpieza.Tipo.MANTENIMIENTO) {
            i.getHabitacion().setEstadoLimpieza(EstadoLimpieza.MANTENIMIENTO);
            habitacionRepository.save(i.getHabitacion());
        }
        return incidenciaRepository.save(i);
    }

    @Transactional
    public IncidenciaLimpieza cambiarEstadoIncidencia(Long id, IncidenciaLimpieza.Estado nuevo, String resolucion) {
        IncidenciaLimpieza i = incidenciaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidencia no encontrada"));
        i.setEstado(nuevo);
        if (nuevo == IncidenciaLimpieza.Estado.RESUELTA) {
            i.setResueltaEn(LocalDateTime.now());
            if (resolucion != null && !resolucion.isBlank()) i.setResolucion(resolucion.trim());
            // Si la habitación estaba en MANTENIMIENTO por esta incidencia, la liberamos a SUCIA
            if (i.getHabitacion() != null && i.getHabitacion().getEstadoLimpieza() == EstadoLimpieza.MANTENIMIENTO) {
                i.getHabitacion().setEstadoLimpieza(EstadoLimpieza.SUCIA);
                habitacionRepository.save(i.getHabitacion());
            }
        }
        return incidenciaRepository.save(i);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toRowTarea(TareaLimpieza t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            t.getId());
        m.put("tipo",          t.getTipo().name());
        m.put("estado",        t.getEstado().name());
        m.put("prioridad",     t.getPrioridad().name());
        m.put("notas",         t.getNotas());
        m.put("notasFinales",  t.getNotasFinales());
        m.put("creadaEn",      t.getCreadaEn());
        m.put("iniciadaEn",    t.getIniciadaEn());
        m.put("completadaEn",  t.getCompletadaEn());
        if (t.getHabitacion() != null) {
            m.put("habitacionId",     t.getHabitacion().getId());
            m.put("habitacionNumero", t.getHabitacion().getNumero());
            m.put("habitacionTipo",   t.getHabitacion().getTipo() != null ? t.getHabitacion().getTipo().name() : null);
        }
        if (t.getReserva() != null) {
            m.put("reservaId",    t.getReserva().getId());
            m.put("fechaEntrada", t.getReserva().getFechaEntrada());
            m.put("fechaSalida",  t.getReserva().getFechaSalida());
        }
        if (t.getAsignadoA() != null) {
            m.put("asignadoEmail",  t.getAsignadoA().getEmail());
            m.put("asignadoNombre", t.getAsignadoA().getNombre());
        }
        return m;
    }

    private Map<String, Object> toRowIncidencia(IncidenciaLimpieza i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          i.getId());
        m.put("tipo",        i.getTipo().name());
        m.put("prioridad",   i.getPrioridad().name());
        m.put("estado",      i.getEstado().name());
        m.put("descripcion", i.getDescripcion());
        m.put("resolucion",  i.getResolucion());
        m.put("creadaEn",    i.getCreadaEn());
        m.put("resueltaEn",  i.getResueltaEn());
        if (i.getHabitacion() != null) {
            m.put("habitacionId",     i.getHabitacion().getId());
            m.put("habitacionNumero", i.getHabitacion().getNumero());
            m.put("habitacionTipo",   i.getHabitacion().getTipo() != null ? i.getHabitacion().getTipo().name() : null);
        }
        if (i.getReportadoPor() != null) {
            m.put("reportadoEmail",  i.getReportadoPor().getEmail());
            m.put("reportadoNombre", i.getReportadoPor().getNombre());
        }
        return m;
    }
}
