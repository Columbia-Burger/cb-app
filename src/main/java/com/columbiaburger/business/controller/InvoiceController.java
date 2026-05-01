package com.columbiaburger.business.controller;

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
}
