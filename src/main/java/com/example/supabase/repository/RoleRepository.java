package com.example.supabase.repository;

import com.example.supabase.domain.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByName(String name);
}