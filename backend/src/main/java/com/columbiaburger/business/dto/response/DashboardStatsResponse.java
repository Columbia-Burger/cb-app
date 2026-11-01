package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DashboardStatsResponse {
    private long ordersToday;
    private long ordersThisWeek;
    private long ordersThisMonth;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisMonth;
    private long pendingOrders;
    private long onTheWayOrders;
    private long totalCustomers;
    private Double averageRating;
    private long ratedOrdersCount;
}
