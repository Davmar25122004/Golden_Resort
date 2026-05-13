package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "habitacion_guardada")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HabitacionGuardada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "fecha_guardado")
    private LocalDateTime fechaGuardado = LocalDateTime.now();
}
