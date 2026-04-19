package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderEventResponse {
    private String type;
    private OrderResponse order;
}
