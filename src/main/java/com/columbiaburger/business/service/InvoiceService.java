package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.ElectronicInvoiceRequest;
import com.columbiaburger.business.dto.response.ElectronicInvoiceDetailResponse;
import com.columbiaburger.business.dto.response.ElectronicInvoiceResponse;
import com.columbiaburger.business.dto.response.OrderResponse;
import com.columbiaburger.business.entity.InvoiceStatus;
import com.columbiaburger.business.entity.OrderStatus;
import com.columbiaburger.business.entity.Order;
import com.columbiaburger.business.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final FactusService factusService;

    @Transactional(readOnly = true)
    public List<OrderResponse> listInvoices() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(orderService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ElectronicInvoiceDetailResponse getElectronicInvoiceDetail(String number) {
        return factusService.getBill(number);
    }

    @Transactional(readOnly = true)
    public FactusFileResponse downloadElectronicInvoicePdf(String number) {
        return factusService.downloadBillPdf(number);
    }

    @Transactional(readOnly = true)
    public FactusFileResponse downloadElectronicInvoiceXml(String number) {
        return factusService.downloadBillXml(number);
    }

    @Transactional
    public OrderResponse generateInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (order.getInvoiceStatus() == InvoiceStatus.INVOICED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El pedido ya tiene factura: " + order.getInvoiceNumber());
        }

        String number = buildInvoiceNumber();
        order.setInvoiceNumber(number);
        order.setInvoiceStatus(InvoiceStatus.INVOICED);
        order.setInvoicedAt(LocalDateTime.now());

        return orderService.toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse voidInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (order.getInvoiceStatus() != InvoiceStatus.INVOICED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se puede anular una factura emitida");
        }

        order.setInvoiceStatus(InvoiceStatus.VOID);
        order.setStatus(OrderStatus.CANCELLED);
        return orderService.toResponse(orderRepository.save(order));
    }

    @Transactional
    public ElectronicInvoiceResponse generateElectronicInvoice(Long orderId, ElectronicInvoiceRequest req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (order.getElectronicInvoiceNumber() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya tiene factura electrónica: " + order.getElectronicInvoiceNumber());
        }

        ElectronicInvoiceResponse result = factusService.createBill(
                order,
                req != null ? req.getCustomerDocumentType() : null,
                req != null ? req.getPaymentMethodCode() : null,
                req != null ? req.getCustomerIdentification() : null,
                req != null ? req.getCustomerName() : null,
                req != null ? req.getCustomerEmail() : null
        );

        order.setElectronicInvoiceNumber(result.getNumber());
        order.setCufe(result.getCufe());
        order.setElectronicPaymentMethodCode(resolvePaymentMethodCode(req != null ? req.getPaymentMethodCode() : null));
        order.setInvoiceStatus(InvoiceStatus.INVOICED);
        if (order.getInvoicedAt() == null) order.setInvoicedAt(LocalDateTime.now());
        orderRepository.save(order);

        return result;
    }

    private String buildInvoiceNumber() {
        int year = LocalDateTime.now().getYear();
        String prefix = "CB-" + year + "-";

        // Find the highest sequential number for this year
        long maxSeq = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(o -> o.getInvoiceNumber() != null && o.getInvoiceNumber().startsWith(prefix))
                .mapToLong(o -> {
                    try { return Long.parseLong(o.getInvoiceNumber().substring(prefix.length())); }
                    catch (NumberFormatException e) { return 0L; }
                })
                .max()
                .orElse(0L);

        return prefix + String.format("%04d", maxSeq + 1);
    }

    private String resolvePaymentMethodCode(String paymentMethodCode) {
        return switch (paymentMethodCode) {
            case "47", "48" -> paymentMethodCode;
            default -> "10";
        };
    }
}
