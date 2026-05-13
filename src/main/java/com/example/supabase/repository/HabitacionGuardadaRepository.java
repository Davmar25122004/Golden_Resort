package com.example.supabase.repository;

import com.example.supabase.domain.HabitacionGuardada;
import com.example.supabase.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HabitacionGuardadaRepository extends JpaRepository<HabitacionGuardada, Long> {
    List<HabitacionGuardada> findByUsuario(Usuario usuario);
    Optional<HabitacionGuardada> findByUsuarioAndTipo(Usuario usuario, String tipo);
    boolean existsByUsuarioAndTipo(Usuario usuario, String tipo);
    void deleteByUsuarioAndTipo(Usuario usuario, String tipo);
}
