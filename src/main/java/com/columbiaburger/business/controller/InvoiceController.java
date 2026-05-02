package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.request.ElectronicInvoiceRequest;
import com.columbiaburger.business.dto.response.ElectronicInvoiceResponse;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.service.InvoiceService;
import lombok.RequiredArgsConstructor;
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
