package com.columbiaburger.business.dto.request;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
public class UpdateOrderRequest {
    private List<@Valid OrderItemRequest> items;
    private BigDecimal deliveryFee;
    private String deliveryZone;
    private String notes;
    private BigDecimal discountPercentage;
    private BigDecimal discountFixed;
    private String couponCode;
}
