package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pedido_room_service")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class PedidoRoomService {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "pedido_room_service_seq")
    @SequenceGenerator(name = "pedido_room_service_seq", sequenceName = "pedido_room_service_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "reserva_id", nullable = false)
    private Reserva reserva;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private RoomServiceItem item;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "fecha_pedido")
    private LocalDateTime fechaPedido = LocalDateTime.now();
}
