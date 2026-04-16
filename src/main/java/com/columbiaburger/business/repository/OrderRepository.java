package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.Order;
import com.columbiaburger.business.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findAllByOrderByCreatedAtDesc();

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status != 'CANCELLED'")
    BigDecimal sumTotalBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status != 'CANCELLED'")
    long countByCreatedAtBetweenExcludingCancelled(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
