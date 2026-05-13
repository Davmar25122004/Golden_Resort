package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Conversacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cliente_id", nullable = false, unique = true)
    private Long clienteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", insertable = false, updatable = false)
    private Usuario cliente;

    @Column(name = "creada_en", nullable = false)
    private LocalDateTime creadaEn;

    @Column(name = "ultima_actividad", nullable = false)
    private LocalDateTime ultimaActividad;

    @Column(name = "no_leidos_cliente", nullable = false)
    private Integer noLeidosCliente = 0;

    @Column(name = "no_leidos_recepcion", nullable = false)
    private Integer noLeidosRecepcion = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Estado estado;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (creadaEn == null) creadaEn = now;
        if (ultimaActividad == null) ultimaActividad = now;
        if (noLeidosCliente == null) noLeidosCliente = 0;
        if (noLeidosRecepcion == null) noLeidosRecepcion = 0;
        if (estado == null) estado = Estado.ABIERTA;
    }

    public enum Estado { ABIERTA, PENDIENTE, RESUELTA }
}
