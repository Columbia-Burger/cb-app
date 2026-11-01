package com.columbiaburger.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_additions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductAddition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "addition_id", nullable = false)
    private Addition addition;

    // Override price for this product; null = use addition.basePrice
    @Column(name = "price_override", precision = 10, scale = 2)
    private BigDecimal priceOverride;
}
