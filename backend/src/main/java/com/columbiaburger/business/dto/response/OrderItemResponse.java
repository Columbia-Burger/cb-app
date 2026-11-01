package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String flavor;
    private String additions;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String note;
}
