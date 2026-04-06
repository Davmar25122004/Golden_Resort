package com.example.supabase.repository;

import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Habitacion.TipoHabitacion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface HabitacionRepository extends JpaRepository<Habitacion, Long> {

    List<Habitacion> findByTipo(TipoHabitacion tipo);

    boolean existsByNumero(String numero);

    @Query("SELECT h FROM Habitacion h WHERE h.tipo = :tipo " +
           "AND h.id NOT IN (SELECT r.habitacion.id FROM Reserva r " +
           "WHERE r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada) " +
           "ORDER BY h.id ASC")
    List<Habitacion> findAvailableByTipo(
            @Param("tipo") TipoHabitacion tipo,
            @Param("fechaEntrada") LocalDate fechaEntrada,
            @Param("fechaSalida") LocalDate fechaSalida,
            Pageable pageable);

    @Query("SELECT COUNT(h) FROM Habitacion h WHERE h.tipo = :tipo " +
           "AND h.id NOT IN (SELECT r.habitacion.id FROM Reserva r " +
           "WHERE r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada)")
    long countAvailableByTipo(
            @Param("tipo") TipoHabitacion tipo,
            @Param("fechaEntrada") LocalDate fechaEntrada,
            @Param("fechaSalida") LocalDate fechaSalida);
}
