package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.response.CustomerResponse;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.repository.CustomerRepository;
import com.columbiaburger.business.service.CustomerService;
import com.columbiaburger.business.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final OrderService orderService;
    private final CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> findAll() {
        return ResponseEntity.ok(customerService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.findById(id));
    }

    /** Usado por n8n para inyectar datos del cliente en el system prompt del agente */
    @GetMapping("/whatsapp/{number}")
    public ResponseEntity<CustomerResponse> findByWhatsapp(@PathVariable String number) {
        return customerRepository.findByWhatsapp(number)
                .map(c -> ResponseEntity.ok(customerService.findById(c.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Usado por n8n para guardar ubicación del cliente */
    @PatchMapping("/whatsapp/{number}/location")
    public ResponseEntity<Void> updateLocation(
            @PathVariable String number,
            @RequestBody LocationRequest body) {
        customerRepository.findByWhatsapp(number).ifPresent(c -> {
            c.setLatitude(body.latitude());
            c.setLongitude(body.longitude());
            customerRepository.save(c);
        });
        return ResponseEntity.noContent().build();
    }

    record LocationRequest(Double latitude, Double longitude) {}

    @GetMapping("/me")
    public ResponseEntity<CustomerResponse> getMe(Authentication auth) {
        String whatsapp = auth.getName();
        return ResponseEntity.ok(
            customerRepository.findByWhatsapp(whatsapp)
                .map(c -> customerService.findById(c.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"))
        );
    }

    @GetMapping("/me/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication auth) {
        String whatsapp = auth.getName();
        Long customerId = customerRepository.findByWhatsapp(whatsapp)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"))
                .getId();
        return ResponseEntity.ok(orderService.findByCustomerId(customerId));
    }
}
