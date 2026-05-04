package com.example.supabase.controller;

import com.example.supabase.dto.*;
import com.example.supabase.service.ReservaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    private String getEmail(Authentication auth) {
        if (auth instanceof OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return auth.getName();
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping
    public ResponseEntity<?> listar(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(reservaService.listarTodas());
    }

    @GetMapping("/mis-reservas")
    public ResponseEntity<?> misReservas(Authentication auth) {
        return ResponseEntity.ok(reservaService.misReservasPagadas(getEmail(auth)));
    }

    @GetMapping("/guardadas")
    public ResponseEntity<?> guardadas(Authentication auth) {
        return ResponseEntity.ok(reservaService.misReservasGuardadas(getEmail(auth)));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> porUsuario(@PathVariable Long usuarioId, Authentication auth) {
        return ResponseEntity.ok(reservaService.porUsuario(usuarioId, getEmail(auth), isAdmin(auth)));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ReservaRequest request, Authentication auth) {
        return ResponseEntity.ok(reservaService.crear(request, getEmail(auth)));
    }

    @PostMapping("/por-tipo")
    public ResponseEntity<?> crearPorTipo(@RequestBody ReservaPorTipoRequest request, Authentication auth) {
        return ResponseEntity.ok(reservaService.crearPorTipo(request, getEmail(auth)));
    }

    @PostMapping("/{id}/servicios")
    public ResponseEntity<?> agregarServicio(@PathVariable Long id,
                                             @RequestBody ServicioRequest request) {
        reservaService.agregarServicio(id, request);
        return ResponseEntity.ok(Map.of("mensaje", "Servicio agregado correctamente"));
    }

    @DeleteMapping("/{id}/servicios/{servicioId}")
    public ResponseEntity<Void> quitarServicio(@PathVariable Long id,
                                               @PathVariable Long servicioId) {
        reservaService.quitarServicio(id, servicioId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> modificar(@PathVariable Long id,
                                       @RequestBody ReservaRequest request) {
        return ResponseEntity.ok(reservaService.modificar(id, request));
    }

    @PatchMapping("/{id}/peticion")
    public ResponseEntity<?> actualizarPeticion(@PathVariable Long id,
                                                @RequestBody PeticionRequest request,
                                                Authentication auth) {
        reservaService.actualizarPeticion(id, request.peticionEspecial, getEmail(auth), isAdmin(auth));
        return ResponseEntity.ok(Map.of("mensaje", "Petición actualizada"));
    }

    @PatchMapping("/{id}/fechas")
    public ResponseEntity<?> actualizarFechas(@PathVariable Long id,
                                              @RequestBody java.util.Map<String, String> body,
                                              Authentication auth) {
        reservaService.actualizarFechas(id, body.get("fechaEntrada"), body.get("fechaSalida"), getEmail(auth), isAdmin(auth));
        return ResponseEntity.ok(java.util.Map.of("mensaje", "Fechas actualizadas"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelar(@PathVariable Long id, Authentication auth) {
        reservaService.cancelar(id, getEmail(auth), isAdmin(auth));
        return ResponseEntity.noContent().build();
    }
}
