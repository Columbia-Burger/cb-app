package com.columbiaburger.business.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @AllArgsConstructor
public class TopProductResponse {
    private String productName;
    private Long totalQuantity;
    private BigDecimal totalRevenue;
}
