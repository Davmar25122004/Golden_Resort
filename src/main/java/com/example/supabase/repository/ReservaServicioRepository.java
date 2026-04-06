package com.example.supabase.repository;

import com.example.supabase.domain.ReservaServicio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaServicioRepository extends JpaRepository<ReservaServicio, Long> {
    void deleteByReservaIdAndServicioId(Long reservaId, Long servicioId);
    boolean existsByReservaIdAndServicioId(Long reservaId, Long servicioId);
    void deleteByReservaId(Long reservaId);
}
