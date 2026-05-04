package com.example.supabase.repository;

import com.example.supabase.domain.ObjetoPerdido;
import com.example.supabase.domain.ObjetoPerdido.Estado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ObjetoPerdidoRepository extends JpaRepository<ObjetoPerdido, Long> {
    List<ObjetoPerdido> findAllByOrderByEncontradoEnDesc();
    List<ObjetoPerdido> findByEstadoInOrderByEncontradoEnDesc(Collection<Estado> estados);
}
