package com.columbiaburger.business.dto.request;

import com.columbiaburger.business.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateOrderStatusRequest {

    @NotNull
    private OrderStatus status;
}
