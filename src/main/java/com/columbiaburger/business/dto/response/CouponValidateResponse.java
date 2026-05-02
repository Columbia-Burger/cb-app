package com.columbiaburger.business.dto.response;

import com.columbiaburger.business.entity.CouponType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class CouponValidateResponse {
    private String code;
    private CouponType type;
    private BigDecimal value;
    private BigDecimal discountAmount;
}
