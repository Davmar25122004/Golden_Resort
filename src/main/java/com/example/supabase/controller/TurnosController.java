package com.example.supabase.controller;

import com.example.supabase.service.TurnosService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('ADMIN')")
public class TurnosController {

    private final TurnosService service;

    public TurnosController(TurnosService service) { this.service = service; }

    // ── Horarios ────────────────────────────────────────────────────────────
    @GetMapping("/horarios")            public List<Map<String,Object>> listarHorarios()            { return service.listarHorarios(); }
    @GetMapping("/horarios/{id}")       public Map<String,Object>       obtenerHorario(@PathVariable Long id) { return service.detalleHorario(id); }
    @PostMapping("/horarios")           public Map<String,Object>       crearHorario(@RequestBody Map<String,Object> body) { return service.detalleHorario(service.crearHorario(body).getId()); }
    @PutMapping("/horarios/{id}")       public Map<String,Object>       actualizarHorario(@PathVariable Long id, @RequestBody Map<String,Object> body) { return service.detalleHorario(service.actualizarHorario(id, body).getId()); }
    @DeleteMapping("/horarios/{id}")    public ResponseEntity<?>        eliminarHorario(@PathVariable Long id) {
        try { service.borrarHorario(id); return ResponseEntity.noContent().build(); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    // ── Perfiles (tipos de jornada) ────────────────────────────────────────
    @GetMapping("/perfiles-turno")           public List<Map<String,Object>> listarPerfiles()            { return service.listarPerfiles(); }
    @GetMapping("/perfiles-turno/{id}")      public Map<String,Object>       obtenerPerfil(@PathVariable Long id) { return service.detallePerfil(id); }
    @PostMapping("/perfiles-turno")          public Map<String,Object>       crearPerfil(@RequestBody Map<String,Object> body) { return service.detallePerfil(service.crearPerfil(body).getId()); }
    @PutMapping("/perfiles-turno/{id}")      public Map<String,Object>       actualizarPerfil(@PathVariable Long id, @RequestBody Map<String,Object> body) { return service.detallePerfil(service.actualizarPerfil(id, body).getId()); }
    @DeleteMapping("/perfiles-turno/{id}")   public ResponseEntity<?>        eliminarPerfil(@PathVariable Long id) {
        try { service.borrarPerfil(id); return ResponseEntity.noContent().build(); }
        catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    // ── Planes (cuadrantes) ────────────────────────────────────────────────
    @GetMapping("/planes-turno")             public List<Map<String,Object>> listarPlanes()           { return service.listarPlanes(); }
    @GetMapping("/planes-turno/{id}")        public Map<String,Object>       obtenerPlan(@PathVariable Long id) { return service.detallePlan(id); }
    @PostMapping("/planes-turno")            public Map<String,Object>       crearPlan(@RequestBody Map<String,Object> body) { return service.detallePlan(service.crearPlan(body).getId()); }
    @PutMapping("/planes-turno/{id}")        public Map<String,Object>       actualizarPlan(@PathVariable Long id, @RequestBody Map<String,Object> body) { return service.detallePlan(service.actualizarPlan(id, body).getId()); }
    @DeleteMapping("/planes-turno/{id}")     public ResponseEntity<?>        eliminarPlan(@PathVariable Long id) { service.borrarPlan(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/planes-turno/{id}/calendario")
    public List<Map<String, Object>> calendarioPlan(@PathVariable Long id,
                                                  @RequestParam("from") String from,
                                                  @RequestParam("to") String to) {
        return service.calendarioPlan(id, LocalDate.parse(from), LocalDate.parse(to));
    }

    @PostMapping("/planes-turno/{id}/overrides/bulk")
    public ResponseEntity<?> sobrescribirMasivo(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            service.aplicarBulkOverride(id, body);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @GetMapping("/planes-turno/{id}/dia/{fecha}/tramos")
    public List<Map<String, Object>> obtenerTramosDia(@PathVariable Long id, @PathVariable String fecha) {
        return service.getTramosDia(id, LocalDate.parse(fecha));
    }

    @PutMapping("/planes-turno/{id}/dia/{fecha}/tramos")
    public ResponseEntity<?> establecerTramosDia(@PathVariable Long id, @PathVariable String fecha,
                                          @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            var tramos = (java.util.List<Map<String, Object>>) body.get("tramos");
            service.setTramosDia(id, LocalDate.parse(fecha), tramos);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @DeleteMapping("/planes-turno/{id}/calendario")
    public ResponseEntity<?> limpiarRango(@PathVariable Long id,
                                          @RequestParam(value = "year", required = false) Integer year,
                                          @RequestParam(value = "month", required = false) Integer month,
                                          @RequestParam(value = "from", required = false) String from,
                                          @RequestParam(value = "to", required = false) String to,
                                          @RequestParam(value = "patron", required = false, defaultValue = "false") boolean borrarPatron) {
        try {
            LocalDate desde, hasta;
            if (from != null && to != null) {
                desde = LocalDate.parse(from); hasta = LocalDate.parse(to);
            } else if (year != null && month != null) {
                desde = LocalDate.of(year, month, 1);
                hasta = desde.withDayOfMonth(desde.lengthOfMonth());
            } else if (year != null) {
                desde = LocalDate.of(year, 1, 1);
                hasta = LocalDate.of(year, 12, 31);
            } else {
                return ResponseEntity.badRequest().body("Especifica year (+month opcional) o from+to");
            }
            service.limpiarRango(id, desde, hasta, borrarPatron);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @PostMapping("/planes-turno/{id}/aplicar-patron")
    public ResponseEntity<?> aplicarPatron(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            int anyos = body.get("anyos") instanceof Number n ? n.intValue() : 1;
            int desdeAnyo = body.get("desde_anyo") instanceof Number n2 ? n2.intValue() : LocalDate.now().getYear();
            int insertados = service.aplicarPatronAnyos(id, anyos, desdeAnyo);
            return ResponseEntity.ok(Map.of("ok", true, "insertados", insertados));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @PutMapping("/planes-turno/{id}/dia/{fecha}/perfil")
    public ResponseEntity<?> setDiaPerfil(@PathVariable Long id, @PathVariable String fecha,
                                          @RequestBody Map<String, Object> body) {
        try {
            Object raw = body.get("perfil_id");
            Long perfilId = raw instanceof Number n ? n.longValue() : null;
            boolean libre = Boolean.TRUE.equals(body.get("libre"));
            service.setPerfilDia(id, LocalDate.parse(fecha), perfilId, libre);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    // ── Empleados ──────────────────────────────────────────────────────────
    @GetMapping("/empleados")
    public List<Map<String, Object>> empleados(@RequestParam(value = "departamento", required = false) String dept) {
        return service.listarEmpleados(dept);
    }

    @PutMapping("/empleados/{id}/plan")
    public ResponseEntity<?> asignarPlan(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long planId = body.get("plan_id") instanceof Number n ? n.longValue() : null;
        String dept = body.get("departamento") != null ? body.get("departamento").toString() : null;
        try {
            service.asignarPlanEmpleado(id, planId, dept);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @DeleteMapping("/empleados/{id}/plan")
    public ResponseEntity<?> quitarPlan(@PathVariable Long id) {
        service.asignarPlanEmpleado(id, null, null);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/empleados/{id}/horario")
    public Map<String, Object> horarioEmpleado(@PathVariable Long id, @RequestParam("date") String date) {
        return service.resolverHorarioEmpleado(id, LocalDate.parse(date));
    }
}
