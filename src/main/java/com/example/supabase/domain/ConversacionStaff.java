package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversacion_staff")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ConversacionStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_usuario_id", unique = true, nullable = false)
    private Usuario staffUsuario;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "ultimo_mensaje_en")
    private LocalDateTime ultimoMensajeEn;

    @PrePersist
    void prePersist() { if (creadoEn == null) creadoEn = LocalDateTime.now(); }
}
