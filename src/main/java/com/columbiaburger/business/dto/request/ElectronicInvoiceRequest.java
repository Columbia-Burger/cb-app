package com.columbiaburger.business.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ElectronicInvoiceRequest {
    private String customerDocumentType; // CC o NIT, null = inferir legado
    private String paymentMethodCode; // 10 efectivo, 47 transferencia, 48 tarjeta
    private String customerIdentification; // NIT o cedula, null = consumidor final
    private String customerName;
    private String customerEmail;
}
