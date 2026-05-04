package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mensaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversacion_id", nullable = false)
    private Long conversacionId;

    @Column(name = "autor_id", nullable = false)
    private Long autorId;

    @Column(name = "autor_rol", nullable = false, length = 20)
    private String autorRol;   // 'CLIENTE' | 'RECEPCION'

    @Column(length = 2000)
    private String texto;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "leido_en")
    private LocalDateTime leidoEn;

    @Column(name = "adjunto_url", length = 500)
    private String adjuntoUrl;

    @Column(name = "adjunto_nombre", length = 255)
    private String adjuntoNombre;

    @PrePersist
    void prePersist() {
        if (creadoEn == null) creadoEn = LocalDateTime.now();
    }
}
