package com.example.supabase.controller;

import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Habitacion.TipoHabitacion;
import com.example.supabase.domain.Reserva;
import com.example.supabase.repository.HabitacionRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.ReservaServicioRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/habitaciones")
public class HabitacionController {

    private final HabitacionRepository habitacionRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaServicioRepository reservaServicioRepository;

    public HabitacionController(HabitacionRepository habitacionRepository,
                                ReservaRepository reservaRepository,
                                ReservaServicioRepository reservaServicioRepository) {
        this.habitacionRepository = habitacionRepository;
        this.reservaRepository = reservaRepository;
        this.reservaServicioRepository = reservaServicioRepository;
    }

    // GET /api/habitaciones → todas las habitaciones (público)
    @GetMapping
    public List<Habitacion> listar() {
        return habitacionRepository.findAll();
    }

    // GET /api/habitaciones/1 → una habitacion por id
    @GetMapping("/{id}")
    public ResponseEntity<Habitacion> buscarPorId(@PathVariable Long id) {
        return habitacionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/habitaciones/tipo/SUITE → habitaciones por tipo
    @GetMapping("/tipo/{tipo}")
    public List<Habitacion> buscarPorTipo(@PathVariable TipoHabitacion tipo) {
        return habitacionRepository.findByTipo(tipo);
    }

    // GET /api/habitaciones/disponibles?fechaEntrada=X&fechaSalida=Y
    @GetMapping("/disponibles")
    public ResponseEntity<?> getDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaEntrada,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaSalida) {

        if (!fechaEntrada.isBefore(fechaSalida)) {
            return ResponseEntity.badRequest().body("fechaEntrada debe ser anterior a fechaSalida");
        }

        Map<String, Long> disponibilidad = new LinkedHashMap<>();
        for (TipoHabitacion tipo : TipoHabitacion.values()) {
            long count = habitacionRepository.countAvailableByTipo(tipo, fechaEntrada, fechaSalida);
            disponibilidad.put(tipo.name(), count);
        }

        return ResponseEntity.ok(disponibilidad);
    }

    // POST /api/habitaciones → crear habitación (solo ADMIN)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crear(@RequestBody Habitacion habitacion) {
        if (habitacion.getNumero() != null && habitacionRepository.existsByNumero(habitacion.getNumero())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Ya existe una habitación con ese número");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(habitacionRepository.save(habitacion));
    }

    // PUT /api/habitaciones/{id} → actualizar habitación (solo ADMIN)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Habitacion datos) {
        return habitacionRepository.findById(id)
                .map(h -> {
                    if (datos.getNumero() != null) h.setNumero(datos.getNumero());
                    if (datos.getTipo() != null) h.setTipo(datos.getTipo());
                    if (datos.getPrecioNoche() != null) h.setPrecioNoche(datos.getPrecioNoche());
                    h.setDescripcion(datos.getDescripcion());
                    return ResponseEntity.ok(habitacionRepository.save(h));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/habitaciones/tipo/{tipo} → actualiza precio y descripción de TODAS las hab. de ese tipo (solo ADMIN)
    @PutMapping("/tipo/{tipo}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> actualizarPorTipo(@PathVariable TipoHabitacion tipo,
                                                @RequestBody Map<String, Object> datos) {
        List<Habitacion> habitaciones = habitacionRepository.findByTipo(tipo);
        if (habitaciones.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        habitaciones.forEach(h -> {
            if (datos.get("precioNoche") != null) {
                h.setPrecioNoche(new java.math.BigDecimal(datos.get("precioNoche").toString()));
            }
            if (datos.containsKey("descripcion")) {
                h.setDescripcion(datos.get("descripcion") != null ? datos.get("descripcion").toString() : null);
            }
        });
        habitacionRepository.saveAll(habitaciones);
        return ResponseEntity.ok(Map.of(
                "tipo",       tipo.name(),
                "actualizadas", habitaciones.size()
        ));
    }

    // DELETE /api/habitaciones/{id} → eliminar habitación y sus reservas en cascada (solo ADMIN)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return habitacionRepository.findById(id)
                .map(h -> {
                    List<Reserva> reservas = reservaRepository.findByHabitacion(h);
                    for (Reserva r : reservas) {
                        reservaServicioRepository.deleteByReservaId(r.getId());
                    }
                    reservaRepository.deleteAll(reservas);
                    habitacionRepository.delete(h);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
