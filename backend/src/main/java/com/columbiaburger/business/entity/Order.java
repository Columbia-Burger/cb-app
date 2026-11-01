package com.columbiaburger.business.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "orders",
        schema = "business",
        indexes = {
                @Index(name = "idx_orders_created_at", columnList = "created_at"),
                @Index(name = "idx_orders_invoiced_at", columnList = "invoiced_at")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.RECEIVED;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderSource source = OrderSource.WEB;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "delivery_zone", length = 100)
    private String deliveryZone;

    @Column(length = 500)
    private String notes;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'PENDING'")
    private InvoiceStatus invoiceStatus = InvoiceStatus.PENDING;

    @Column(name = "invoice_number", length = 30, unique = true)
    private String invoiceNumber;

    @Column(name = "invoiced_at")
    private LocalDateTime invoicedAt;

    @Column(name = "electronic_invoice_number", length = 50)
    private String electronicInvoiceNumber;

    @Column(name = "cufe", length = 100)
    private String cufe;

    @Column(name = "electronic_payment_method_code", length = 10)
    private String electronicPaymentMethodCode;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "discount", precision = 10, scale = 2)
    private BigDecimal discount;

    @Column(name = "rating")
    private Integer rating;

    @Builder.Default
    @Column(name = "rating_request_sent", columnDefinition = "boolean DEFAULT false NOT NULL")
    private Boolean ratingRequestSent = false;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> items;
}
