package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "incidencia_limpieza")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IncidenciaLimpieza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id")
    private Habitacion habitacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reportado_por")
    private Usuario reportadoPor;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Tipo tipo;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Prioridad prioridad;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Estado estado;

    @Column(nullable = false, columnDefinition = "TEXT") private String descripcion;
    @Column(columnDefinition = "TEXT")                    private String resolucion;

    @Column(name = "creada_en",   nullable = false) private LocalDateTime creadaEn;
    @Column(name = "resuelta_en")                   private LocalDateTime resueltaEn;

    @PrePersist
    void prePersist() {
        if (creadaEn == null)  creadaEn = LocalDateTime.now();
        if (tipo == null)      tipo = Tipo.MANTENIMIENTO;
        if (prioridad == null) prioridad = Prioridad.NORMAL;
        if (estado == null)    estado = Estado.ABIERTA;
    }

    public enum Tipo      { MANTENIMIENTO, INVENTARIO, OTRO }
    public enum Prioridad { BAJA, NORMAL, ALTA, URGENTE }
    public enum Estado    { ABIERTA, EN_PROCESO, RESUELTA }
}
