package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registrations")
@Getter @Setter
@NoArgsConstructor
public class PendingRegistration {

    @Id
    @Column(unique = true, nullable = false)
    private String email;

    private String nombre;
    private String passwordHash;
    private String supabaseUid;
    private LocalDateTime createdAt;

    private String tipoDocumento;
    private String numDocumento;
    private LocalDate fechaNacimiento;
    private String telefonoPrefijo;
    private String telefono;
}
