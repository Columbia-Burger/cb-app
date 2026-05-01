package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.CreateOrderRequest;
import com.columbiaburger.business.dto.request.OrderItemRequest;
import com.columbiaburger.business.dto.request.UpdateOrderRequest;
import com.columbiaburger.business.dto.response.OrderItemResponse;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.dto.response.OrderTrackingResponse;
import com.columbiaburger.business.entity.*;
import com.columbiaburger.business.entity.OrderSource;
import com.columbiaburger.business.repository.CustomerRepository;
import com.columbiaburger.business.repository.OrderItemRepository;
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
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final OrderEventService orderEventService;

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        Customer customer = customerRepository.findByWhatsapp(request.getCustomerWhatsapp())
                .orElseGet(() -> customerRepository.save(
                        Customer.builder()
                                .name(request.getCustomerName())
                                .whatsapp(request.getCustomerWhatsapp())
                                .neighborhood(request.getCustomerNeighborhood())
                                .address(request.getCustomerAddress())
                                .build()
                ));
        // Update name/neighborhood/address if provided and changed
        boolean changed = false;
        if (request.getCustomerName() != null && !request.getCustomerName().isBlank()
                && !request.getCustomerName().equals(customer.getName())) {
            customer.setName(request.getCustomerName()); changed = true;
        }
        if (request.getCustomerNeighborhood() != null && !request.getCustomerNeighborhood().isBlank()
                && !request.getCustomerNeighborhood().equals(customer.getNeighborhood())) {
            customer.setNeighborhood(request.getCustomerNeighborhood()); changed = true;
        }
        if (request.getCustomerAddress() != null && !request.getCustomerAddress().isBlank()
                && !request.getCustomerAddress().equals(customer.getAddress())) {
            customer.setAddress(request.getCustomerAddress()); changed = true;
        }
        if (request.getCustomerLatitude() != null) {
            customer.setLatitude(request.getCustomerLatitude()); changed = true;
        }
        if (request.getCustomerLongitude() != null) {
            customer.setLongitude(request.getCustomerLongitude()); changed = true;
        }
        if (changed) customerRepository.save(customer);

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
                .source(request.getSource() != null ? request.getSource() : OrderSource.WEB)
                .build();

        items.forEach(item -> item.setOrder(order));
        order.setItems(items);

        Order saved = orderRepository.save(order);
        OrderResponse response = toResponse(saved);
        orderEventService.publishCreated(response);
        return response;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByCustomerId(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::toResponse).toList();
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
    public List<OrderResponse> findFromDate(OrderStatus status, java.time.LocalDateTime from) {
        if (status != null) {
            return orderRepository.findByStatusAndCreatedAtAfterOrderByCreatedAtDesc(status, from).stream()
                    .map(this::toResponse).toList();
        }
        return orderRepository.findByCreatedAtAfterOrderByCreatedAtDesc(from).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return orderRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getKitchenOrders() {
        return orderRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(OrderStatus.RECEIVED, OrderStatus.PREPARING)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getDeliveryOrders() {
        return orderRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(OrderStatus.ON_THE_WAY)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderTrackingResponse getTracking(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        String firstName = order.getCustomer().getName();
        if (firstName != null && firstName.contains(" ")) {
            firstName = firstName.substring(0, firstName.indexOf(" "));
        }

        List<OrderTrackingResponse.TrackingItem> items = order.getItems() == null ? List.of() :
                order.getItems().stream()
                        .map(i -> OrderTrackingResponse.TrackingItem.builder()
                                .productName(i.getProductName())
                                .flavor(i.getFlavor())
                                .quantity(i.getQuantity())
                                .build())
                        .toList();

        return OrderTrackingResponse.builder()
                .id(order.getId())
                .customerFirstName(firstName)
                .status(order.getStatus())
                .total(order.getTotal())
                .deliveryFee(order.getDeliveryFee())
                .deliveryZone(order.getDeliveryZone())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        order.setStatus(status);
        OrderResponse response = toResponse(orderRepository.save(order));
        orderEventService.publishUpdated(response);
        return response;
    }

    @Transactional
    public OrderResponse updateOrder(Long id, UpdateOrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (request.getNotes() != null) order.setNotes(request.getNotes());
        if (request.getDeliveryZone() != null) order.setDeliveryZone(request.getDeliveryZone());
        if (request.getDeliveryFee() != null) order.setDeliveryFee(request.getDeliveryFee());

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            order.getItems().clear();
            List<OrderItem> newItems = request.getItems().stream().map(this::toOrderItem).toList();
            newItems.forEach(item -> item.setOrder(order));
            order.getItems().addAll(newItems);

            BigDecimal fee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
            BigDecimal itemsTotal = newItems.stream()
                    .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotal(itemsTotal.add(fee));
        } else if (request.getDeliveryFee() != null && order.getItems() != null) {
            BigDecimal itemsTotal = order.getItems().stream()
                    .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotal(itemsTotal.add(request.getDeliveryFee()));
        }

        OrderResponse response = toResponse(orderRepository.save(order));
        orderEventService.publishUpdated(response);
        return response;
    }

    private OrderItem toOrderItem(OrderItemRequest req) {
        return OrderItem.builder()
                .productId(req.getProductId())
                .productName(req.getProductName())
                .flavor(req.getFlavor())
                .additions(req.getAdditions())
                .quantity(req.getQuantity())
                .unitPrice(req.getUnitPrice())
                .note(req.getNote())
                .build();
    }

    public OrderResponse toResponse(Order o) {
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
                .customerLatitude(o.getCustomer().getLatitude())
                .customerLongitude(o.getCustomer().getLongitude())
                .source(o.getSource())
                .createdAt(o.getCreatedAt())
                .items(items)
                .invoiceStatus(o.getInvoiceStatus())
                .invoiceNumber(o.getInvoiceNumber())
                .invoicedAt(o.getInvoicedAt())
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem i) {
        return OrderItemResponse.builder()
                .id(i.getId())
                .productId(i.getProductId())
                .productName(i.getProductName())
                .flavor(i.getFlavor())
                .additions(i.getAdditions())
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .subtotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .note(i.getNote())
                .build();
    }
}
