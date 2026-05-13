package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reserva")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "reserva_seq")
    @SequenceGenerator(name = "reserva_seq", sequenceName = "reserva_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "fecha_entrada", nullable = false)
    private LocalDate fechaEntrada;

    @Column(name = "fecha_salida", nullable = false)
    private LocalDate fechaSalida;

    // Relación con Usuario:
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Relación con Habitacion:
    @ManyToOne
    @JoinColumn(name = "habitacion_id", nullable = false)
    private Habitacion habitacion;

    // Relación con ReservaServicio:
    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReservaServicio> servicios;

    // Petición especial del cliente
    @Column(name = "peticion_especial", columnDefinition = "TEXT")
    private String peticionEspecial;

    // Momento exacto del checkout (recepción lo marca al entregar la llave).
    // Si está informado, la reserva se considera cerrada aunque la fechaSalida
    // sea posterior. Se usa para liberar la habitación y disparar limpieza.
    @Column(name = "checkout_en")
    private LocalDateTime checkoutEn;
}
