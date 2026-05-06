package com.example.supabase.repository;

import com.example.supabase.domain.ConversacionStaff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversacionStaffRepository extends JpaRepository<ConversacionStaff, Long> {
    Optional<ConversacionStaff> findByStaffUsuarioId(Long staffUsuarioId);
    List<ConversacionStaff> findAllByOrderByUltimoMensajeEnDesc();
}
