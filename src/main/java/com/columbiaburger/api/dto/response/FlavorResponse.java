package com.columbiaburger.api.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FlavorResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean active;
}
