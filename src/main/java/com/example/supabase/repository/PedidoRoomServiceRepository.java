package com.example.supabase.repository;

import com.example.supabase.domain.PedidoRoomService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface PedidoRoomServiceRepository extends JpaRepository<PedidoRoomService, Long> {
    List<PedidoRoomService> findByReservaId(Long reservaId);
    
    @Modifying
    @Transactional
    void deleteByReservaId(Long reservaId);
    
    @Modifying
    @Transactional
    void deleteByItemId(Long itemId);
}
