package com.columbiaburger.business.repository;

import com.columbiaburger.business.dto.response.TopProductResponse;
import com.columbiaburger.business.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @Query("""
        SELECT new com.columbiaburger.business.dto.response.TopProductResponse(
            i.productName,
            SUM(i.quantity),
            SUM(i.unitPrice * i.quantity)
        )
        FROM OrderItem i
        WHERE i.order.status != 'CANCELLED'
        GROUP BY i.productName
        ORDER BY SUM(i.quantity) DESC
        LIMIT :limit
    """)
    List<TopProductResponse> findTopProducts(@Param("limit") int limit);
}
