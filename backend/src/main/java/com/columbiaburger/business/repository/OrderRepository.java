package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.Order;
import com.columbiaburger.business.entity.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @EntityGraph(attributePaths = {"customer", "items"})
    @Query("""
            SELECT DISTINCT o FROM Order o
            WHERE (o.invoicedAt >= :from AND o.invoicedAt < :to)
               OR (o.invoicedAt IS NULL AND o.createdAt >= :from AND o.createdAt < :to)
            ORDER BY o.createdAt DESC
            """)
    List<Order> findInvoicesForDay(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Todos los pedidos (incluidos cancelados) creados en [from, to), con cliente e ítems, para reportes. */
    @EntityGraph(attributePaths = {"customer", "items"})
    @Query("""
            SELECT DISTINCT o FROM Order o
            WHERE o.createdAt >= :from AND o.createdAt < :to
            ORDER BY o.createdAt ASC
            """)
    List<Order> findForReport(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    long countByStatus(OrderStatus status);

    /**
     * Cierra como entregados los pedidos de días anteriores que nadie movió de estado.
     * Marca la calificación como ya solicitada para no escribirle al cliente por pedidos viejos.
     */
    @Modifying
    @Query("""
            UPDATE Order o
               SET o.status = com.columbiaburger.business.entity.OrderStatus.DELIVERED,
                   o.ratingRequestSent = true
             WHERE o.status IN (com.columbiaburger.business.entity.OrderStatus.RECEIVED,
                                com.columbiaburger.business.entity.OrderStatus.PREPARING,
                                com.columbiaburger.business.entity.OrderStatus.ON_THE_WAY)
               AND o.createdAt < :before
            """)
    int closeStaleOrders(@Param("before") LocalDateTime before);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status != 'CANCELLED'")
    BigDecimal sumTotalBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status != 'CANCELLED'")
    long countByCreatedAtBetweenExcludingCancelled(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT o.source, COUNT(o) FROM Order o WHERE o.status <> com.columbiaburger.business.entity.OrderStatus.CANCELLED GROUP BY o.source ORDER BY COUNT(o) DESC")
    List<Object[]> countBySource();

    @Query(value = "SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM business.orders WHERE status != 'CANCELLED' GROUP BY 1 ORDER BY 1", nativeQuery = true)
    List<Object[]> countByHour();

    @Query("SELECT o FROM Order o WHERE o.customer.whatsapp = :whatsapp AND o.status = 'DELIVERED' AND o.rating IS NULL ORDER BY o.createdAt DESC")
    List<Order> findDeliveredUnratedByWhatsapp(@Param("whatsapp") String whatsapp);

    @Query("SELECT AVG(o.rating) FROM Order o WHERE o.rating IS NOT NULL")
    Double averageRating();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.rating IS NOT NULL")
    long countRated();
}
