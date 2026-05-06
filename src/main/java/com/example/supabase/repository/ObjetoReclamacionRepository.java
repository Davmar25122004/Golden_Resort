package com.example.supabase.repository;

import com.example.supabase.domain.ObjetoReclamacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObjetoReclamacionRepository extends JpaRepository<ObjetoReclamacion, Long> {
    List<ObjetoReclamacion> findByObjetoIdOrderByCreadoEnDesc(Long objetoId);
    List<ObjetoReclamacion> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);
    long countByObjetoIdAndEstado(Long objetoId, ObjetoReclamacion.Estado estado);
    boolean existsByObjetoIdAndUsuarioIdAndEstado(Long objetoId, Long usuarioId, ObjetoReclamacion.Estado estado);
}
