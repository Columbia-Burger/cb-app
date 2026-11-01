package com.columbiaburger.catalog.repository;

import com.columbiaburger.catalog.entity.DeliveryZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> {
    List<DeliveryZone> findByActiveTrue();
    boolean existsByName(String name);
}
