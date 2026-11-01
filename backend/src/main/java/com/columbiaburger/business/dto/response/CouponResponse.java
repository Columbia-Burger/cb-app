package com.columbiaburger.business.dto.response;

import com.columbiaburger.business.entity.CouponType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Builder
public class CouponResponse {
    private Long id;
    private String code;
    private CouponType type;
    private BigDecimal value;
    private Boolean active;
    private LocalDateTime expiresAt;
    private Integer maxUses;
    private Integer currentUses;
    private LocalDateTime createdAt;
}
