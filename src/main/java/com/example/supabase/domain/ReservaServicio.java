package com.example.supabase.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reserva_servicio")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReservaServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "reserva_servicio_seq")
    @SequenceGenerator(name = "reserva_servicio_seq", sequenceName = "reserva_servicio_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private Integer cantidad;

    // Muchos ReservaServicio pertenecen a una Reserva
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "reserva_id", nullable = false)
    private Reserva reserva;

    // Muchos ReservaServicio apuntan a un Servicio
    @ManyToOne
    @JoinColumn(name = "servicio_id", nullable = false)
    private Servicio servicio;
}
