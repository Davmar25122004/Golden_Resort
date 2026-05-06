package com.example.supabase.repository;

import com.example.supabase.domain.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, String> {
    Optional<PendingRegistration> findByEmail(String email);
    Optional<PendingRegistration> findByNumDocumento(String numDocumento);
    Optional<PendingRegistration> findByTelefono(String telefono);
}
