package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.ElectronicInvoiceDetailResponse;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FactusService {

    private static final String CONSUMIDOR_FINAL_ID = "222222222222";
    private static final String DELIVERY_CODE_REFERENCE = "DOMICILIO";
    private static final String UNIT_MEASURE_CODE = "94";
    private static final String STANDARD_CODE = "999";

    private final RestTemplate restTemplate;
    private final FactusTokenService tokenService;

    @Value("${factus.base-url}")
    private String baseUrl;

    @Value("${factus.numbering-range-id}")
    private int numberingRangeId;

    @Value("${factus.tax-code}")
    private String taxCode;

    @Value("${factus.tax-rate}")
    private String taxRate;

    @Value("${factus.municipality-code}")
    private String municipalityCode;

    public ElectronicInvoiceResponse createBill(Order order, String customerDocumentType, String paymentMethodCode,
                                                String customerIdentification,
                                                 String customerName, String customerEmail) {
        Map<String, Object> payload = buildPayload(
                order, customerDocumentType, paymentMethodCode, customerIdentification, customerName, customerEmail
        );

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

    public ElectronicInvoiceDetailResponse getBill(String number) {
        HttpHeaders headers = buildHeaders();
        ResponseEntity<Map<String, Object>> response = exchange(
                "/v2/bills/" + number,
                HttpMethod.GET,
                new HttpEntity<>(headers)
        );
        return parseDetailResponse(response.getBody());
    }

    public FactusFileResponse downloadBillPdf(String number) {
        return downloadFile(number, "/v2/bills/" + number + "/download-pdf", "pdf_base_64_encoded", ".pdf");
    }

    public FactusFileResponse downloadBillXml(String number) {
        return downloadFile(number, "/v2/bills/" + number + "/download-xml/", "xml_base_64_encoded", ".xml");
    }

    private Map<String, Object> buildPayload(Order order, String documentType, String paymentMethodCode,
                                             String identification,
                                             String customerName, String customerEmail) {
        boolean isConsumidorFinal = identification == null || identification.isBlank();
        String id = isConsumidorFinal ? CONSUMIDOR_FINAL_ID : cleanIdentification(identification);
        String name = isConsumidorFinal ? "Consumidor Final" : safeName(customerName);
        String email = (customerEmail != null && !customerEmail.isBlank())
                ? customerEmail.trim()
                : "consumidor@final.com";

        Map<String, Object> customer = isConsumidorFinal
                ? buildConsumidorFinalCustomer(email)
                : buildCustomer(documentType, id, name, email);

        Map<String, Object> payload = new HashMap<>();
        payload.put("numbering_range_id", numberingRangeId);
        payload.put("reference_code", "PED-" + order.getId());
        payload.put("document", "01");
        payload.put("operation_type", "10");
        payload.put("observation", "Pedido #" + order.getId());
        payload.put("send_email", true);
        List<InvoiceLine> lines = buildLines(order);
        BigDecimal discountRate = discountRate(order, lines);

        payload.put("customer", customer);
        payload.put("payment_details", buildPaymentDetails(order, paymentMethodCode, payableAmount(lines, discountRate)));
        payload.put("items", buildItems(lines, discountRate));
        return payload;
    }

    private Map<String, Object> buildConsumidorFinalCustomer(String email) {
        Map<String, Object> customer = new HashMap<>();
        customer.put("identification", CONSUMIDOR_FINAL_ID);
        customer.put("names", "Consumidor Final");
        customer.put("identification_document_code", "13");
        customer.put("legal_organization_code", "2");
        customer.put("address", "No indica");
        customer.put("municipality_code", municipalityCode);
        customer.put("email", email.isBlank() ? "consumidor@final.com" : email);
        customer.put("phone", "0000000000");
        customer.put("tribute_code", "ZZ");
        return customer;
    }

    private Map<String, Object> buildCustomer(String documentType, String identification, String name, String email) {
        boolean isNit = "NIT".equalsIgnoreCase(documentType)
                || (documentType == null || documentType.isBlank()) && identification.length() > 9;

        Map<String, Object> customer = new HashMap<>();
        customer.put("identification", identification);
        customer.put("names", name);
        if (isNit) {
            customer.put("company", name);
        }
        customer.put("identification_document_code", isNit ? "31" : "13");
        customer.put("legal_organization_code", isNit ? "1" : "2");
        customer.put("address", "No indica");
        customer.put("municipality_code", municipalityCode);
        customer.put("email", email);
        customer.put("phone", "0000000000");
        customer.put("tribute_code", "ZZ");
        return customer;
    }

    private List<Map<String, Object>> buildPaymentDetails(Order order, String paymentMethodCode, BigDecimal amount) {
        String resolvedPaymentMethodCode = "47".equals(paymentMethodCode) || "48".equals(paymentMethodCode)
                ? paymentMethodCode
                : "10";

        return List.of(Map.of(
                "payment_form", "1",
                "payment_method_code", resolvedPaymentMethodCode,
                "amount", amount.toPlainString(),
                "reference_code", "pedido-" + order.getId()
        ));
    }

    private record InvoiceLine(String codeReference, String name, BigDecimal quantity, BigDecimal price) {
        BigDecimal gross() {
            return price.multiply(quantity);
        }
    }

    // El domicilio hace parte de order.total, así que va como una línea más de la factura
    private List<InvoiceLine> buildLines(Order order) {
        List<InvoiceLine> lines = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            lines.add(new InvoiceLine(
                    String.valueOf(item.getProductId()),
                    item.getProductName(),
                    BigDecimal.valueOf(item.getQuantity()),
                    item.getUnitPrice()
            ));
        }
        BigDecimal deliveryFee = order.getDeliveryFee();
        if (deliveryFee != null && deliveryFee.signum() > 0) {
            lines.add(new InvoiceLine(DELIVERY_CODE_REFERENCE, "Domicilio", BigDecimal.ONE, deliveryFee));
        }
        return lines;
    }

    // El descuento del pedido aplica sobre ítems + domicilio; se reparte como % uniforme en cada línea
    private BigDecimal discountRate(Order order, List<InvoiceLine> lines) {
        BigDecimal discount = order.getDiscount();
        BigDecimal subtotal = lines.stream().map(InvoiceLine::gross).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (discount == null || discount.signum() <= 0 || subtotal.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return discount.multiply(BigDecimal.valueOf(100))
                .divide(subtotal, 2, RoundingMode.HALF_UP)
                .min(BigDecimal.valueOf(100).setScale(2));
    }

    // Se calcula con el mismo % enviado a Factus para que el pago cuadre con la suma de las líneas
    private BigDecimal payableAmount(List<InvoiceLine> lines, BigDecimal discountRate) {
        BigDecimal factor = BigDecimal.ONE.subtract(discountRate.movePointLeft(2));
        return lines.stream()
                .map(line -> line.gross().multiply(factor).setScale(2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add);
    }

    private List<Map<String, Object>> buildItems(List<InvoiceLine> lines, BigDecimal discountRate) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (InvoiceLine line : lines) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("code_reference", line.codeReference());
            payload.put("name", line.name());
            payload.put("quantity", line.quantity().setScale(2, RoundingMode.HALF_UP).toPlainString());
            payload.put("price", line.price().setScale(2, RoundingMode.HALF_UP).toPlainString());
            payload.put("discount_rate", discountRate.toPlainString());
            payload.put("unit_measure_code", UNIT_MEASURE_CODE);
            payload.put("standard_code", STANDARD_CODE);
            payload.put("taxes", defaultTaxes());
            items.add(payload);
        }
        return items;
    }

    private List<Map<String, Object>> defaultTaxes() {
        return List.of(Map.of(
                "code", taxCode,
                "rate", taxRate
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

    @SuppressWarnings("unchecked")
    private ElectronicInvoiceDetailResponse parseDetailResponse(Map<String, Object> body) {
        Map<String, Object> data = objectMap(body.get("data"));
        Map<String, Object> paymentForm = objectMap(data.get("payment_form"));
        Map<String, Object> paymentMethod = objectMap(data.get("payment_method"));
        Map<String, Object> customer = objectMap(data.get("customer"));
        Map<String, Object> customerDocument = objectMap(customer.get("identification_document"));
        Map<String, Object> customerLegalOrg = objectMap(customer.get("legal_organization"));
        Map<String, Object> customerTribute = objectMap(customer.get("tribute"));
        Map<String, Object> customerMunicipality = objectMap(customer.get("municipality"));
        Map<String, Object> customerDepartment = objectMap(customerMunicipality.get("department"));
        Map<String, Object> totals = objectMap(data.get("totals"));
        Map<String, Object> links = objectMap(data.get("links"));

        List<ElectronicInvoiceDetailResponse.Item> items = listOfMaps(data.get("items")).stream()
                .map(this::toDetailItem)
                .toList();

        return ElectronicInvoiceDetailResponse.builder()
                .number(stringValue(data.get("number")))
                .referenceCode(stringValue(data.get("reference_code")))
                .cufe(stringValue(data.get("cufe")))
                .documentName(stringValue(objectMap(data.get("document_type")).get("name")))
                .operationTypeName(stringValue(objectMap(data.get("operation_type")).get("name")))
                .validated(booleanValue(data.get("is_validated")))
                .validatedAt(stringValue(data.get("validated_at")))
                .createdAt(stringValue(data.get("created_at")))
                .observation(stringValue(data.get("observation")))
                .sendEmail(booleanValue(data.get("send_email")))
                .qrUrl(stringValue(links.get("qr")))
                .publicUrl(stringValue(links.get("public_url")))
                .payment(ElectronicInvoiceDetailResponse.Payment.builder()
                        .formCode(stringValue(paymentForm.get("code")))
                        .formName(stringValue(paymentForm.get("name")))
                        .methodCode(stringValue(paymentMethod.get("code")))
                        .methodName(stringValue(paymentMethod.get("name")))
                        .build())
                .customer(ElectronicInvoiceDetailResponse.Customer.builder()
                        .documentCode(stringValue(customerDocument.get("code")))
                        .documentName(stringValue(customerDocument.get("name")))
                        .identification(stringValue(customer.get("identification")))
                        .dv(stringValue(customer.get("dv")))
                        .company(stringValue(customer.get("company")))
                        .names(stringValue(customer.get("names")))
                        .email(stringValue(customer.get("email")))
                        .phone(stringValue(customer.get("phone")))
                        .address(stringValue(customer.get("address")))
                        .legalOrganizationCode(stringValue(customerLegalOrg.get("code")))
                        .legalOrganizationName(stringValue(customerLegalOrg.get("name")))
                        .tributeCode(stringValue(customerTribute.get("code")))
                        .tributeName(stringValue(customerTribute.get("name")))
                        .municipality(stringValue(customerMunicipality.get("name")))
                        .department(stringValue(customerDepartment.get("name")))
                        .build())
                .totals(ElectronicInvoiceDetailResponse.Totals.builder()
                        .grossValue(stringValue(totals.get("gross_value")))
                        .taxableAmount(stringValue(totals.get("taxable_amount")))
                        .taxAmount(stringValue(totals.get("tax_amount")))
                        .discountAmount(stringValue(totals.get("discount_amount")))
                        .total(stringValue(totals.get("total")))
                        .build())
                .items(items)
                .errors(stringMap(data.get("errors")))
                .build();
    }

    private ElectronicInvoiceDetailResponse.Item toDetailItem(Map<String, Object> item) {
        String taxSummary = listOfMaps(item.get("taxes")).stream()
                .map(tax -> {
                    String tribute = stringValue(objectMap(tax.get("tribute")).get("name"));
                    String rates = listOfMaps(tax.get("rates")).stream()
                            .map(rate -> stringValue(rate.get("rate")) + "%")
                            .collect(Collectors.joining(", "));
                    return (tribute.isBlank() ? "Impuesto" : tribute) + (rates.isBlank() ? "" : " " + rates);
                })
                .collect(Collectors.joining(" | "));

        return ElectronicInvoiceDetailResponse.Item.builder()
                .codeReference(stringValue(item.get("code_reference")))
                .name(stringValue(item.get("name")))
                .quantity(stringValue(item.get("quantity")))
                .price(stringValue(item.get("price")))
                .total(stringValue(item.get("total")))
                .discountRate(stringValue(item.get("discount_rate")))
                .taxSummary(taxSummary)
                .build();
    }

    private FactusFileResponse downloadFile(String number, String path, String encodedField, String extension) {
        HttpHeaders headers = buildHeaders();
        ResponseEntity<Map<String, Object>> response = exchange(path, HttpMethod.GET, new HttpEntity<>(headers));
        Map<String, Object> data = objectMap(response.getBody().get("data"));
        String fileName = stringValue(data.get("file_name"));
        String encoded = stringValue(data.get(encodedField));
        byte[] content = Base64.getDecoder().decode(encoded);
        String safeFileName = fileName.isBlank() ? number + extension : fileName + extension;
        return new FactusFileResponse(safeFileName, content);
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

    // Factus pide el NIT sin DV ni guion ("900.123.456-7" → "900123456"); el DV lo calcula Factus
    private String cleanIdentification(String identification) {
        return identification.split("-")[0].replaceAll("\\D", "");
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> objectMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> listOfMaps(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .toList();
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private boolean booleanValue(Object value) {
        return value instanceof Boolean bool && bool;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> stringMap(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            return Map.of();
        }
        Map<String, String> result = new HashMap<>();
        map.forEach((key, val) -> result.put(String.valueOf(key), String.valueOf(val)));
        return result;
    }
}
