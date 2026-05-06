package com.example.supabase.controller;

import com.example.supabase.domain.Reserva;
import com.example.supabase.repository.ReservaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Controller
public class CocheController {

    private static final String SERVICIO_COCHE = "Servicio de Coche Privado";

    private final ReservaRepository reservaRepository;

    public CocheController(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    @GetMapping("/coche")
    @PreAuthorize("hasAnyRole('ADMIN', 'COCHE')")
    public String coche() { return "redirect:/coche/calendario"; }

    @GetMapping("/coche/calendario")
    @PreAuthorize("hasAnyRole('ADMIN', 'COCHE')")
    public String calendario() { return "coche-calendario"; }

    @GetMapping("/coche/rutas")
    @PreAuthorize("hasAnyRole('ADMIN', 'COCHE')")
    public String rutas() { return "coche-rutas"; }

    @GetMapping("/coche/objetos-perdidos")
    @PreAuthorize("hasAnyRole('ADMIN', 'COCHE')")
    public String objetosPerdidos() { return "coche-objetos"; }

    @GetMapping("/api/coche/calendario")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN', 'COCHE')")
    public ResponseEntity<?> calendarioApi(@RequestParam String from, @RequestParam String to) {
        LocalDate desde, hasta;
        try {
            desde = LocalDate.parse(from);
            hasta = LocalDate.parse(to);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Formato de fecha inválido. Use AAAA-MM-DD.");
        }
        if (!desde.isBefore(hasta))
            return ResponseEntity.badRequest().body("La fecha 'from' debe ser anterior a 'to'.");

        List<Reserva> reservas = reservaRepository.findSolapanRango(desde, hasta);

        List<Map<String, Object>> dias = desde.datesUntil(hasta.plusDays(1))
            .map(dia -> {
                List<Reserva> activas = reservas.stream()
                    .filter(r -> !r.getFechaEntrada().isAfter(dia) && r.getFechaSalida().isAfter(dia) && r.getCheckoutEn() == null)
                    .collect(Collectors.toList());
                if (activas.isEmpty()) return null;

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("fecha",    dia.toString());
                m.put("reservas", activas.size());
                m.put("checkIn",  activas.stream().anyMatch(r -> r.getFechaEntrada().isEqual(dia)));
                m.put("checkOut", activas.stream().anyMatch(r -> r.getFechaSalida().isEqual(dia)));
                m.put("conCoche", activas.stream().anyMatch(r ->
                    r.getServicios() != null && r.getServicios().stream()
                        .anyMatch(s -> SERVICIO_COCHE.equals(s.getServicio().getNombre()))));
                return m;
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return ResponseEntity.ok(dias);
    }

    @GetMapping("/api/coche/calendario/dia")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN', 'COCHE')")
    public ResponseEntity<?> calendarioDia(@RequestParam String fecha) {
        LocalDate dia;
        try {
            dia = LocalDate.parse(fecha);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Formato de fecha inválido. Use AAAA-MM-DD.");
        }
        List<Reserva> activas = reservaRepository.findSolapanRango(dia, dia.plusDays(1)).stream()
            .filter(r -> !r.getFechaEntrada().isAfter(dia) && r.getFechaSalida().isAfter(dia) && r.getCheckoutEn() == null)
            .collect(Collectors.toList());

        List<Map<String, Object>> result = activas.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",               r.getId());
            m.put("clienteNombre",    r.getUsuario().getNombre());
            m.put("clienteEmail",     r.getUsuario().getEmail());
            m.put("habitacionNumero", r.getHabitacion().getNumero());
            m.put("habitacionTipo",   r.getHabitacion().getTipo().name());
            m.put("fechaEntrada",     r.getFechaEntrada().toString());
            m.put("fechaSalida",      r.getFechaSalida().toString());
            m.put("peticionEspecial", r.getPeticionEspecial());
            m.put("checkIn",          r.getFechaEntrada().isEqual(dia));

            List<Map<String, Object>> servicios = new ArrayList<>();
            if (r.getServicios() != null) {
                r.getServicios().forEach(s -> {
                    Map<String, Object> sm = new LinkedHashMap<>();
                    sm.put("nombre",    s.getServicio().getNombre());
                    sm.put("cantidad",  s.getCantidad());
                    sm.put("hora",      s.getHora() != null ? s.getHora().toString() : null);
                    sm.put("esCoche",   SERVICIO_COCHE.equals(s.getServicio().getNombre()));
                    sm.put("ubicacion", s.getUbicacion());
                    servicios.add(sm);
                });
            }
            m.put("servicios", servicios);
            m.put("conCoche",  servicios.stream().anyMatch(s -> Boolean.TRUE.equals(s.get("esCoche"))));
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
