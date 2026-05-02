package com.columbiaburger.business.dto.response;

import com.columbiaburger.business.entity.InvoiceStatus;
import com.columbiaburger.business.entity.OrderSource;
import com.columbiaburger.business.entity.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Builder
public class OrderResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerWhatsapp;
    private OrderStatus status;
    private OrderSource source;
    private BigDecimal total;
    private BigDecimal deliveryFee;
    private String deliveryZone;
    private String notes;
    private Double customerLatitude;
    private Double customerLongitude;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
    private InvoiceStatus invoiceStatus;
    private String invoiceNumber;
    private LocalDateTime invoicedAt;
    private String couponCode;
    private java.math.BigDecimal discount;
    private Integer rating;
    private String electronicInvoiceNumber;
    private String cufe;
    private String electronicPaymentMethodCode;
}
