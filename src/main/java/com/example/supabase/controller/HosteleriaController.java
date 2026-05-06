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
public class HosteleriaController {

    private static final Set<String> SERVICIOS_HOSTELERIA =
        Set.of("Desayuno Premium", "Cena Gourmet");

    private final ReservaRepository reservaRepository;

    public HosteleriaController(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    @GetMapping("/hosteleria")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSTELERIA')")
    public String hosteleria() { return "redirect:/hosteleria/calendario"; }

    @GetMapping("/hosteleria/calendario")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSTELERIA')")
    public String calendario() { return "hosteleria-calendario"; }

    @GetMapping("/hosteleria/objetos-perdidos")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSTELERIA')")
    public String objetosPerdidos() { return "hosteleria-objetos"; }

    @GetMapping("/api/hosteleria/calendario")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSTELERIA')")
    public ResponseEntity<?> calendarioApi(@RequestParam String from, @RequestParam String to) {
        LocalDate desde = LocalDate.parse(from);
        LocalDate hasta = LocalDate.parse(to);

        List<Reserva> reservas = reservaRepository.findSolapanRango(desde, hasta);

        List<Map<String, Object>> dias = desde.datesUntil(hasta.plusDays(1))
            .map(dia -> {
                List<Reserva> activas = reservas.stream()
                    .filter(r -> !r.getFechaEntrada().isAfter(dia) && r.getFechaSalida().isAfter(dia) && r.getCheckoutEn() == null)
                    .collect(Collectors.toList());
                if (activas.isEmpty()) return null;

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("fecha",       dia.toString());
                m.put("reservas",    activas.size());
                m.put("checkIn",     activas.stream().anyMatch(r -> r.getFechaEntrada().isEqual(dia)));
                m.put("checkOut",    activas.stream().anyMatch(r -> r.getFechaSalida().isEqual(dia)));
                m.put("conDesayuno", activas.stream().anyMatch(r ->
                    r.getServicios() != null && r.getServicios().stream()
                        .anyMatch(s -> "Desayuno Premium".equals(s.getServicio().getNombre()))));
                m.put("conCena",     activas.stream().anyMatch(r ->
                    r.getServicios() != null && r.getServicios().stream()
                        .anyMatch(s -> "Cena Gourmet".equals(s.getServicio().getNombre()))));
                m.put("conHosteleria", activas.stream().anyMatch(r ->
                    r.getServicios() != null && r.getServicios().stream()
                        .anyMatch(s -> SERVICIOS_HOSTELERIA.contains(s.getServicio().getNombre()))));
                return m;
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return ResponseEntity.ok(dias);
    }

    @GetMapping("/api/hosteleria/calendario/dia")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSTELERIA')")
    public ResponseEntity<?> calendarioDia(@RequestParam String fecha) {
        LocalDate dia = LocalDate.parse(fecha);
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
            boolean tieneDesayuno = false;
            boolean tieneCena = false;
            if (r.getServicios() != null) {
                for (var s : r.getServicios()) {
                    Map<String, Object> sm = new LinkedHashMap<>();
                    String nombre = s.getServicio().getNombre();
                    sm.put("nombre",     nombre);
                    sm.put("cantidad",   s.getCantidad());
                    sm.put("hora",       s.getHora() != null ? s.getHora().toString() : null);
                    sm.put("esDesayuno", "Desayuno Premium".equals(nombre));
                    sm.put("esCena",     "Cena Gourmet".equals(nombre));
                    sm.put("esHosteleria", SERVICIOS_HOSTELERIA.contains(nombre));
                    servicios.add(sm);
                    if ("Desayuno Premium".equals(nombre)) tieneDesayuno = true;
                    if ("Cena Gourmet".equals(nombre))     tieneCena     = true;
                }
            }
            m.put("servicios",     servicios);
            m.put("conDesayuno",   tieneDesayuno);
            m.put("conCena",       tieneCena);
            m.put("conHosteleria", tieneDesayuno || tieneCena);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
