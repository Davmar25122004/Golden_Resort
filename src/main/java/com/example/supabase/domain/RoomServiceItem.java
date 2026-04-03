package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "room_service_item")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoomServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "room_service_item_seq")
    @SequenceGenerator(name = "room_service_item_seq", sequenceName = "room_service_item_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false)
    private BigDecimal precio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CategoriaRoomService categoria;

    @Column(nullable = false)
    private Boolean disponible = true;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;
}
