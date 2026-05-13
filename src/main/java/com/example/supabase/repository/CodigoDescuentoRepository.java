package com.example.supabase.repository;

import com.example.supabase.domain.CodigoDescuento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodigoDescuentoRepository extends JpaRepository<CodigoDescuento, Long> {
    Optional<CodigoDescuento> findByCodigoIgnoreCase(String codigo);
    List<CodigoDescuento> findAllByOrderByCreatedAtDesc();
}
