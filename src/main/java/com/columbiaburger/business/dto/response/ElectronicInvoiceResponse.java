package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ElectronicInvoiceResponse {
    private String number;
    private String cufe;
    private String qr;
    private String pdfUrl;
}
