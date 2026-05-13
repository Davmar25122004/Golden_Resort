package com.example.supabase.repository;

import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Habitacion.TipoHabitacion;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HabitacionRepository extends JpaRepository<Habitacion, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Habitacion h WHERE h.id = :id")
    Optional<Habitacion> findByIdWithLock(@Param("id") Long id);

    List<Habitacion> findByTipo(TipoHabitacion tipo);

    boolean existsByNumero(String numero);

    @Query("SELECT h FROM Habitacion h WHERE h.tipo = :tipo " +
           "AND h.id NOT IN (" +
           "  SELECT r.habitacion.id FROM Reserva r " +
           "  WHERE r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada " +
           "  AND (EXISTS (SELECT p FROM Pago p WHERE p.reservaId = r.id AND p.estado = com.example.supabase.domain.EstadoPago.COMPLETADO) " +
           "       OR NOT EXISTS (SELECT p FROM Pago p WHERE p.reservaId = r.id))) " +
           "ORDER BY h.id ASC")
    List<Habitacion> findAvailableByTipo(
            @Param("tipo") TipoHabitacion tipo,
            @Param("fechaEntrada") LocalDate fechaEntrada,
            @Param("fechaSalida") LocalDate fechaSalida,
            Pageable pageable);

    @Query("SELECT COUNT(h) FROM Habitacion h WHERE h.tipo = :tipo " +
           "AND h.id NOT IN (" +
           "  SELECT r.habitacion.id FROM Reserva r " +
           "  WHERE r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada " +
           "  AND (EXISTS (SELECT p FROM Pago p WHERE p.reservaId = r.id AND p.estado = com.example.supabase.domain.EstadoPago.COMPLETADO) " +
           "       OR NOT EXISTS (SELECT p FROM Pago p WHERE p.reservaId = r.id)))")
    long countAvailableByTipo(
            @Param("tipo") TipoHabitacion tipo,
            @Param("fechaEntrada") LocalDate fechaEntrada,
            @Param("fechaSalida") LocalDate fechaSalida);
}
