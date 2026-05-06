package com.example.supabase.repository;

import com.example.supabase.domain.IncidenciaLimpieza;
import com.example.supabase.domain.IncidenciaLimpieza.Estado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface IncidenciaLimpiezaRepository extends JpaRepository<IncidenciaLimpieza, Long> {

    List<IncidenciaLimpieza> findByEstadoInOrderByCreadaEnDesc(Collection<Estado> estados);
    List<IncidenciaLimpieza> findAllByOrderByCreadaEnDesc();
}
