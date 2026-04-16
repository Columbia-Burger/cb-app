package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.DashboardStatsResponse;
import com.columbiaburger.business.dto.response.TopProductResponse;
import com.columbiaburger.business.entity.OrderStatus;
import com.columbiaburger.business.repository.CustomerRepository;
import com.columbiaburger.business.repository.OrderItemRepository;
import com.columbiaburger.business.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        LocalDateTime startOfWeek = LocalDate.now()
                .with(WeekFields.of(Locale.getDefault()).dayOfWeek(), 1)
                .atStartOfDay();

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        BigDecimal revenueToday = orderRepository.sumTotalBetween(startOfDay, endOfDay);
        BigDecimal revenueThisMonth = orderRepository.sumTotalBetween(startOfMonth, endOfMonth);

        return DashboardStatsResponse.builder()
                .ordersToday(orderRepository.countByCreatedAtBetweenExcludingCancelled(startOfDay, endOfDay))
                .ordersThisWeek(orderRepository.countByCreatedAtBetweenExcludingCancelled(startOfWeek, endOfDay))
                .ordersThisMonth(orderRepository.countByCreatedAtBetweenExcludingCancelled(startOfMonth, endOfMonth))
                .revenueToday(revenueToday)
                .revenueThisMonth(revenueThisMonth)
                .pendingOrders(
                        orderRepository.countByStatus(OrderStatus.RECEIVED) +
                        orderRepository.countByStatus(OrderStatus.PREPARING)
                )
                .onTheWayOrders(orderRepository.countByStatus(OrderStatus.ON_THE_WAY))
                .totalCustomers(customerRepository.count())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts(int limit) {
        return orderItemRepository.findTopProducts(limit);
    }
}
