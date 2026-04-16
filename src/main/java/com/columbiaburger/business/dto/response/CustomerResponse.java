package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class CustomerResponse {
    private Long id;
    private String name;
    private String whatsapp;
    private String neighborhood;
    private LocalDateTime createdAt;
}
