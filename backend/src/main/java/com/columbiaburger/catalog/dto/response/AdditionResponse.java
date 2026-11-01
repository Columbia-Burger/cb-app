package com.columbiaburger.catalog.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdditionResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private Boolean active;
}
