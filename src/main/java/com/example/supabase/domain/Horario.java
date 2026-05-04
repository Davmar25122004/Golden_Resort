package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "horario")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Horario {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @OneToMany(mappedBy = "horario", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<HorarioTramo> tramos = new ArrayList<>();

    @PrePersist void prePersist() {
        var now = LocalDateTime.now();
        if (creadoEn == null) creadoEn = now;
        actualizadoEn = now;
    }
    @PreUpdate void preUpdate() { actualizadoEn = LocalDateTime.now(); }
}
