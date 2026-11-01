package com.columbiaburger.catalog.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SeasonalSpecialRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String tagline;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal price;

    @Size(max = 500)
    private String imageUrl;

    private LocalDate seasonStart;
    private LocalDate seasonEnd;
}
