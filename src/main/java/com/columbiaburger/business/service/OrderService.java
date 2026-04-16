package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.CreateOrderRequest;
import com.columbiaburger.business.dto.request.OrderItemRequest;
import com.columbiaburger.business.dto.response.OrderItemResponse;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.entity.*;
import com.columbiaburger.business.repository.CustomerRepository;
import com.columbiaburger.business.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        Customer customer = customerRepository.findByWhatsapp(request.getCustomerWhatsapp())
                .orElseGet(() -> customerRepository.save(
                        Customer.builder()
                                .name(request.getCustomerName())
                                .whatsapp(request.getCustomerWhatsapp())
                                .neighborhood(request.getCustomerNeighborhood())
                                .build()
                ));

        List<OrderItem> items = request.getItems().stream()
                .map(this::toOrderItem)
                .toList();

        BigDecimal itemsTotal = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deliveryFee = request.getDeliveryFee() != null ? request.getDeliveryFee() : BigDecimal.ZERO;
        BigDecimal total = itemsTotal.add(deliveryFee);

        Order order = Order.builder()
                .customer(customer)
                .total(total)
                .deliveryFee(deliveryFee)
                .deliveryZone(request.getDeliveryZone())
                .notes(request.getNotes())
                .build();

        items.forEach(item -> item.setOrder(order));
        order.setItems(items);

        Order saved = orderRepository.save(order);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByStatus(OrderStatus status) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return orderRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        order.setStatus(status);
        return toResponse(orderRepository.save(order));
    }

    private OrderItem toOrderItem(OrderItemRequest req) {
        return OrderItem.builder()
                .productId(req.getProductId())
                .productName(req.getProductName())
                .flavor(req.getFlavor())
                .quantity(req.getQuantity())
                .unitPrice(req.getUnitPrice())
                .note(req.getNote())
                .build();
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems() == null ? List.of() :
                o.getItems().stream().map(this::toItemResponse).toList();

        return OrderResponse.builder()
                .id(o.getId())
                .customerId(o.getCustomer().getId())
                .customerName(o.getCustomer().getName())
                .customerWhatsapp(o.getCustomer().getWhatsapp())
                .status(o.getStatus())
                .total(o.getTotal())
                .deliveryFee(o.getDeliveryFee())
                .deliveryZone(o.getDeliveryZone())
                .notes(o.getNotes())
                .createdAt(o.getCreatedAt())
                .items(items)
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem i) {
        return OrderItemResponse.builder()
                .id(i.getId())
                .productId(i.getProductId())
                .productName(i.getProductName())
                .flavor(i.getFlavor())
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .subtotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .note(i.getNote())
                .build();
    }
}
