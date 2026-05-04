package com.example.supabase.repository;

import com.example.supabase.domain.EstadoPago;
import com.example.supabase.domain.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);
    Optional<Pago> findTopByReservaIdAndEstadoOrderByCreatedAtDesc(Long reservaId, EstadoPago estado);
    List<Pago> findByReservaIdOrderByCreatedAtDesc(Long reservaId);
}
