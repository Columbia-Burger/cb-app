package com.columbiaburger.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DeliveryZoneResponse {
    private Long id;
    private String name;
    private BigDecimal deliveryFee;
    private Boolean active;
}
