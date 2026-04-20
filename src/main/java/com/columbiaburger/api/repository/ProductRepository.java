package com.columbiaburger.api.repository;

import com.columbiaburger.api.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByAvailableTrue();
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByFlavorsId(Long flavorId);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.flavors WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Product> findByNameContainingIgnoreCaseWithFlavors(@Param("keyword") String keyword);
}
