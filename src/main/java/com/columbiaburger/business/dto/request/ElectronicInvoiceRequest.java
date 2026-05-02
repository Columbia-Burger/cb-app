package com.columbiaburger.business.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ElectronicInvoiceRequest {
    private String customerIdentification; // NIT o cédula, null = consumidor final
    private String customerName;
    private String customerEmail;
}
