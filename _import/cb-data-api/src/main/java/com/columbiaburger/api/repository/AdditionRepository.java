package com.columbiaburger.api.repository;

import com.columbiaburger.api.entity.Addition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdditionRepository extends JpaRepository<Addition, Long> {
    List<Addition> findByActiveTrue();
    boolean existsByName(String name);
}
