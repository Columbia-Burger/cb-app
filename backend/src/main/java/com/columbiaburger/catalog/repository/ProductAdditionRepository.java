package com.columbiaburger.catalog.repository;

import com.columbiaburger.catalog.entity.ProductAddition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductAdditionRepository extends JpaRepository<ProductAddition, Long> {
    List<ProductAddition> findByProductId(Long productId);
    List<ProductAddition> findByAdditionId(Long additionId);
    void deleteByProductId(Long productId);
}
