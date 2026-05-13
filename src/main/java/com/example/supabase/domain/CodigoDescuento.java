package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "codigos_descuento")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class CodigoDescuento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 40)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private TipoDescuento tipo;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal valor;

    @Column(precision = 10, scale = 2)
    private BigDecimal montoMinimo;

    private LocalDate validoHasta;

    private Integer usoMaximo;

    @Column(nullable = false)
    private Integer usos = 0;

    @Column(nullable = false)
    private boolean activo = true;

    /** Si no es null, solo este usuario puede usar el código. */
    @Column(name = "usuario_asignado_id")
    private Long usuarioAsignadoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_asignado_id", insertable = false, updatable = false)
    private Usuario usuarioAsignado;

    /** Nombre del usuario asignado (solo para mostrar en admin, no para lógica). */
    @Transient
    private String usuarioAsignadoNombre;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
