package com.columbiaburger.business.dto.request;

import com.columbiaburger.business.entity.OrderSource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
public class CreateOrderRequest {

    @NotBlank
    private String customerName;

    @NotBlank
    private String customerWhatsapp;

    private String customerNeighborhood;

    private String customerAddress;

    private Double customerLatitude;

    private Double customerLongitude;

    @NotEmpty
    @Valid
    private List<OrderItemRequest> items;

    private BigDecimal deliveryFee;

    private String deliveryZone;

    private String notes;

    private boolean printAtAdmin;

    private OrderSource source;
}
