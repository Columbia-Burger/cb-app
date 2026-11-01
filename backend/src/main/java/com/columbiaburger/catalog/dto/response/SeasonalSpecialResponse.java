package com.columbiaburger.catalog.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SeasonalSpecialResponse {
    private Long id;
    private String name;
    private String description;
    private String tagline;
    private BigDecimal price;
    private String imageUrl;
    private Boolean active;
    private LocalDate seasonStart;
    private LocalDate seasonEnd;
    private LocalDateTime createdAt;
}
