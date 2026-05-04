package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tarea_limpieza")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TareaLimpieza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "habitacion_id", nullable = false)
    private Habitacion habitacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id")
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignado_a")
    private Usuario asignadoA;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Tipo tipo;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Estado estado;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Prioridad prioridad;

    @Column(columnDefinition = "TEXT") private String notas;
    @Column(name = "notas_finales", columnDefinition = "TEXT") private String notasFinales;

    @Column(name = "creada_en",     nullable = false) private LocalDateTime creadaEn;
    @Column(name = "iniciada_en")                     private LocalDateTime iniciadaEn;
    @Column(name = "completada_en")                   private LocalDateTime completadaEn;

    @PrePersist
    void prePersist() {
        if (creadaEn == null)  creadaEn = LocalDateTime.now();
        if (tipo == null)      tipo = Tipo.SALIDA;
        if (estado == null)    estado = Estado.PENDIENTE;
        if (prioridad == null) prioridad = Prioridad.NORMAL;
    }

    public enum Tipo      { SALIDA, DIARIA, MANTENIMIENTO, OTRA }
    public enum Estado    { PENDIENTE, EN_PROGRESO, COMPLETADA, CANCELADA }
    public enum Prioridad { BAJA, NORMAL, ALTA, URGENTE }
}
