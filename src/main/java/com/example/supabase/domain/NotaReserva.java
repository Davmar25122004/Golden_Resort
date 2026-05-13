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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", insertable = false, updatable = false)
    private Reserva reserva;

    @Column(name = "autor_id", nullable = false)
    private Long autorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", insertable = false, updatable = false)
    private Usuario autor;

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
