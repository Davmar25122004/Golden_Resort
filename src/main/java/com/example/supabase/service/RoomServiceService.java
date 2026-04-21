package com.example.supabase.service;

import com.example.supabase.domain.PedidoRoomService;
import com.example.supabase.domain.Reserva;
import com.example.supabase.domain.RoomServiceItem;
import com.example.supabase.dto.PedidoDTO;
import com.example.supabase.dto.PedidoRequest;
import com.example.supabase.repository.PedidoRoomServiceRepository;
import com.example.supabase.repository.ReservaRepository;
import com.example.supabase.repository.RoomServiceItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomServiceService {

    private final RoomServiceItemRepository itemRepository;
    private final PedidoRoomServiceRepository pedidoRepository;
    private final ReservaRepository reservaRepository;

    public RoomServiceService(RoomServiceItemRepository itemRepository,
                               PedidoRoomServiceRepository pedidoRepository,
                               ReservaRepository reservaRepository) {
        this.itemRepository   = itemRepository;
        this.pedidoRepository = pedidoRepository;
        this.reservaRepository = reservaRepository;
    }

    // ── Carta (ítems) ─────────────────────────────────────────────────────────

    public List<RoomServiceItem> listarItems() {
        return itemRepository.findAll();
    }

    public RoomServiceItem crearItem(RoomServiceItem item) {
        item.setId(null);
        return itemRepository.save(item);
    }

    public RoomServiceItem actualizarItem(Long id, RoomServiceItem datos) {
        return itemRepository.findById(id)
                .map(item -> {
                    item.setNombre(datos.getNombre());
                    item.setDescripcion(datos.getDescripcion());
                    item.setPrecio(datos.getPrecio());
                    item.setCategoria(datos.getCategoria());
                    item.setDisponible(datos.getDisponible());
                    item.setImagenUrl(datos.getImagenUrl());
                    return itemRepository.save(item);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional
    public void eliminarItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        pedidoRepository.deleteByItemId(id);
        itemRepository.deleteById(id);
    }

    // ── Pedidos ───────────────────────────────────────────────────────────────

    public List<PedidoDTO> listarPedido(Long reservaId) {
        if (!reservaRepository.existsById(reservaId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return pedidoRepository.findByReservaId(reservaId).stream()
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
    }

    public PedidoRoomService añadirItem(Long reservaId, PedidoRequest request) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        RoomServiceItem item = itemRepository.findById(request.itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        PedidoRoomService pedido = new PedidoRoomService();
        pedido.setReserva(reserva);
        pedido.setItem(item);
        pedido.setCantidad(request.cantidad);
        pedido.setFechaPedido(LocalDateTime.now());
        return pedidoRepository.save(pedido);
    }

    public PedidoRoomService actualizarCantidad(Long pedidoId, PedidoRequest request) {
        PedidoRoomService pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        pedido.setCantidad(request.cantidad);
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public void eliminarLinea(Long pedidoId) {
        if (!pedidoRepository.existsById(pedidoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        pedidoRepository.deleteById(pedidoId);
    }

    /** Devuelve el reservaId de un pedido (para el control de acceso en el controller) */
    public Long getReservaIdDePedido(Long pedidoId) {
        return pedidoRepository.findById(pedidoId)
                .map(p -> p.getReserva().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    /** Comprueba si la reserva pertenece al email dado (para control de acceso en el controller) */
    public boolean perteneceAlUsuario(Long reservaId, String email) {
        return reservaRepository.findById(reservaId)
                .map(r -> r.getUsuario().getEmail().equals(email))
                .orElse(false);
    }
}
