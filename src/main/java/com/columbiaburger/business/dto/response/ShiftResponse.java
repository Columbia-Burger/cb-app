package com.columbiaburger.business.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShiftResponse {
    private Long id;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private boolean active;
}
