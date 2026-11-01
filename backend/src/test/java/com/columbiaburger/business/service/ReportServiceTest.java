package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.ReportResponse;
import com.columbiaburger.business.entity.*;
import com.columbiaburger.business.repository.OrderRepository;
import com.columbiaburger.business.repository.ShiftRepository;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReportServiceTest {

    private static final LocalDate DAY1 = LocalDate.of(2026, 10, 1);
    private static final LocalDate DAY2 = LocalDate.of(2026, 10, 2);

    private OrderRepository orderRepository;
    private ShiftRepository shiftRepository;
    private ReportService service;
    private Customer customer;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        shiftRepository = mock(ShiftRepository.class);
        service = new ReportService(orderRepository, shiftRepository, mock(ShiftService.class));
        customer = Customer.builder().id(1L).name("Ana").whatsapp("3000000000").build();
        when(shiftRepository.findByOpenedAtGreaterThanEqualAndOpenedAtLessThanOrderByOpenedAtDesc(any(), any()))
                .thenReturn(List.of());
    }

    /** Los pedidos se guardan en hora de Bogotá. */
    private static LocalDateTime bogota(LocalDate date, int hour) {
        return date.atTime(hour, 0);
    }

    private Order order(long id, LocalDateTime createdAtUtc, OrderStatus status, OrderSource source,
                        String total, String discount, String deliveryFee, OrderItem... items) {
        Order o = Order.builder()
                .id(id)
                .customer(customer)
                .createdAt(createdAtUtc)
                .status(status)
                .source(source)
                .total(new BigDecimal(total))
                .discount(discount == null ? null : new BigDecimal(discount))
                .deliveryFee(deliveryFee == null ? null : new BigDecimal(deliveryFee))
                .items(new ArrayList<>(List.of(items)))
                .build();
        return o;
    }

    private static OrderItem item(String name, int qty, String price) {
        return OrderItem.builder().productName(name).quantity(qty).unitPrice(new BigDecimal(price)).build();
    }

    private void givenOrders(List<Order> current, List<Order> previous) {
        when(orderRepository.findForReport(eq(ReportService.dayStart(DAY1)), eq(ReportService.dayStart(DAY2.plusDays(1)))))
                .thenReturn(current);
        when(orderRepository.findForReport(eq(ReportService.dayStart(DAY1.minusDays(2))), eq(ReportService.dayStart(DAY1))))
                .thenReturn(previous);
    }

    private List<Order> sampleOrders() {
        Order a = order(1, bogota(DAY1, 12), OrderStatus.DELIVERED, OrderSource.WEB, "30000", null, "5000",
                item("Clásica", 1, "25000"));
        Order b = order(2, bogota(DAY1, 20), OrderStatus.DELIVERED, OrderSource.WAITER, "45000", "5000", null,
                item("Clásica", 2, "20000"), item("Papas", 1, "10000"));
        b.setCouponCode("promo10");
        b.setElectronicInvoiceNumber("CB138");
        b.setElectronicPaymentMethodCode("48");
        b.setRating(5);
        // 23:30 del día 2 debe contar en el día 2 (y una de la madrugada del 3, en el 3)
        Order c = order(3, DAY2.atTime(23, 30), OrderStatus.DELIVERED, OrderSource.WEB, "20000", null, null,
                item("Papas", 2, "10000"));
        Order cancelled = order(4, bogota(DAY2, 13), OrderStatus.CANCELLED, OrderSource.WEB, "99000", null, null,
                item("Clásica", 5, "19800"));
        return List.of(a, b, c, cancelled);
    }

    @Test
    void summarizesRangeExcludingCancelledOrders() {
        givenOrders(sampleOrders(), List.of(
                order(9, bogota(DAY1.minusDays(1), 12), OrderStatus.DELIVERED, OrderSource.WEB, "50000", null, null)));

        ReportResponse r = service.build(DAY1, DAY2);
        ReportResponse.Summary s = r.getSummary();

        assertThat(s.getOrders()).isEqualTo(3);
        assertThat(s.getRevenue()).isEqualByComparingTo("95000");
        assertThat(s.getAverageTicket()).isEqualByComparingTo("31667");
        assertThat(s.getDiscounts()).isEqualByComparingTo("5000");
        assertThat(s.getDeliveryFees()).isEqualByComparingTo("5000");
        assertThat(s.getItemsSold()).isEqualTo(6);
        assertThat(s.getOrdersWithDiscount()).isEqualTo(1);
        assertThat(s.getCancelledOrders()).isEqualTo(1);
        assertThat(s.getCancelledAmount()).isEqualByComparingTo("99000");
        assertThat(s.getElectronicInvoices()).isEqualTo(1);
        assertThat(s.getAverageRating()).isEqualTo(5.0);
        assertThat(s.getBestDay()).isEqualTo("2026-10-01");

        assertThat(r.getPrevious().getFrom()).isEqualTo("2026-09-29");
        assertThat(r.getPrevious().getTo()).isEqualTo("2026-09-30");
        assertThat(r.getPrevious().getRevenue()).isEqualByComparingTo("50000");

        assertThat(r.getDaily()).hasSize(2);
        assertThat(r.getDaily().get(0).getRevenue()).isEqualByComparingTo("75000");
        assertThat(r.getDaily().get(1).getRevenue()).isEqualByComparingTo("20000"); // pedido de las 23:30

        assertThat(r.getByHour()).extracting(ReportResponse.HourRow::getHour).containsExactly(12, 20, 23);
        assertThat(r.getTopProducts().get(0).getName()).isEqualTo("Clásica");
        assertThat(r.getTopProducts().get(0).getQuantity()).isEqualTo(3);
        assertThat(r.getTopProducts().get(0).getRevenue()).isEqualByComparingTo("65000");
        assertThat(r.getCoupons()).singleElement()
                .satisfies(c -> {
                    assertThat(c.getCode()).isEqualTo("PROMO10");
                    assertThat(c.getDiscount()).isEqualByComparingTo("5000");
                });
        assertThat(r.getElectronicByPaymentMethod()).singleElement()
                .satisfies(g -> assertThat(g.getKey()).isEqualTo("Tarjeta"));
    }

    @Test
    void emptyRangeHasZeroTotals() {
        givenOrders(List.of(), List.of());

        ReportResponse r = service.build(DAY1, DAY2);

        assertThat(r.getSummary().getOrders()).isZero();
        assertThat(r.getSummary().getAverageTicket()).isEqualByComparingTo("0");
        assertThat(r.getSummary().getBestDay()).isNull();
        assertThat(r.getDaily()).hasSize(2);
    }

    @Test
    void rejectsInvalidRanges() {
        assertThatThrownBy(() -> service.build(DAY2, DAY1)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.build(DAY1, DAY1.plusDays(400))).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void exportsWorkbookWithAllSheets() throws Exception {
        givenOrders(sampleOrders(), List.of());

        byte[] xlsx = new ReportExportService(service).exportXlsx(DAY1, DAY2);

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
            assertThat(wb.getNumberOfSheets()).isEqualTo(5);
            assertThat(wb.getSheetName(0)).isEqualTo("Resumen");
            Sheet orders = wb.getSheet("Pedidos");
            assertThat(orders.getLastRowNum()).isEqualTo(4); // encabezado + 4 pedidos (incluye cancelado)
            assertThat(orders.getRow(2).getCell(6).getStringCellValue()).isEqualTo("2x Clásica, 1x Papas");
            assertThat(orders.getRow(2).getCell(12).getStringCellValue()).isEqualTo("CB138");
            assertThat(wb.getSheet("Por día").getRow(3).getCell(3).getCellFormula()).isEqualTo("SUM(D2:D3)");
        }
    }
}
