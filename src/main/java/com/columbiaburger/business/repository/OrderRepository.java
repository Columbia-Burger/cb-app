package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.Order;
import com.columbiaburger.business.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findAllByOrderByCreatedAtDesc();
}
