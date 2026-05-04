package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "turno_perfil_horario", uniqueConstraints = @UniqueConstraint(columnNames = {"perfil_id","horario_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TurnoPerfilHorario {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private TurnoPerfil perfil;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "horario_id", nullable = false)
    private Horario horario;
}
