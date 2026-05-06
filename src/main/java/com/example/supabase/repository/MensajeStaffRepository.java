package com.example.supabase.repository;

import com.example.supabase.domain.MensajeStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MensajeStaffRepository extends JpaRepository<MensajeStaff, Long> {
    List<MensajeStaff> findByConversacionIdOrderByCreadoEnAsc(Long conversacionId);

    @Modifying
    @Query("UPDATE MensajeStaff m SET m.leido = true WHERE m.conversacion.id = :convId AND m.autorEsAdmin = :admin AND m.leido = false")
    int marcarLeidos(@Param("convId") Long convId, @Param("admin") boolean autorEsAdmin);

    @Query("SELECT COUNT(m) FROM MensajeStaff m WHERE m.conversacion.id = :convId AND m.autorEsAdmin = :admin AND m.leido = false")
    long countNoLeidos(@Param("convId") Long convId, @Param("admin") boolean autorEsAdmin);
}
