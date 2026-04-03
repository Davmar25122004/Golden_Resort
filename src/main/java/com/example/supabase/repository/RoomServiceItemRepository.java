package com.example.supabase.repository;

import com.example.supabase.domain.RoomServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomServiceItemRepository extends JpaRepository<RoomServiceItem, Long> {
    List<RoomServiceItem> findByDisponibleTrue();
}
