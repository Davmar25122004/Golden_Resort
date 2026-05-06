package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "turno_plan_semana")
@IdClass(TurnoPlanSemanaId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TurnoPlanSemana {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private TurnoPlan plan;

    @Id
    @Column(name = "dia_semana", nullable = false)
    private Short diaSemana;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private TurnoPerfil perfil;
}
