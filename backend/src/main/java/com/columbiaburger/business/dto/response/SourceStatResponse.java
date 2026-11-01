package com.columbiaburger.business.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class SourceStatResponse {
    private String source;
    private long orders;
}
