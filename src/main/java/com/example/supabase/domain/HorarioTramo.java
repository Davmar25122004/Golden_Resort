package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "horario_tramo")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class HorarioTramo {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "horario_id", nullable = false)
    private Horario horario;

    @Column(name = "dia_semana", nullable = false)
    private Short diaSemana;   // 1=Lun .. 7=Dom (ISO)

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;
}
