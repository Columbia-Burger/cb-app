package com.columbiaburger.api.repository;

import com.columbiaburger.api.entity.DeliveryZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> {
    List<DeliveryZone> findByActiveTrue();
    boolean existsByName(String name);
}
