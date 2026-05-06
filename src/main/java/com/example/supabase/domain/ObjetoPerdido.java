package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "objeto_perdido")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ObjetoPerdido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id")
    private Habitacion habitacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reportado_por")
    private Usuario reportadoPor;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Column(name = "encontrado_en", nullable = false)
    private LocalDateTime encontradoEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Estado estado;

    @Column(name = "notas_entrega", columnDefinition = "TEXT")
    private String notasEntrega;

    @Column(name = "creada_en", nullable = false)
    private LocalDateTime creadaEn;

    @Column(name = "entregado_en")
    private LocalDateTime entregadoEn;

    @PrePersist
    void prePersist() {
        if (creadaEn == null)      creadaEn = LocalDateTime.now();
        if (estado == null)        estado = Estado.DISPONIBLE;
        if (encontradoEn == null)  encontradoEn = LocalDateTime.now();
    }

    public enum Estado { DISPONIBLE, ENTREGADO, DESCARTADO }
}
