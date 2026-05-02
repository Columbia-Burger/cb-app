package com.columbiaburger.business.service;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FactusFileResponse {
    private String fileName;
    private byte[] content;
}
