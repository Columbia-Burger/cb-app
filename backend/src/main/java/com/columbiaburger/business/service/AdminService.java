package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.DailyStatResponse;
import com.columbiaburger.business.dto.response.DashboardStatsResponse;
import com.columbiaburger.business.dto.response.HourlyStatResponse;
import com.columbiaburger.business.dto.response.SourceStatResponse;
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
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;

    private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");

    // Los timestamps se guardan en hora de Bogotá (JVM con zona America/Bogota desde 2026-07-13)
    private LocalDateTime dayStart(LocalDate date) {
        return date.atStartOfDay();
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        LocalDate today = LocalDate.now(BOGOTA);
        LocalDateTime startOfDay = dayStart(today);
        LocalDateTime endOfDay   = dayStart(today.plusDays(1));

        LocalDateTime startOfWeek = dayStart(today.with(WeekFields.of(Locale.getDefault()).dayOfWeek(), 1));
        LocalDateTime startOfMonth = dayStart(today.withDayOfMonth(1));
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
                .averageRating(orderRepository.averageRating())
                .ratedOrdersCount(orderRepository.countRated())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts(int limit) {
        return orderItemRepository.findTopProducts(limit);
    }

    @Transactional(readOnly = true)
    public List<DailyStatResponse> getDailyStats(int days) {
        return IntStream.range(0, days)
                .mapToObj(i -> LocalDate.now(BOGOTA).minusDays(days - 1 - i))
                .map(date -> {
                    LocalDateTime from = dayStart(date);
                    LocalDateTime to   = dayStart(date.plusDays(1));
                    return DailyStatResponse.builder()
                            .date(date.toString())
                            .orders(orderRepository.countByCreatedAtBetweenExcludingCancelled(from, to))
                            .revenue(orderRepository.sumTotalBetween(from, to))
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SourceStatResponse> getStatsBySource() {
        return orderRepository.countBySource().stream()
                .map(row -> new SourceStatResponse(row[0].toString(), ((Number) row[1]).longValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HourlyStatResponse> getStatsByHour() {
        return orderRepository.countByHour().stream()
                .map(row -> new HourlyStatResponse(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).longValue(),
                        new java.math.BigDecimal(row[2].toString())
                ))
                .toList();
    }
}
