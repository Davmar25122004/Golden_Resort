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
public class GimnasioController {

    private final ReservaRepository reservaRepository;

    public GimnasioController(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    @GetMapping("/gimnasio")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIMNASIO')")
    public String gimnasio() {
        return "redirect:/gimnasio/calendario";
    }

    @GetMapping("/gimnasio/calendario")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIMNASIO')")
    public String calendario() {
        return "gimnasio-calendario";
    }

    @GetMapping("/gimnasio/objetos-perdidos")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIMNASIO')")
    public String objetosPerdidos() {
        return "gimnasio-objetos";
    }

    @GetMapping("/api/gimnasio/calendario")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN', 'GIMNASIO')")
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
                m.put("conGimnasio", activas.stream().anyMatch(r ->
                    r.getServicios() != null && r.getServicios().stream()
                        .anyMatch(s -> "Gimnasio 24h".equals(s.getServicio().getNombre()))));
                return m;
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return ResponseEntity.ok(dias);
    }

    @GetMapping("/api/gimnasio/calendario/dia")
    @ResponseBody
    @PreAuthorize("hasAnyRole('ADMIN', 'GIMNASIO')")
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
            if (r.getServicios() != null) {
                r.getServicios().forEach(s -> {
                    Map<String, Object> sm = new LinkedHashMap<>();
                    sm.put("nombre",     s.getServicio().getNombre());
                    sm.put("cantidad",   s.getCantidad());
                    sm.put("esGimnasio", "Gimnasio 24h".equals(s.getServicio().getNombre()));
                    servicios.add(sm);
                });
            }
            m.put("servicios",    servicios);
            m.put("conGimnasio",  servicios.stream().anyMatch(s -> Boolean.TRUE.equals(s.get("esGimnasio"))));
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
