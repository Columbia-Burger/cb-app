package com.columbiaburger.business.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShiftResponse {
    private Long id;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private boolean active;
    private BigDecimal initialCash;
    private BigDecimal finalCash;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal expectedCash;
    private BigDecimal difference;
}
