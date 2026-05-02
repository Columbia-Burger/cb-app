package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class ElectronicInvoiceDetailResponse {
    private String number;
    private String referenceCode;
    private String cufe;
    private String documentName;
    private String operationTypeName;
    private boolean validated;
    private String validatedAt;
    private String createdAt;
    private String observation;
    private boolean sendEmail;
    private String qrUrl;
    private String publicUrl;
    private Payment payment;
    private Customer customer;
    private Totals totals;
    private List<Item> items;
    private Map<String, String> errors;

    @Getter
    @Builder
    public static class Payment {
        private String formCode;
        private String formName;
        private String methodCode;
        private String methodName;
    }

    @Getter
    @Builder
    public static class Customer {
        private String documentCode;
        private String documentName;
        private String identification;
        private String dv;
        private String company;
        private String names;
        private String email;
        private String phone;
        private String address;
        private String legalOrganizationCode;
        private String legalOrganizationName;
        private String tributeCode;
        private String tributeName;
        private String municipality;
        private String department;
    }

    @Getter
    @Builder
    public static class Totals {
        private String grossValue;
        private String taxableAmount;
        private String taxAmount;
        private String discountAmount;
        private String total;
    }

    @Getter
    @Builder
    public static class Item {
        private String codeReference;
        private String name;
        private String quantity;
        private String price;
        private String total;
        private String discountRate;
        private String taxSummary;
    }
}
