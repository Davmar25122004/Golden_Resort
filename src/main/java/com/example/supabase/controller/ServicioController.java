package com.example.supabase.controller;

import com.example.supabase.domain.Servicio;
import com.example.supabase.repository.ServicioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private final ServicioRepository servicioRepository;

    public ServicioController(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    // GET /api/servicios → lista todos los servicios (usuario autenticado)
    @GetMapping
    public List<Servicio> listar() {
        return servicioRepository.findAll();
    }

    // POST /api/servicios → crear servicio (solo ADMIN)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crear(@RequestBody Servicio servicio) {
        if (servicioRepository.existsByNombre(servicio.getNombre())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Ya existe un servicio con ese nombre");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(servicioRepository.save(servicio));
    }

    // PUT /api/servicios/{id} → actualizar servicio (solo ADMIN)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Servicio datos) {
        return servicioRepository.findById(id)
                .map(s -> {
                    s.setNombre(datos.getNombre());
                    s.setPrecio(datos.getPrecio());
                    return ResponseEntity.ok(servicioRepository.save(s));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/servicios/{id} → eliminar servicio (solo ADMIN)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!servicioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        servicioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
