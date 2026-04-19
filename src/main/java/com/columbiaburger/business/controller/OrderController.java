package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.request.CreateOrderRequest;
import com.columbiaburger.business.dto.request.UpdateOrderStatusRequest;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.dto.response.OrderTrackingResponse;
import com.columbiaburger.business.entity.OrderStatus;
import com.columbiaburger.business.security.JwtUtil;
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
    private final OrderEventService orderEventService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(request));
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
}
