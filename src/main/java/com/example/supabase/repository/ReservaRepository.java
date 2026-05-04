package com.example.supabase.repository;

import com.example.supabase.domain.Reserva;
import com.example.supabase.domain.Habitacion;
import com.example.supabase.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    // Reservas de un usuario
    List<Reserva> findByUsuario(Usuario usuario);

    // Reservas de una habitacion
    List<Reserva> findByHabitacion(Habitacion habitacion);

    // ¿Cuántas reservas hay para una habitacion en un rango de fechas? (para disponibilidad)
    @Query("SELECT COUNT(r) FROM Reserva r, Pago p WHERE p.reservaId = r.id AND p.estado = com.example.supabase.domain.EstadoPago.COMPLETADO " +
           "AND r.habitacion = :habitacion AND r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada")
    long contarReservasSolapadas(@Param("habitacion") Habitacion habitacion,
                                  @Param("fechaEntrada") LocalDate fechaEntrada,
                                  @Param("fechaSalida") LocalDate fechaSalida);

    @Query("SELECT COUNT(r) FROM Reserva r, Pago p WHERE p.reservaId = r.id AND p.estado = com.example.supabase.domain.EstadoPago.COMPLETADO " +
           "AND r.habitacion = :habitacion AND r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada " +
           "AND r.id <> :id")
    long contarReservasSolapadasExcluyendo(@Param("habitacion") Habitacion habitacion,
                                           @Param("fechaEntrada") LocalDate fechaEntrada,
                                           @Param("fechaSalida") LocalDate fechaSalida,
                                           @Param("id") Long id);

    // Reservas con llegada en una fecha concreta
    List<Reserva> findByFechaEntrada(LocalDate fechaEntrada);

    // Reservas con salida en una fecha concreta
    List<Reserva> findByFechaSalida(LocalDate fechaSalida);

    // Reservas con llegada >= fecha, ordenadas (para próximas llegadas)
    List<Reserva> findByFechaEntradaGreaterThanEqualOrderByFechaEntradaAsc(LocalDate fechaEntrada);

    // Habitaciones con reserva activa hoy (pagada)
    @Query("SELECT COUNT(DISTINCT r.habitacion) FROM Reserva r, Pago p WHERE p.reservaId = r.id AND p.estado = com.example.supabase.domain.EstadoPago.COMPLETADO " +
           "AND r.fechaEntrada <= :hoy AND r.fechaSalida > :hoy")
    long contarHabitacionesOcupadasHoy(@Param("hoy") LocalDate hoy);

    // Reservas con fechaEntrada en un mes y año concreto
    @Query("SELECT r FROM Reserva r WHERE YEAR(r.fechaEntrada) = :anyo AND MONTH(r.fechaEntrada) = :mes")
    List<Reserva> findByMes(@Param("anyo") int anyo, @Param("mes") int mes);

    // Reservas con petición especial no vacía
    @Query("SELECT r FROM Reserva r WHERE r.peticionEspecial IS NOT NULL AND TRIM(r.peticionEspecial) != '' ORDER BY r.fechaEntrada DESC")
    List<Reserva> findConPeticionEspecial();

    // Reservas que solapan con un rango (entrada < hasta AND salida > desde)
    @Query("SELECT r FROM Reserva r WHERE r.fechaEntrada < :hasta AND r.fechaSalida > :desde ORDER BY r.fechaEntrada")
    List<Reserva> findSolapanRango(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
