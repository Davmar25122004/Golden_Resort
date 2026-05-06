package com.example.supabase.repository;

import com.example.supabase.domain.NotaReserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotaReservaRepository extends JpaRepository<NotaReserva, Long> {

    List<NotaReserva> findByReservaIdOrderByCreadoEnDesc(Long reservaId);
}
