package com.example.supabase.controller;

import com.example.supabase.domain.PedidoRoomService;
import com.example.supabase.domain.Reserva;
import com.example.supabase.domain.RoomServiceItem;
import com.example.supabase.repository.PedidoRoomServiceRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.RoomServiceItemRepository;
import com.example.supabase.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;

@RestController
@RequestMapping("/api/room-service")
public class RoomServiceController {

    private final RoomServiceItemRepository itemRepository;
    private final PedidoRoomServiceRepository pedidoRepository;
    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;

    public RoomServiceController(RoomServiceItemRepository itemRepository,
                                  PedidoRoomServiceRepository pedidoRepository,
                                  ReservaRepository reservaRepository,
                                  UsuarioRepository usuarioRepository) {
        this.itemRepository    = itemRepository;
        this.pedidoRepository  = pedidoRepository;
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // ── CARTA (ítems) ──────────────────────────────────────────────────────────

    // GET /api/room-service/items → carta completa (autenticado)
    @GetMapping("/items")
    public List<RoomServiceItem> listarItems() {
        return itemRepository.findAll();
    }

    // POST /api/room-service/items → crear ítem (solo ADMIN)
    @PostMapping("/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoomServiceItem> crearItem(@RequestBody RoomServiceItem item) {
        item.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(itemRepository.save(item));
    }

    // PUT /api/room-service/items/{id} → actualizar ítem (solo ADMIN)
    @PutMapping("/items/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoomServiceItem> actualizarItem(@PathVariable Long id,
                                                           @RequestBody RoomServiceItem datos) {
        return itemRepository.findById(id)
                .map(item -> {
                    item.setNombre(datos.getNombre());
                    item.setDescripcion(datos.getDescripcion());
                    item.setPrecio(datos.getPrecio());
                    item.setCategoria(datos.getCategoria());
                    item.setDisponible(datos.getDisponible());
                    item.setImagenUrl(datos.getImagenUrl());
                    return ResponseEntity.ok(itemRepository.save(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/room-service/items/{id} → eliminar ítem (solo ADMIN)
    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> eliminarItem(@PathVariable Long id) {
        if (!itemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // 1. Limpiar pedidos que usen este ítem para que el total de la reserva se recalcule bien
        pedidoRepository.deleteByItemId(id);
        
        // 2. Borrar el ítem de la carta
        itemRepository.deleteById(id);
        
        return ResponseEntity.noContent().build();
    }

    // ── PEDIDOS ────────────────────────────────────────────────────────────────

    // GET /api/room-service/pedidos/{reservaId} → pedido de una reserva
    @GetMapping("/pedidos/{reservaId}")
    public ResponseEntity<?> listarPedido(@PathVariable Long reservaId,
                                           Authentication authentication) {
        if (!reservaRepository.existsById(reservaId)) {
            return ResponseEntity.notFound().build();
        }
        if (!puedeAccederReserva(reservaId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<PedidoDTO> dtos = pedidoRepository.findByReservaId(reservaId).stream()
                .map(p -> new PedidoDTO(
                        p.getId(),
                        p.getItem().getId(),
                        p.getItem().getNombre(),
                        p.getItem().getCategoria().name(),
                        p.getItem().getPrecio(),
                        p.getCantidad(),
                        p.getItem().getPrecio().multiply(BigDecimal.valueOf(p.getCantidad()))
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // POST /api/room-service/pedidos/{reservaId} → añadir ítem al pedido
    @PostMapping("/pedidos/{reservaId}")
    public ResponseEntity<?> añadirItem(@PathVariable Long reservaId,
                                         @RequestBody PedidoRequest request,
                                         Authentication authentication) {
        Reserva reserva = reservaRepository.findById(reservaId).orElse(null);
        if (reserva == null) return ResponseEntity.notFound().build();

        if (!puedeAccederReserva(reservaId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        RoomServiceItem item = itemRepository.findById(request.itemId).orElse(null);
        if (item == null) return ResponseEntity.notFound().build();

        PedidoRoomService pedido = new PedidoRoomService();
        pedido.setReserva(reserva);
        pedido.setItem(item);
        pedido.setCantidad(request.cantidad);
        pedido.setFechaPedido(LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoRepository.save(pedido));
    }

    // PUT /api/room-service/pedidos/{pedidoId} → actualizar cantidad
    @PutMapping("/pedidos/{pedidoId}")
    public ResponseEntity<?> actualizarCantidad(@PathVariable Long pedidoId,
                                                  @RequestBody PedidoRequest request,
                                                  Authentication authentication) {
        PedidoRoomService pedido = pedidoRepository.findById(pedidoId).orElse(null);
        if (pedido == null) return ResponseEntity.notFound().build();

        if (!puedeAccederReserva(pedido.getReserva().getId(), authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        pedido.setCantidad(request.cantidad);
        return ResponseEntity.ok(pedidoRepository.save(pedido));
    }

    // DELETE /api/room-service/pedidos/{pedidoId} → eliminar línea
    @DeleteMapping("/pedidos/{pedidoId}")
    @Transactional
    public ResponseEntity<Void> eliminarLinea(@PathVariable Long pedidoId,
                                               Authentication authentication) {
        PedidoRoomService pedido = pedidoRepository.findById(pedidoId).orElse(null);
        if (pedido == null) return ResponseEntity.notFound().build();

        if (!puedeAccederReserva(pedido.getReserva().getId(), authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        pedidoRepository.deleteById(pedidoId);
        return ResponseEntity.noContent().build();
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private String getEmail(Authentication authentication) {
        if (authentication instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken token) {
            return (String) token.getPrincipal().getAttributes().get("email");
        }
        return authentication.getName();
    }

    private boolean puedeAccederReserva(Long reservaId, Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return true;
        String email = getEmail(auth);
        return reservaRepository.findById(reservaId)
                .map(r -> r.getUsuario().getEmail().equals(email))
                .orElse(false);
    }

    // ── DTOs y Request bodies ─────────────────────────────────────────────────

    static class PedidoDTO {
        public Long pedidoId;
        public Long itemId;
        public String nombre;
        public String categoria;
        public BigDecimal precioUnitario;
        public Integer cantidad;
        public BigDecimal subtotal;

        PedidoDTO(Long pedidoId, Long itemId, String nombre, String categoria,
                  BigDecimal precioUnitario, Integer cantidad, BigDecimal subtotal) {
            this.pedidoId      = pedidoId;
            this.itemId        = itemId;
            this.nombre        = nombre;
            this.categoria     = categoria;
            this.precioUnitario = precioUnitario;
            this.cantidad      = cantidad;
            this.subtotal      = subtotal;
        }
    }

    static class PedidoRequest {
        public Long itemId;
        public Integer cantidad;
    }
}
