package com.example.supabase.repository;

import com.example.supabase.domain.Conversacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {

    Optional<Conversacion> findByClienteId(Long clienteId);

    List<Conversacion> findAllByOrderByUltimaActividadDesc();

    @Query("SELECT COALESCE(SUM(c.noLeidosRecepcion), 0) FROM Conversacion c")
    long sumarNoLeidosRecepcion();
}
