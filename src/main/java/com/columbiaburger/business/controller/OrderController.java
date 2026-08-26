package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.request.CreateOrderRequest;
import com.columbiaburger.business.dto.request.UpdateOrderRequest;
import com.columbiaburger.business.dto.request.UpdateOrderStatusRequest;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.dto.response.OrderTrackingResponse;
import com.columbiaburger.business.entity.OrderSource;
import com.columbiaburger.business.entity.OrderStatus;
import com.columbiaburger.business.security.JwtUtil;
import com.columbiaburger.business.service.InvoiceService;
import com.columbiaburger.business.service.OrderEventService;
import com.columbiaburger.business.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;
    private final OrderEventService orderEventService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse order = orderService.create(request);
        if (request.getSource() == OrderSource.WAITER) {
            order = invoiceService.generateInvoice(order.getId());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> findAll(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String from) {
        if (from != null) {
            java.time.LocalDateTime fromDate = java.time.LocalDateTime.parse(from);
            return ResponseEntity.ok(orderService.findFromDate(status, fromDate));
        }
        if (status != null) {
            return ResponseEntity.ok(orderService.findByStatus(status));
        }
        return ResponseEntity.ok(orderService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.findById(id));
    }

    @GetMapping("/kitchen")
    public ResponseEntity<List<OrderResponse>> getKitchenOrders() {
        return ResponseEntity.ok(orderService.getKitchenOrders());
    }

    @GetMapping("/delivery")
    public ResponseEntity<List<OrderResponse>> getDeliveryOrders() {
        return ResponseEntity.ok(orderService.getDeliveryOrders());
    }

    @GetMapping("/events")
    public SseEmitter events(@RequestParam String token) {
        if (!jwtUtil.isTokenValid(token)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Token inválido");
        }

        String role = jwtUtil.extractRole(token);
        if (!List.of("ADMIN", "KITCHEN", "DELIVERY").contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rol no autorizado");
        }

        return orderEventService.subscribe();
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<OrderTrackingResponse> getTracking(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getTracking(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request.getStatus()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderRequest request) {
        return ResponseEntity.ok(orderService.updateOrder(id, request));
    }

    @PostMapping("/{id}/rating")
    public ResponseEntity<Void> rateOrder(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Integer> body) {
        orderService.rateOrder(id, body.getOrDefault("rating", 0));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rate-by-whatsapp")
    public ResponseEntity<Void> rateByWhatsapp(@RequestBody java.util.Map<String, Object> body) {
        String whatsapp = (String) body.get("whatsapp");
        int rating = body.get("rating") instanceof Number n ? n.intValue() : 0;
        if (whatsapp != null && !whatsapp.isBlank()) {
            orderService.rateByWhatsapp(whatsapp, rating);
        }
        return ResponseEntity.ok().build();
    }
}
