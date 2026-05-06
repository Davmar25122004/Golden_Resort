package com.example.supabase.repository;

import com.example.supabase.domain.TurnoPlanDia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

public interface TurnoPlanDiaRepository extends JpaRepository<TurnoPlanDia, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM TurnoPlanDia d WHERE d.plan.id = :planId AND d.fecha = :fecha")
    void deleteByPlanIdAndFecha(@Param("planId") Long planId, @Param("fecha") LocalDate fecha);

    @Modifying
    @Transactional
    @Query("DELETE FROM TurnoPlanDia d WHERE d.plan.id = :planId AND d.fecha BETWEEN :desde AND :hasta")
    void deleteByPlanIdAndFechaBetween(@Param("planId") Long planId,
                                       @Param("desde") LocalDate desde,
                                       @Param("hasta") LocalDate hasta);
}
