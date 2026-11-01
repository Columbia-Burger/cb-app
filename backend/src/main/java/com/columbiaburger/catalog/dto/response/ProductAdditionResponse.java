package com.columbiaburger.catalog.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductAdditionResponse {
    private Long id;
    private Long additionId;
    private String additionName;
    private BigDecimal basePrice;
    private BigDecimal priceOverride;
    private BigDecimal effectivePrice;
}
