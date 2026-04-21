package com.example.supabase.controller;

import com.example.supabase.domain.PedidoRoomService;
import com.example.supabase.domain.RoomServiceItem;
import com.example.supabase.dto.PedidoRequest;
import com.example.supabase.service.RoomServiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room-service")
public class RoomServiceController {

    private final RoomServiceService roomServiceService;

    public RoomServiceController(RoomServiceService roomServiceService) {
        this.roomServiceService = roomServiceService;
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

    // ── Carta (ítems) ─────────────────────────────────────────────────────────

    @GetMapping("/items")
    public List<RoomServiceItem> listarItems() {
        return roomServiceService.listarItems();
    }

    @PostMapping("/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoomServiceItem> crearItem(@RequestBody RoomServiceItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomServiceService.crearItem(item));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoomServiceItem> actualizarItem(@PathVariable Long id,
                                                           @RequestBody RoomServiceItem datos) {
        return ResponseEntity.ok(roomServiceService.actualizarItem(id, datos));
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> eliminarItem(@PathVariable Long id) {
        roomServiceService.eliminarItem(id);
        return ResponseEntity.noContent().build();
    }

    // ── Pedidos ───────────────────────────────────────────────────────────────

    @GetMapping("/pedidos/{reservaId}")
    public ResponseEntity<?> listarPedido(@PathVariable Long reservaId, Authentication auth) {
        if (!puedeAcceder(reservaId, auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(roomServiceService.listarPedido(reservaId));
    }

    @PostMapping("/pedidos/{reservaId}")
    public ResponseEntity<?> añadirItem(@PathVariable Long reservaId,
                                         @RequestBody PedidoRequest request,
                                         Authentication auth) {
        if (!puedeAcceder(reservaId, auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomServiceService.añadirItem(reservaId, request));
    }

    @PutMapping("/pedidos/{pedidoId}")
    public ResponseEntity<?> actualizarCantidad(@PathVariable Long pedidoId,
                                                  @RequestBody PedidoRequest request,
                                                  Authentication auth) {
        Long reservaId = roomServiceService.getReservaIdDePedido(pedidoId);
        if (!puedeAcceder(reservaId, auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(roomServiceService.actualizarCantidad(pedidoId, request));
    }

    @DeleteMapping("/pedidos/{pedidoId}")
    public ResponseEntity<Void> eliminarLinea(@PathVariable Long pedidoId, Authentication auth) {
        Long reservaId = roomServiceService.getReservaIdDePedido(pedidoId);
        if (!puedeAcceder(reservaId, auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        roomServiceService.eliminarLinea(pedidoId);
        return ResponseEntity.noContent().build();
    }

    // ── Helper de autorización ────────────────────────────────────────────────

    private boolean puedeAcceder(Long reservaId, Authentication auth) {
        if (isAdmin(auth)) return true;
        // Verificamos que la reserva pertenezca al usuario autenticado
        // Reutilizamos el método del service que ya carga la reserva
        try {
            // Si el service lanzara excepción aquí sería un NOT_FOUND, lo dejamos pasar
            String email = getEmail(auth);
            // Necesitamos conocer el email del dueño de la reserva:
            // lo hacemos via listarPedido que ya valida existencia
            // La verificación real se hace comparando directamente en el service
            // Para no duplicar lógica, delegamos en el service a través de una llamada auxiliar
            return roomServiceService.perteneceAlUsuario(reservaId, email);
        } catch (Exception e) {
            return false;
        }
    }
}
