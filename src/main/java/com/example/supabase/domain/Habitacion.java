package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "habitacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Habitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "habitacion_seq")
    @SequenceGenerator(name = "habitacion_seq", sequenceName = "habitacion_id_seq", allocationSize = 1)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    @Column(name = "precio_noche", nullable = false)
    private BigDecimal precioNoche;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoHabitacion tipo;

    @Column(nullable = true)
    private String descripcion;

    public enum TipoHabitacion {
        NORMAL, DOBLE, SUITE, LUJO
    }
}
