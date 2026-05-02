package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.ElectronicInvoiceResponse;
import com.columbiaburger.business.entity.Order;
import com.columbiaburger.business.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FactusService {

    private final RestTemplate restTemplate;
    private final FactusTokenService tokenService;

    @Value("${factus.base-url}")
    private String baseUrl;

    @Value("${factus.numbering-range-id}")
    private int numberingRangeId;

    private static final String CONSUMIDOR_FINAL_ID = "222222222222";
    private static final String BOGOTA_MUNICIPALITY_ID = "980";

    public ElectronicInvoiceResponse createBill(Order order, String customerIdentification,
                                                 String customerName, String customerEmail) {
        Map<String, Object> payload = buildPayload(order, customerIdentification, customerName, customerEmail);

        HttpHeaders headers = buildHeaders();
        ResponseEntity<Map<String, Object>> response = exchange("/v2/bills", HttpMethod.POST,
                new HttpEntity<>(payload, headers));

        return parseResponse(response.getBody());
    }

    public void voidBill(String electronicNumber) {
        HttpHeaders headers = buildHeaders();
        Map<String, Object> payload = new HashMap<>();
        payload.put("numbering_range_id", numberingRangeId);
        payload.put("referenced_bill_number", electronicNumber);
        payload.put("correction_concept_id", 2);
        payload.put("customer", buildConsumidorFinalCustomer(""));
        payload.put("items", List.of(Map.of(
                "code_reference", "ANULACION",
                "name", "Anulación de factura",
                "quantity", 1,
                "price", 0,
                "tax_rate", "0.00",
                "unit_measure_id", 70,
                "standard_code_id", "999999999"
        )));

        exchange("/v2/credit-notes", HttpMethod.POST, new HttpEntity<>(payload, headers));
    }

    private Map<String, Object> buildPayload(Order order, String identification,
                                              String customerName, String customerEmail) {
        boolean isConsumidorFinal = identification == null || identification.isBlank();
        String id = isConsumidorFinal ? CONSUMIDOR_FINAL_ID : identification;
        String name = isConsumidorFinal ? "Consumidor Final" : customerName;
        String email = (customerEmail != null && !customerEmail.isBlank()) ? customerEmail : "consumidor@final.com";

        Map<String, Object> customer = isConsumidorFinal
                ? buildConsumidorFinalCustomer(email)
                : buildCustomer(id, name, email);

        List<Map<String, Object>> items = buildItems(order);

        Map<String, Object> payload = new HashMap<>();
        payload.put("numbering_range_id", numberingRangeId);
        payload.put("reference_code", "PED-" + order.getId());
        payload.put("observation", "Pedido #" + order.getId());
        payload.put("payment_form", "1");
        payload.put("payment_method_code", "10");
        payload.put("customer", customer);
        payload.put("items", items);
        return payload;
    }

    private Map<String, Object> buildConsumidorFinalCustomer(String email) {
        Map<String, Object> c = new HashMap<>();
        c.put("identification", CONSUMIDOR_FINAL_ID);
        c.put("names", "Consumidor Final");
        c.put("identification_document_id", 12);
        c.put("legal_organization_id", "2");
        c.put("address", "No indica");
        c.put("municipality_id", BOGOTA_MUNICIPALITY_ID);
        c.put("email", email.isBlank() ? "consumidor@final.com" : email);
        c.put("phone", "0000000000");
        c.put("tribute_id", "21");
        return c;
    }

    private Map<String, Object> buildCustomer(String identification, String name, String email) {
        Map<String, Object> c = new HashMap<>();
        c.put("identification", identification);
        c.put("names", name);
        c.put("identification_document_id", 13);
        c.put("legal_organization_id", "1");
        c.put("address", "No indica");
        c.put("municipality_id", BOGOTA_MUNICIPALITY_ID);
        c.put("email", email);
        c.put("phone", "0000000000");
        c.put("tribute_id", "21");
        return c;
    }

    private List<Map<String, Object>> buildItems(Order order) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            Map<String, Object> i = new HashMap<>();
            i.put("code_reference", String.valueOf(item.getProductId()));
            i.put("name", item.getProductName());
            i.put("quantity", item.getQuantity());
            i.put("price", item.getUnitPrice().doubleValue());
            i.put("discount_rate", 0);
            i.put("tax_rate", "0.00");
            i.put("unit_measure_id", 70);
            i.put("standard_code_id", "999999999");
            items.add(i);
        }
        return items;
    }

    @SuppressWarnings("unchecked")
    private ElectronicInvoiceResponse parseResponse(Map<String, Object> body) {
        Map<String, Object> data = (Map<String, Object>) body.get("data");
        String number = (String) data.get("number");
        String cufe = (String) data.get("cufe");
        String qr = (String) data.get("qr_code");

        return ElectronicInvoiceResponse.builder()
                .number(number)
                .cufe(cufe)
                .qr(qr)
                .pdfUrl(baseUrl + "/v2/bills/pdf/" + number)
                .build();
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(tokenService.getToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        return headers;
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<Map<String, Object>> exchange(String path, HttpMethod method, HttpEntity<?> entity) {
        return restTemplate.exchange(
                baseUrl + path,
                method,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
        );
    }
}
