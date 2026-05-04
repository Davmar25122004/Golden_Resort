package com.example.supabase.repository;

import com.example.supabase.domain.MetodoPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Long> {
    List<MetodoPago> findByUsuarioIdOrderByEsDefaultDescCreatedAtDesc(Long usuarioId);
}
