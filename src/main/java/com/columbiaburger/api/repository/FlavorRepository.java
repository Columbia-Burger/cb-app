package com.columbiaburger.api.repository;

import com.columbiaburger.api.entity.Flavor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlavorRepository extends JpaRepository<Flavor, Long> {
    List<Flavor> findByActiveTrue();
    boolean existsByName(String name);
}
