package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String displayName;
    private String role;
    private Boolean active;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
