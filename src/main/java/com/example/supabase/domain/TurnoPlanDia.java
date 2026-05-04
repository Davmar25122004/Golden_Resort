package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "turno_plan_dia", uniqueConstraints = @UniqueConstraint(columnNames = {"plan_id","fecha"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TurnoPlanDia {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private TurnoPlan plan;

    @Column(nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "perfil_id", nullable = true)
    private TurnoPerfil perfil;
}
