package com.columbiaburger.api.repository;

import com.columbiaburger.api.entity.Flavor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlavorRepository extends JpaRepository<Flavor, Long> {
    List<Flavor> findByActiveTrue();
    boolean existsByName(String name);
    Optional<Flavor> findByName(String name);
}
