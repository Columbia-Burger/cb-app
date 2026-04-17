package com.columbiaburger.business.dto.response;

import com.columbiaburger.business.entity.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Builder
public class OrderTrackingResponse {
    private Long id;
    private String customerFirstName;
    private OrderStatus status;
    private BigDecimal total;
    private BigDecimal deliveryFee;
    private String deliveryZone;
    private LocalDateTime createdAt;
    private List<TrackingItem> items;

    @Getter @Builder
    public static class TrackingItem {
        private String productName;
        private String flavor;
        private int quantity;
    }
}
