package com.example.supabase.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registrations")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistration {

    @Id
    @Column(unique = true, nullable = false)
    private String email;

    private String nombre;
    private String passwordHash;
    private String supabaseUid;
    private LocalDateTime createdAt;
}
