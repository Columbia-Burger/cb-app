package com.columbiaburger.business.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class CloseShiftRequest {
    private BigDecimal finalCash;
}
