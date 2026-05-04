package com.example.supabase.repository;

import com.example.supabase.domain.TurnoPlanDiaTramo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface TurnoPlanDiaTramoRepository extends JpaRepository<TurnoPlanDiaTramo, Long> {

    List<TurnoPlanDiaTramo> findByPlanIdAndFechaOrderByHoraInicio(Long planId, LocalDate fecha);

    List<TurnoPlanDiaTramo> findByPlanIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
            Long planId, LocalDate desde, LocalDate hasta);

    @Transactional
    void deleteByPlanIdAndFecha(Long planId, LocalDate fecha);

    @Transactional
    void deleteByPlanIdAndFechaBetween(Long planId, LocalDate desde, LocalDate hasta);
}
