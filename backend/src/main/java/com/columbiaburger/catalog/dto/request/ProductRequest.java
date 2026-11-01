package com.columbiaburger.catalog.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal price;

    @Size(max = 500)
    private String imageUrl;

    @NotNull
    private Long categoryId;

    private List<Long> flavorIds;
}
