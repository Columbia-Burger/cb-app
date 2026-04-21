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
    List<Order> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime from);
    List<Order> findByStatusAndCreatedAtAfterOrderByCreatedAtDesc(OrderStatus status, LocalDateTime from);

    List<Order> findByStatusInOrderByCreatedAtAsc(List<OrderStatus> statuses);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status != 'CANCELLED'")
    BigDecimal sumTotalBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status != 'CANCELLED'")
    long countByCreatedAtBetweenExcludingCancelled(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT o.source, COUNT(o) FROM Order o WHERE o.status <> com.columbiaburger.business.entity.OrderStatus.CANCELLED GROUP BY o.source ORDER BY COUNT(o) DESC")
    List<Object[]> countBySource();

    @Query(value = "SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::int AS hour, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM business.orders WHERE status != 'CANCELLED' GROUP BY 1 ORDER BY 1", nativeQuery = true)
    List<Object[]> countByHour();
}
