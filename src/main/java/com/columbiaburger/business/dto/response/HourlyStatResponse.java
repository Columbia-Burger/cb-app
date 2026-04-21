package com.columbiaburger.business.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @AllArgsConstructor
public class HourlyStatResponse {
    private int hour;
    private long orders;
    private BigDecimal revenue;
}
