package com.example.supabase.repository;

import com.example.supabase.domain.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    List<Mensaje> findByConversacionIdOrderByCreadoEnAsc(Long conversacionId);

    Optional<Mensaje> findTopByConversacionIdOrderByCreadoEnDesc(Long conversacionId);

    @Modifying
    @Query("UPDATE Mensaje m SET m.leidoEn = :ahora " +
            "WHERE m.conversacionId = :convId AND m.autorRol = :autorRol AND m.leidoEn IS NULL")
    int marcarComoLeidos(@Param("convId") Long convId,
                         @Param("autorRol") String autorRol,
                         @Param("ahora") LocalDateTime ahora);

    @Modifying
    @Query("DELETE FROM Mensaje m WHERE m.conversacionId = :convId")
    int deleteByConversacionId(@Param("convId") Long convId);
}
