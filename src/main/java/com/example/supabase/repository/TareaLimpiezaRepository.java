package com.example.supabase.repository;

import com.example.supabase.domain.TareaLimpieza;
import com.example.supabase.domain.TareaLimpieza.Estado;
import com.example.supabase.domain.TareaLimpieza.Tipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TareaLimpiezaRepository extends JpaRepository<TareaLimpieza, Long> {

    List<TareaLimpieza> findByEstadoIn(Collection<Estado> estados);
    List<TareaLimpieza> findByAsignadoAIdAndEstadoIn(Long usuarioId, Collection<Estado> estados);
    boolean existsByReservaIdAndTipo(Long reservaId, Tipo tipo);

    @Query("SELECT t FROM TareaLimpieza t WHERE t.estado IN :estados ORDER BY " +
            "CASE t.prioridad WHEN com.example.supabase.domain.TareaLimpieza.Prioridad.URGENTE THEN 0 " +
            "WHEN com.example.supabase.domain.TareaLimpieza.Prioridad.ALTA THEN 1 " +
            "WHEN com.example.supabase.domain.TareaLimpieza.Prioridad.NORMAL THEN 2 " +
            "WHEN com.example.supabase.domain.TareaLimpieza.Prioridad.BAJA THEN 3 END, t.creadaEn ASC")
    List<TareaLimpieza> findAbiertasOrdenadasPorPrioridad(@Param("estados") Collection<Estado> estados);
}
