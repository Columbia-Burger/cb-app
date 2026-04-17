package com.columbiaburger.business.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyStatResponse {
    private String date;
    private long orders;
    private BigDecimal revenue;
}
