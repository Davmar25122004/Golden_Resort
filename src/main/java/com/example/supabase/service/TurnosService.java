package com.example.supabase.service;

import com.example.supabase.domain.*;
import com.example.supabase.repository.TurnoPlanDiaTramoRepository;
import com.example.supabase.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TurnosService {

    @PersistenceContext
    private EntityManager em;

    private final HorarioRepository horarioRepo;
    private final TurnoPerfilRepository perfilRepo;
    private final TurnoPlanRepository planRepo;
    private final UsuarioRepository usuarioRepo;
    private final EmpleadoRepository empleadoRepo;
    private final TurnoPlanDiaTramoRepository diaTramoRepo;
    private final TurnoPlanDiaRepository planDiaRepo;

    public TurnosService(HorarioRepository horarioRepo, TurnoPerfilRepository perfilRepo,
                         TurnoPlanRepository planRepo, UsuarioRepository usuarioRepo,
                         EmpleadoRepository empleadoRepo,
                         TurnoPlanDiaTramoRepository diaTramoRepo,
                         TurnoPlanDiaRepository planDiaRepo) {
        this.horarioRepo  = horarioRepo;
        this.perfilRepo   = perfilRepo;
        this.planRepo     = planRepo;
        this.usuarioRepo  = usuarioRepo;
        this.empleadoRepo = empleadoRepo;
        this.diaTramoRepo = diaTramoRepo;
        this.planDiaRepo  = planDiaRepo;
    }

    // ── HORARIOS ─────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listarHorarios() {
        return horarioRepo.findAll().stream()
                .sorted(Comparator.comparing(Horario::getNombre))
                .map(this::toRowHorario).collect(Collectors.toList());
    }

    public Map<String, Object> detalleHorario(Long id) {
        return toRowHorario(horarioRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horario no encontrado")));
    }

    @Transactional
    public Horario crearHorario(Map<String, Object> body) {
        Horario h = new Horario();
        aplicarHorario(h, body);
        return horarioRepo.save(h);
    }

    @Transactional
    public Horario actualizarHorario(Long id, Map<String, Object> body) {
        Horario h = horarioRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horario no encontrado"));
        h.getTramos().clear();
        aplicarHorario(h, body);
        return horarioRepo.save(h);
    }

    @SuppressWarnings("unchecked")
    private void aplicarHorario(Horario h, Map<String, Object> body) {
        h.setNombre(reqStr(body, "nombre", "Nombre requerido"));
        h.setDescripcion(optStr(body, "descripcion"));
        var slots = (List<Map<String, Object>>) body.get("tramos");
        if (slots != null) {
            for (var s : slots) {
                HorarioTramo t = new HorarioTramo();
                t.setHorario(h);
                t.setDiaSemana(((Number) reqVal(s, "dia_semana", "dia_semana requerido")).shortValue());
                t.setHoraInicio(LocalTime.parse(reqStr(s, "hora_inicio", "hora_inicio requerido")));
                t.setHoraFin   (LocalTime.parse(reqStr(s, "hora_fin",    "hora_fin requerido")));
                if (!t.getHoraInicio().isBefore(t.getHoraFin()))
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "hora_inicio debe ser menor que hora_fin");
                if (t.getDiaSemana() < 1 || t.getDiaSemana() > 7)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dia_semana fuera de rango (1-7)");
                h.getTramos().add(t);
            }
        }
    }

    @Transactional
    public void borrarHorario(Long id) {
        try { horarioRepo.deleteById(id); }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede borrar: el horario está usado en algún perfil.");
        }
    }

    // ── PERFILES (tipos de jornada) ───────────────────────────────────────

    public List<Map<String, Object>> listarPerfiles() {
        return perfilRepo.findAll().stream()
                .sorted(Comparator.comparing(TurnoPerfil::getNombre))
                .map(this::toRowPerfil).collect(Collectors.toList());
    }

    public Map<String, Object> detallePerfil(Long id) {
        return toRowPerfil(perfilRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil no encontrado")));
    }

    @Transactional
    public TurnoPerfil crearPerfil(Map<String, Object> body) {
        TurnoPerfil p = new TurnoPerfil();
        aplicarPerfil(p, body);
        return perfilRepo.save(p);
    }

    @Transactional
    public TurnoPerfil actualizarPerfil(Long id, Map<String, Object> body) {
        TurnoPerfil p = perfilRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil no encontrado"));
        p.getItems().clear();
        aplicarPerfil(p, body);
        return perfilRepo.save(p);
    }

    @SuppressWarnings("unchecked")
    private void aplicarPerfil(TurnoPerfil p, Map<String, Object> body) {
        p.setNombre(reqStr(body, "nombre", "Nombre requerido"));
        p.setDescripcion(optStr(body, "descripcion"));
        Object colorObj = body.get("color");
        p.setColor(colorObj != null && !colorObj.toString().isBlank() ? colorObj.toString().trim() : "#c9a96e");
        var ids = (List<Object>) body.get("horarios");
        if (ids != null) {
            for (Object raw : ids) {
                Long hid = ((Number) raw).longValue();
                Horario h = horarioRepo.findById(hid)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Horario " + hid + " no encontrado"));
                TurnoPerfilHorario item = new TurnoPerfilHorario();
                item.setPerfil(p);
                item.setHorario(h);
                p.getItems().add(item);
            }
        }
    }

    @Transactional
    public void borrarPerfil(Long id) {
        try { perfilRepo.deleteById(id); }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede borrar: el perfil está usado en algún plan.");
        }
    }

    // ── PLANES (cuadrantes) ──────────────────────────────────────────────

    public List<Map<String, Object>> listarPlanes() {
        return planRepo.findAll().stream()
                .sorted(Comparator.comparing(TurnoPlan::getNombre))
                .map(this::toRowPlan).collect(Collectors.toList());
    }

    public Map<String, Object> detallePlan(Long id) {
        return toRowPlan(planRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado")));
    }

    @Transactional
    public TurnoPlan crearPlan(Map<String, Object> body) {
        TurnoPlan p = new TurnoPlan();
        aplicarPlan(p, body);
        return planRepo.save(p);
    }

    @Transactional
    public TurnoPlan actualizarPlan(Long id, Map<String, Object> body) {
        TurnoPlan p = planRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));
        p.getPatron().clear();
        p.getDias().clear();
        aplicarPlan(p, body);
        return planRepo.save(p);
    }

    @SuppressWarnings("unchecked")
    private void aplicarPlan(TurnoPlan p, Map<String, Object> body) {
        p.setNombre(reqStr(body, "nombre", "Nombre requerido"));
        p.setDescripcion(optStr(body, "descripcion"));
        Object def = body.get("perfil_default_id");
        if (def != null) {
            Long pid = ((Number) def).longValue();
            p.setPerfilDefault(perfilRepo.findById(pid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil default no encontrado")));
        } else p.setPerfilDefault(null);

        var pat = (List<Map<String, Object>>) body.get("patron_semanal");
        if (pat != null) {
            for (var pp : pat) {
                short dia = ((Number) reqVal(pp, "dia", "dia requerido")).shortValue();
                Long perfilId = ((Number) reqVal(pp, "perfil_id", "perfil_id requerido")).longValue();
                TurnoPerfil per = perfilRepo.findById(perfilId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil " + perfilId + " no encontrado"));
                TurnoPlanSemana ws = new TurnoPlanSemana();
                ws.setPlan(p); ws.setDiaSemana(dia); ws.setPerfil(per);
                p.getPatron().add(ws);
            }
        }
        var dias = (List<Map<String, Object>>) body.get("dias");
        if (dias != null) {
            for (var d : dias) {
                LocalDate fecha = LocalDate.parse(reqStr(d, "fecha", "fecha requerido"));
                Long perfilId = ((Number) reqVal(d, "perfil_id", "perfil_id requerido")).longValue();
                TurnoPerfil per = perfilRepo.findById(perfilId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil " + perfilId + " no encontrado"));
                TurnoPlanDia pd = new TurnoPlanDia();
                pd.setPlan(p); pd.setFecha(fecha); pd.setPerfil(per);
                p.getDias().add(pd);
            }
        }
    }

    @Transactional
    public void borrarPlan(Long id) {
        // Limpiar referencia en usuarios (evita FK violation en usuarios.turno_plan_id)
        usuarioRepo.findAll().forEach(u -> {
            if (u.getTurnoPlan() != null && u.getTurnoPlan().getId().equals(id)) {
                u.setTurnoPlan(null); usuarioRepo.save(u);
            }
        });
        // Limpiar referencia en empleados (fuente autoritativa desde la migración)
        empleadoRepo.findAll().forEach(emp -> {
            if (emp.getTurnoPlan() != null && emp.getTurnoPlan().getId().equals(id)) {
                emp.setTurnoPlan(null); empleadoRepo.save(emp);
            }
        });
        planRepo.deleteById(id);
    }

    public List<Map<String, Object>> calendarioPlan(Long planId, LocalDate desde, LocalDate hasta) {
        TurnoPlan p = planRepo.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));
        Map<LocalDate, TurnoPerfil> overrides = new HashMap<>();
        Set<LocalDate> libres = new java.util.HashSet<>();
        for (var pd : p.getDias()) {
            if (pd.getPerfil() == null) libres.add(pd.getFecha());
            else overrides.put(pd.getFecha(), pd.getPerfil());
        }
        Map<Short, TurnoPerfil> patron = new HashMap<>();
        for (var ws : p.getPatron()) patron.put(ws.getDiaSemana(), ws.getPerfil());

        // Precargar tramos custom del rango completo en un solo query
        var tramosCustomList = diaTramoRepo
                .findByPlanIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(planId, desde, hasta);
        Map<LocalDate, List<TurnoPlanDiaTramo>> tramosCustom = new HashMap<>();
        for (var t : tramosCustomList) {
            tramosCustom.computeIfAbsent(t.getFecha(), k -> new ArrayList<>()).add(t);
        }

        DateTimeFormatter tf = DateTimeFormatter.ofPattern("HH:mm");
        List<Map<String, Object>> out = new ArrayList<>();
        LocalDate cur = desde;
        while (!cur.isAfter(hasta)) {
            TurnoPerfil per = overrides.get(cur);
            short dow = (short) cur.getDayOfWeek().getValue();
            if (per == null) per = patron.get(dow);
            if (per == null) per = p.getPerfilDefault();

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fecha", cur.toString());
            m.put("dia_semana", dow);
            boolean esLibre = libres.contains(cur);
            m.put("override", overrides.containsKey(cur) || esLibre);
            m.put("libre", esLibre);
            m.put("custom_tramos", tramosCustom.containsKey(cur));
            if (esLibre) { m.put("slots", List.of()); out.add(m); cur = cur.plusDays(1); continue; }
            if (per != null) {
                m.put("perfil_id", per.getId());
                m.put("perfil_nombre", per.getNombre());
                m.put("color", per.getColor() != null ? per.getColor() : "#c9a96e");
            }
            // Slots: tramos custom tienen prioridad sobre los del perfil
            List<Map<String, Object>> slots = new ArrayList<>();
            if (tramosCustom.containsKey(cur)) {
                for (var t : tramosCustom.get(cur)) {
                    Map<String, Object> slot = new LinkedHashMap<>();
                    slot.put("from", t.getHoraInicio().format(tf));
                    slot.put("to",   t.getHoraFin().format(tf));
                    slots.add(slot);
                }
            } else if (per != null) {
                for (var item : per.getItems()) {
                    for (var tramo : item.getHorario().getTramos()) {
                        if (tramo.getDiaSemana() == dow) {
                            Map<String, Object> slot = new LinkedHashMap<>();
                            slot.put("from", tramo.getHoraInicio().format(tf));
                            slot.put("to",   tramo.getHoraFin().format(tf));
                            slots.add(slot);
                        }
                    }
                }
                slots.sort(Comparator.comparing(s -> (String) s.get("from")));
            }
            m.put("slots", slots);
            out.add(m);
            cur = cur.plusDays(1);
        }
        return out;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public void aplicarBulkOverride(Long planId, Map<String, Object> body) {
        Long perfilId = ((Number) reqVal(body, "perfil_id", "perfil_id requerido")).longValue();
        LocalDate desde = LocalDate.parse(reqStr(body, "desde", "desde requerido"));
        LocalDate hasta = LocalDate.parse(reqStr(body, "hasta", "hasta requerido"));
        List<Number> diasRaw = (List<Number>) body.get("dias_semana");

        if (!planRepo.existsById(planId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado");
        if (!perfilRepo.existsById(perfilId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil no encontrado");

        String dowFilter = "";
        if (diasRaw != null && !diasRaw.isEmpty()) {
            List<Integer> diasValidados = diasRaw.stream()
                    .map(Number::intValue)
                    .filter(d -> d >= 1 && d <= 7)
                    .distinct()
                    .collect(Collectors.toList());
            if (diasValidados.isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dias_semana debe contener valores entre 1 y 7");
            String inList = diasValidados.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
            dowFilter = " WHERE EXTRACT(ISODOW FROM g) IN (" + inList + ")";
        }

        String sql = "INSERT INTO turno_plan_dia (plan_id, fecha, perfil_id) " +
                     "SELECT :planId, CAST(g AS date), :perfilId " +
                     "FROM generate_series(CAST(:desde AS date), CAST(:hasta AS date), interval '1 day') AS g" +
                     dowFilter +
                     " ON CONFLICT (plan_id, fecha) DO UPDATE SET perfil_id = EXCLUDED.perfil_id";

        em.createNativeQuery(sql)
                .setParameter("planId", planId)
                .setParameter("perfilId", perfilId)
                .setParameter("desde", desde.toString())
                .setParameter("hasta", hasta.toString())
                .executeUpdate();
    }

    @Transactional
    public List<Map<String, Object>> getTramosDia(Long planId, LocalDate fecha) {
        DateTimeFormatter tf = DateTimeFormatter.ofPattern("HH:mm");
        return diaTramoRepo.findByPlanIdAndFechaOrderByHoraInicio(planId, fecha).stream()
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("from", t.getHoraInicio().format(tf));
                    m.put("to",   t.getHoraFin().format(tf));
                    return m;
                }).collect(Collectors.toList());
    }

    @Transactional
    public void setTramosDia(Long planId, LocalDate fecha, List<Map<String, Object>> tramos) {
        diaTramoRepo.deleteByPlanIdAndFecha(planId, fecha);
        if (tramos == null) return;
        for (var t : tramos) {
            String hi = (String) t.get("hora_inicio");
            String hf = (String) t.get("hora_fin");
            if (hi == null || hf == null) continue;
            LocalTime inicio = LocalTime.parse(hi);
            LocalTime fin    = LocalTime.parse(hf);
            if (!inicio.isBefore(fin))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "hora_inicio debe ser menor que hora_fin en tramo " + hi);
            TurnoPlanDiaTramo e = new TurnoPlanDiaTramo();
            e.setPlanId(planId); e.setFecha(fecha);
            e.setHoraInicio(inicio); e.setHoraFin(fin);
            diaTramoRepo.save(e);
        }
    }

    @Transactional
    public void setPerfilDia(Long planId, LocalDate fecha, Long perfilId, boolean libre) {
        // Direct JPQL DELETE avoids Hibernate INSERT-before-DELETE constraint violation
        planDiaRepo.deleteByPlanIdAndFecha(planId, fecha);
        if (perfilId == null && !libre) return; // sin override, usa patrón
        TurnoPlan p = planRepo.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));
        TurnoPlanDia pd = new TurnoPlanDia();
        pd.setPlan(p); pd.setFecha(fecha);
        if (perfilId != null) {
            TurnoPerfil per = perfilRepo.findById(perfilId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil no encontrado"));
            pd.setPerfil(per);
        }
        // libre=true: perfil null → día explícitamente libre (sin jornada)
        planDiaRepo.save(pd);
    }

    @Transactional
    public void limpiarRango(Long planId, LocalDate desde, LocalDate hasta) {
        if (!planRepo.existsById(planId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado");
        planDiaRepo.deleteByPlanIdAndFechaBetween(planId, desde, hasta);
        diaTramoRepo.deleteByPlanIdAndFechaBetween(planId, desde, hasta);
    }

    @Transactional
    public int aplicarPatronAnyos(Long planId, int anyos, int desdeAnyo) {
        TurnoPlan p = planRepo.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));
        if (anyos < 1 || anyos > 10)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "anyos fuera de rango (1-10)");
        Map<Short, TurnoPerfil> patron = new HashMap<>();
        for (var ws : p.getPatron()) patron.put(ws.getDiaSemana(), ws.getPerfil());
        if (patron.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cuadrante no tiene patrón semanal");

        LocalDate desde = LocalDate.of(desdeAnyo, 1, 1);
        LocalDate hasta = LocalDate.of(desdeAnyo + anyos - 1, 12, 31);
        // Limpia overrides existentes en el rango y los reemplaza por el patrón expandido
        planDiaRepo.deleteByPlanIdAndFechaBetween(planId, desde, hasta);

        int insertados = 0;
        LocalDate cur = desde;
        while (!cur.isAfter(hasta)) {
            short dow = (short) cur.getDayOfWeek().getValue();
            TurnoPerfil per = patron.get(dow);
            if (per != null) {
                TurnoPlanDia pd = new TurnoPlanDia();
                pd.setPlan(p); pd.setFecha(cur); pd.setPerfil(per);
                planDiaRepo.save(pd);
                insertados++;
            }
            cur = cur.plusDays(1);
        }
        return insertados;
    }

    // ── ASIGNACIÓN DE PLAN A EMPLEADO ─────────────────────────────────────

    @Transactional
    public Usuario asignarPlanEmpleado(Long usuarioId, Long planId, String departamento) {
        Usuario u = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado"));
        Empleado emp = empleadoRepo.findByUsuarioId(usuarioId).orElseGet(() -> {
            Empleado nuevo = new Empleado();
            nuevo.setUsuario(u);
            return nuevo;
        });
        if (planId != null) {
            TurnoPlan p = planRepo.findById(planId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan no encontrado"));
            emp.setTurnoPlan(p);
        } else emp.setTurnoPlan(null);
        if (departamento != null && !departamento.isBlank()) {
            String d = departamento.trim().toUpperCase();
            if (!Set.of("RECEPCION","LIMPIEZA","COCINA","MANTENIMIENTO","DIRECCION","OTRO").contains(d))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Departamento inválido");
            emp.setDepartamento(d);
        }
        empleadoRepo.save(emp);
        return u;
    }

    public Map<String, Object> resolverHorarioEmpleado(Long usuarioId, LocalDate fecha) {
        usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado"));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("fecha", fecha.toString());
        short dow = (short) fecha.getDayOfWeek().getValue();
        out.put("dia_semana", dow);

        TurnoPlan p = empleadoRepo.findByUsuarioId(usuarioId)
                .map(Empleado::getTurnoPlan).orElse(null);
        if (p == null) { out.put("slots", List.of()); return out; }

        DateTimeFormatter tf = DateTimeFormatter.ofPattern("HH:mm");

        // 1. Tramos custom tienen máxima prioridad
        var customTramos = diaTramoRepo.findByPlanIdAndFechaOrderByHoraInicio(p.getId(), fecha);
        if (!customTramos.isEmpty()) {
            out.put("slots", customTramos.stream().map(tr -> Map.<String, Object>of(
                    "from", tr.getHoraInicio().format(tf),
                    "to",   tr.getHoraFin().format(tf)
            )).collect(Collectors.toList()));
            return out;
        }

        // 2. Día explícitamente libre (perfil null en override)
        var diaOpt = p.getDias().stream().filter(d -> d.getFecha().equals(fecha)).findFirst();
        if (diaOpt.isPresent() && diaOpt.get().getPerfil() == null) {
            out.put("libre", true);
            out.put("slots", List.of());
            return out;
        }

        // 3. Override de perfil → patrón semanal → perfil por defecto
        TurnoPerfil per = diaOpt.map(TurnoPlanDia::getPerfil).orElse(null);
        if (per == null) per = p.getPatron().stream().filter(ws -> ws.getDiaSemana() == dow)
                .findFirst().map(TurnoPlanSemana::getPerfil).orElse(null);
        if (per == null) per = p.getPerfilDefault();
        if (per == null) { out.put("slots", List.of()); return out; }

        out.put("perfil_id", per.getId());
        out.put("perfil_nombre", per.getNombre());

        List<Map<String, Object>> slots = new ArrayList<>();
        for (var item : per.getItems()) {
            for (var tramo : item.getHorario().getTramos()) {
                if (tramo.getDiaSemana() == dow) {
                    slots.add(Map.of(
                            "from", tramo.getHoraInicio().format(tf),
                            "to",   tramo.getHoraFin().format(tf)
                    ));
                }
            }
        }
        slots.sort(Comparator.comparing(s -> (String) s.get("from")));
        out.put("slots", slots);
        return out;
    }

    // ── EMPLEADOS (lista filtrable por departamento) ─────────────────────

    public List<Map<String, Object>> listarEmpleados(String departamento) {
        return usuarioRepo.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> !"ROLE_CLIENTE".equals(r.getName())))
                .filter(u -> {
                    if (departamento == null || departamento.isBlank()) return true;
                    String dep = empleadoRepo.findByUsuarioId(u.getId())
                            .map(Empleado::getDepartamento).orElse(null);
                    return departamento.equalsIgnoreCase(dep);
                })
                .sorted(Comparator.comparing(u -> Optional.ofNullable(u.getNombre()).orElse(u.getEmail())))
                .map(u -> {
                    Empleado emp = empleadoRepo.findByUsuarioId(u.getId()).orElse(null);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("email", u.getEmail());
                    m.put("nombre", u.getNombre());
                    m.put("departamento", emp != null ? emp.getDepartamento() : null);
                    m.put("roles", u.getRoles().stream().map(Rol::getName).sorted().toList());
                    if (emp != null && emp.getTurnoPlan() != null) {
                        m.put("planId", emp.getTurnoPlan().getId());
                        m.put("planNombre", emp.getTurnoPlan().getNombre());
                    }
                    return m;
                }).collect(Collectors.toList());
    }

    // ── Serializadores ───────────────────────────────────────────────────

    private Map<String, Object> toRowHorario(Horario h) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", h.getId());
        m.put("nombre", h.getNombre());
        m.put("descripcion", h.getDescripcion());
        m.put("tramos", h.getTramos().stream()
                .sorted(Comparator.comparing(HorarioTramo::getDiaSemana).thenComparing(HorarioTramo::getHoraInicio))
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "dia_semana", t.getDiaSemana(),
                        "hora_inicio", t.getHoraInicio().toString(),
                        "hora_fin",    t.getHoraFin().toString()
                )).toList());
        return m;
    }

    private Map<String, Object> toRowPerfil(TurnoPerfil p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("nombre", p.getNombre());
        m.put("descripcion", p.getDescripcion());
        m.put("color", p.getColor() != null ? p.getColor() : "#c9a96e");
        m.put("horarios", p.getItems().stream().map(it -> {
            Map<String, Object> hm = new LinkedHashMap<>();
            hm.put("id", it.getHorario().getId());
            hm.put("nombre", it.getHorario().getNombre());
            return hm;
        }).toList());
        return m;
    }

    private Map<String, Object> toRowPlan(TurnoPlan p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("nombre", p.getNombre());
        m.put("descripcion", p.getDescripcion());
        if (p.getPerfilDefault() != null) {
            m.put("perfil_default_id", p.getPerfilDefault().getId());
            m.put("perfil_default_nombre", p.getPerfilDefault().getNombre());
        }
        m.put("patron_semanal", p.getPatron().stream()
                .sorted(Comparator.comparing(TurnoPlanSemana::getDiaSemana))
                .map(ws -> {
                    Map<String, Object> wm = new LinkedHashMap<>();
                    wm.put("dia", ws.getDiaSemana());
                    wm.put("perfil_id", ws.getPerfil().getId());
                    wm.put("perfil_nombre", ws.getPerfil().getNombre());
                    wm.put("perfil_color", ws.getPerfil().getColor() != null ? ws.getPerfil().getColor() : "#c9a96e");
                    return wm;
                }).toList());
        m.put("dias", p.getDias().stream()
                .sorted(Comparator.comparing(TurnoPlanDia::getFecha))
                .map(pd -> {
                    Map<String, Object> dm = new LinkedHashMap<>();
                    dm.put("id", pd.getId());
                    dm.put("fecha", pd.getFecha().toString());
                    dm.put("libre", pd.getPerfil() == null);
                    if (pd.getPerfil() != null) {
                        dm.put("perfil_id", pd.getPerfil().getId());
                        dm.put("perfil_nombre", pd.getPerfil().getNombre());
                        dm.put("perfil_color", pd.getPerfil().getColor() != null ? pd.getPerfil().getColor() : "#c9a96e");
                    }
                    return dm;
                }).toList());
        return m;
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private static String reqStr(Map<String, Object> b, String k, String err) {
        Object v = b.get(k);
        if (v == null || v.toString().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, err);
        return v.toString().trim();
    }
    private static Object reqVal(Map<String, Object> b, String k, String err) {
        Object v = b.get(k);
        if (v == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, err);
        return v;
    }
    private static String optStr(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v == null ? null : v.toString();
    }
}
