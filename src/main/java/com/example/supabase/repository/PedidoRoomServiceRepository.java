package com.example.supabase.repository;

import com.example.supabase.domain.PedidoRoomService;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PedidoRoomServiceRepository extends JpaRepository<PedidoRoomService, Long> {
    List<PedidoRoomService> findByReservaId(Long reservaId);
    void deleteByReservaId(Long reservaId);
}
