package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "nota_reserva")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotaReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reserva_id", nullable = false)
    private Long reservaId;

    @Column(name = "autor_id", nullable = false)
    private Long autorId;

    @Column(name = "autor_email", length = 255)
    private String autorEmail;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String texto;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @PrePersist
    void prePersist() {
        if (creadoEn == null) creadoEn = LocalDateTime.now();
    }
}
