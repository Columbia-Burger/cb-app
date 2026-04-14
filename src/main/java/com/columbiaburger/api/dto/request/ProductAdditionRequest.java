package com.columbiaburger.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductAdditionRequest {

    @NotNull
    private Long productId;

    @NotNull
    private Long additionId;

    @DecimalMin("0.00")
    private BigDecimal priceOverride;
}
