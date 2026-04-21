package com.example.supabase.controller;

import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Habitacion.TipoHabitacion;
import com.example.supabase.service.HabitacionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/habitaciones")
public class HabitacionController {

    private final HabitacionService habitacionService;

    public HabitacionController(HabitacionService habitacionService) {
        this.habitacionService = habitacionService;
    }

    @GetMapping
    public List<Habitacion> listar() {
        return habitacionService.listar();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Habitacion> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(habitacionService.buscarPorId(id));
    }

    @GetMapping("/tipo/{tipo}")
    public List<Habitacion> buscarPorTipo(@PathVariable TipoHabitacion tipo) {
        return habitacionService.buscarPorTipo(tipo);
    }

    @GetMapping("/disponibles")
    public ResponseEntity<?> getDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaEntrada,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaSalida) {
        return ResponseEntity.ok(habitacionService.getDisponibles(fechaEntrada, fechaSalida));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crear(@RequestBody Habitacion habitacion) {
        return ResponseEntity.status(HttpStatus.CREATED).body(habitacionService.crear(habitacion));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Habitacion datos) {
        return ResponseEntity.ok(habitacionService.actualizar(id, datos));
    }

    @PutMapping("/tipo/{tipo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizarPorTipo(@PathVariable TipoHabitacion tipo,
                                                @RequestBody Map<String, Object> datos) {
        return ResponseEntity.ok(habitacionService.actualizarPorTipo(tipo, datos));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        habitacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
