package com.example.supabase.domain;

import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TurnoPlanSemanaId implements Serializable {
    private Long plan;
    private Short diaSemana;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TurnoPlanSemanaId other)) return false;
        return Objects.equals(plan, other.plan) && Objects.equals(diaSemana, other.diaSemana);
    }
    @Override
    public int hashCode() { return Objects.hash(plan, diaSemana); }
}
