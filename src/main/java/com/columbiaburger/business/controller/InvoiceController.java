package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.request.ElectronicInvoiceRequest;
import com.columbiaburger.business.dto.response.ElectronicInvoiceDetailResponse;
import com.columbiaburger.business.dto.response.ElectronicInvoiceResponse;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.service.FactusFileResponse;
import com.columbiaburger.business.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> list() {
        return ResponseEntity.ok(invoiceService.listInvoices());
    }

    @GetMapping("/electronic/{number}")
    public ResponseEntity<ElectronicInvoiceDetailResponse> getElectronicDetail(@PathVariable String number) {
        return ResponseEntity.ok(invoiceService.getElectronicInvoiceDetail(number));
    }

    @GetMapping("/electronic/{number}/pdf")
    public ResponseEntity<byte[]> downloadElectronicPdf(@PathVariable String number) {
        FactusFileResponse file = invoiceService.downloadElectronicInvoicePdf(number);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .body(file.getContent());
    }

    @GetMapping("/electronic/{number}/xml")
    public ResponseEntity<byte[]> downloadElectronicXml(@PathVariable String number) {
        FactusFileResponse file = invoiceService.downloadElectronicInvoiceXml(number);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .body(file.getContent());
    }

    @PostMapping("/{orderId}/generate")
    public ResponseEntity<OrderResponse> generate(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.generateInvoice(orderId));
    }

    @PatchMapping("/{orderId}/void")
    public ResponseEntity<OrderResponse> voidInvoice(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.voidInvoice(orderId));
    }

    @PostMapping("/{orderId}/electronic")
    public ResponseEntity<ElectronicInvoiceResponse> generateElectronic(
            @PathVariable Long orderId,
            @RequestBody(required = false) ElectronicInvoiceRequest req) {
        return ResponseEntity.ok(invoiceService.generateElectronicInvoice(orderId, req));
    }
}
