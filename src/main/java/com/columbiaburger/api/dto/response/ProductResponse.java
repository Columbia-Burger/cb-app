package com.columbiaburger.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import com.columbiaburger.api.dto.response.ProductAdditionResponse;

@Data
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private Boolean available;
    private Long categoryId;
    private String categoryName;
    private Long flavorId;
    private String flavorName;
    private List<ProductAdditionResponse> additions;
}
