package com.example.supabase.controller;

import com.example.supabase.dto.*;
import com.example.supabase.service.RateLimitService;
import com.example.supabase.service.ReservaService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final RateLimitService rateLimitService;

    public ReservaController(ReservaService reservaService, RateLimitService rateLimitService) {
        this.reservaService  = reservaService;
        this.rateLimitService = rateLimitService;
    }

    private String obtenerEmail(Authentication auth) {
        if (auth instanceof OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return auth.getName();
    }

    private boolean esAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private static final java.util.Set<String> ROLES_STAFF = java.util.Set.of(
        "ROLE_ADMIN", "ROLE_RECEPCION", "ROLE_LIMPIEZA",
        "ROLE_GIMNASIO", "ROLE_SPA", "ROLE_COCHE",
        "ROLE_HOSTELERIA", "ROLE_ROOMSERVICE"
    );

    /** Solo clientes (sin rol de staff) pueden crear reservas. */
    private boolean puedeReservar(Authentication auth) {
        return auth != null && auth.isAuthenticated() &&
            auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .noneMatch(ROLES_STAFF::contains);
    }

    @GetMapping
    public ResponseEntity<?> listar(Authentication auth) {
        if (!esAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(reservaService.listarTodas());
    }

    @GetMapping("/mis-reservas")
    public ResponseEntity<?> misReservas(Authentication auth) {
        return ResponseEntity.ok(reservaService.misReservasPagadas(obtenerEmail(auth)));
    }

    @GetMapping("/guardadas")
    public ResponseEntity<?> guardadas(Authentication auth) {
        return ResponseEntity.ok(reservaService.misReservasGuardadas(obtenerEmail(auth)));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> porUsuario(@PathVariable Long usuarioId, Authentication auth) {
        return ResponseEntity.ok(reservaService.porUsuario(usuarioId, obtenerEmail(auth), esAdmin(auth)));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ReservaRequest request, Authentication auth,
                                   HttpServletRequest httpRequest) {
        if (!rateLimitService.bucketReserva(httpRequest.getRemoteAddr()).tryConsume(1))
            return ResponseEntity.status(429).body("Demasiadas reservas en poco tiempo. Espera un momento.");
        if (!puedeReservar(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Solo los clientes pueden hacer reservas. Tu cuenta es de personal del hotel.");
        }
        return ResponseEntity.ok(reservaService.crear(request, obtenerEmail(auth)));
    }

    @PostMapping("/por-tipo")
    public ResponseEntity<?> crearPorTipo(@RequestBody ReservaPorTipoRequest request, Authentication auth,
                                          HttpServletRequest httpRequest) {
        if (!rateLimitService.bucketReserva(httpRequest.getRemoteAddr()).tryConsume(1))
            return ResponseEntity.status(429).body("Demasiadas reservas en poco tiempo. Espera un momento.");
        if (!puedeReservar(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Solo los clientes pueden hacer reservas. Tu cuenta es de personal del hotel.");
        }
        return ResponseEntity.ok(reservaService.crearPorTipo(request, obtenerEmail(auth)));
    }

    @PostMapping("/{id}/servicios")
    public ResponseEntity<?> agregarServicio(@PathVariable Long id,
                                             @RequestBody ServicioRequest request,
                                             Authentication auth) {
        reservaService.agregarServicio(id, request, obtenerEmail(auth), esAdmin(auth));
        return ResponseEntity.ok(Map.of("mensaje", "Servicio agregado correctamente"));
    }

    @DeleteMapping("/{id}/servicios/{servicioId}")
    public ResponseEntity<Void> quitarServicio(@PathVariable Long id,
                                               @PathVariable Long servicioId,
                                               Authentication auth) {
        reservaService.quitarServicio(id, servicioId, obtenerEmail(auth), esAdmin(auth));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> modificar(@PathVariable Long id,
                                       @RequestBody ReservaRequest request) {
        reservaService.modificar(id, request);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PatchMapping("/{id}/peticion")
    public ResponseEntity<?> actualizarPeticion(@PathVariable Long id,
                                                @RequestBody PeticionRequest request,
                                                Authentication auth) {
        reservaService.actualizarPeticion(id, request.peticionEspecial, obtenerEmail(auth), esAdmin(auth));
        return ResponseEntity.ok(Map.of("mensaje", "Petición actualizada"));
    }

    @PatchMapping("/{id}/fechas")
    public ResponseEntity<?> actualizarFechas(@PathVariable Long id,
                                              @RequestBody java.util.Map<String, String> body,
                                              Authentication auth) {
        reservaService.actualizarFechas(id, body.get("fechaEntrada"), body.get("fechaSalida"), obtenerEmail(auth), esAdmin(auth));
        return ResponseEntity.ok(java.util.Map.of("mensaje", "Fechas actualizadas"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelar(@PathVariable Long id, Authentication auth) {
        reservaService.cancelar(id, obtenerEmail(auth), esAdmin(auth));
        return ResponseEntity.noContent().build();
    }
}
