package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.ElectronicInvoiceResponse;
import com.columbiaburger.business.entity.Order;
import com.columbiaburger.business.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FactusService {

    private static final String CONSUMIDOR_FINAL_ID = "222222222222";
    private static final String BOGOTA_MUNICIPALITY_CODE = "11001";
    private static final String UNIT_MEASURE_CODE = "94";
    private static final String STANDARD_CODE = "999";

    private final RestTemplate restTemplate;
    private final FactusTokenService tokenService;

    @Value("${factus.base-url}")
    private String baseUrl;

    @Value("${factus.numbering-range-id}")
    private int numberingRangeId;

    public ElectronicInvoiceResponse createBill(Order order, String customerIdentification,
                                                String customerName, String customerEmail) {
        Map<String, Object> payload = buildPayload(order, customerIdentification, customerName, customerEmail);

        HttpHeaders headers = buildHeaders();
        ResponseEntity<Map<String, Object>> response = exchange(
                "/v2/bills/validate",
                HttpMethod.POST,
                new HttpEntity<>(payload, headers)
        );

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
                "name", "Anulacion de factura",
                "quantity", "1.00",
                "price", "0.00",
                "unit_measure_code", UNIT_MEASURE_CODE,
                "standard_code", STANDARD_CODE,
                "taxes", defaultTaxes()
        )));

        exchange("/v2/credit-notes", HttpMethod.POST, new HttpEntity<>(payload, headers));
    }

    private Map<String, Object> buildPayload(Order order, String identification,
                                             String customerName, String customerEmail) {
        boolean isConsumidorFinal = identification == null || identification.isBlank();
        String id = isConsumidorFinal ? CONSUMIDOR_FINAL_ID : identification.trim();
        String name = isConsumidorFinal ? "Consumidor Final" : safeName(customerName);
        String email = (customerEmail != null && !customerEmail.isBlank())
                ? customerEmail.trim()
                : "consumidor@final.com";

        Map<String, Object> customer = isConsumidorFinal
                ? buildConsumidorFinalCustomer(email)
                : buildCustomer(id, name, email);

        Map<String, Object> payload = new HashMap<>();
        payload.put("numbering_range_id", numberingRangeId);
        payload.put("reference_code", "PED-" + order.getId());
        payload.put("document", "01");
        payload.put("operation_type", "10");
        payload.put("observation", "Pedido #" + order.getId());
        payload.put("send_email", true);
        payload.put("customer", customer);
        payload.put("payment_details", buildPaymentDetails(order));
        payload.put("items", buildItems(order));
        return payload;
    }

    private Map<String, Object> buildConsumidorFinalCustomer(String email) {
        Map<String, Object> customer = new HashMap<>();
        customer.put("identification", CONSUMIDOR_FINAL_ID);
        customer.put("names", "Consumidor Final");
        customer.put("identification_document_code", "13");
        customer.put("legal_organization_code", "2");
        customer.put("address", "No indica");
        customer.put("municipality_code", BOGOTA_MUNICIPALITY_CODE);
        customer.put("email", email.isBlank() ? "consumidor@final.com" : email);
        customer.put("phone", "0000000000");
        customer.put("tribute_code", "ZZ");
        return customer;
    }

    private Map<String, Object> buildCustomer(String identification, String name, String email) {
        boolean isNit = identification.length() > 9;

        Map<String, Object> customer = new HashMap<>();
        customer.put("identification", identification);
        customer.put("names", name);
        if (isNit) {
            customer.put("company", name);
        }
        customer.put("identification_document_code", isNit ? "31" : "13");
        customer.put("legal_organization_code", isNit ? "1" : "2");
        customer.put("address", "No indica");
        customer.put("municipality_code", BOGOTA_MUNICIPALITY_CODE);
        customer.put("email", email);
        customer.put("phone", "0000000000");
        customer.put("tribute_code", isNit ? "ZZ" : "21");
        return customer;
    }

    private List<Map<String, Object>> buildPaymentDetails(Order order) {
        return List.of(Map.of(
                "payment_form", "1",
                "payment_method_code", "10",
                "amount", order.getTotal().setScale(2).toPlainString(),
                "reference_code", "pedido-" + order.getId()
        ));
    }

    private List<Map<String, Object>> buildItems(Order order) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("code_reference", String.valueOf(item.getProductId()));
            payload.put("name", item.getProductName());
            payload.put("quantity", String.format("%.2f", item.getQuantity().doubleValue()));
            payload.put("price", item.getUnitPrice().setScale(2).toPlainString());
            payload.put("discount_rate", "0.00");
            payload.put("unit_measure_code", UNIT_MEASURE_CODE);
            payload.put("standard_code", STANDARD_CODE);
            payload.put("taxes", defaultTaxes());
            items.add(payload);
        }
        return items;
    }

    private List<Map<String, Object>> defaultTaxes() {
        return List.of(Map.of(
                "code", "01",
                "rate", "0.00"
        ));
    }

    @SuppressWarnings("unchecked")
    private ElectronicInvoiceResponse parseResponse(Map<String, Object> body) {
        Map<String, Object> data = body != null && body.get("data") instanceof Map<?, ?> map
                ? (Map<String, Object>) map
                : Map.of();
        Map<String, Object> links = data.get("links") instanceof Map<?, ?> map
                ? (Map<String, Object>) map
                : Map.of();

        return ElectronicInvoiceResponse.builder()
                .number((String) data.get("number"))
                .cufe((String) data.get("cufe"))
                .qr((String) links.get("qr"))
                .pdfUrl((String) links.get("public_url"))
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
        try {
            return restTemplate.exchange(
                    baseUrl + path,
                    method,
                    entity,
                    (Class<Map<String, Object>>) (Class<?>) Map.class
            );
        } catch (HttpStatusCodeException e) {
            log.error("Factus request error {} {} -> {} body={}",
                    method, path, e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Factus rechazo la solicitud: " + cleanMessage(e.getResponseBodyAsString())
            );
        } catch (Exception e) {
            log.error("Error consumiendo Factus {} {}: {}", method, path, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No fue posible conectar con Factus: " + e.getMessage()
            );
        }
    }

    private String safeName(String customerName) {
        if (customerName == null || customerName.isBlank()) {
            return "Cliente";
        }
        return customerName.trim();
    }

    private String cleanMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "respuesta vacia";
        }
        return responseBody;
    }
}
