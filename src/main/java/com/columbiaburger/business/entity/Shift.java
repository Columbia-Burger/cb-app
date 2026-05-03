package com.columbiaburger.business.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shifts", schema = "business")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "initial_cash", precision = 12, scale = 2)
    private BigDecimal initialCash;

    @Column(name = "final_cash", precision = 12, scale = 2)
    private BigDecimal finalCash;

    @PrePersist
    protected void onCreate() {
        if (openedAt == null) openedAt = LocalDateTime.now();
    }
}
