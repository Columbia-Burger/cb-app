package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.ReportResponse;
import com.columbiaburger.business.dto.response.ReportResponse.*;
import com.columbiaburger.business.dto.response.ShiftResponse;
import com.columbiaburger.business.entity.Order;
import com.columbiaburger.business.entity.OrderItem;
import com.columbiaburger.business.entity.OrderStatus;
import com.columbiaburger.business.repository.OrderRepository;
import com.columbiaburger.business.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reportes por rango de fechas. Las fechas del rango son días de Bogotá; en la base los pedidos
 * se guardan en hora UTC (igual que en AdminService), así que se convierte en ambos sentidos.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    static final ZoneId BOGOTA = ZoneId.of("America/Bogota");
    private static final ZoneId UTC = ZoneId.of("UTC");
    static final int MAX_DAYS = 366;

    private static final String[] WEEKDAYS = {"Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"};

    private final OrderRepository orderRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftService shiftService;

    /** Datos crudos de un rango, compartidos por el reporte y la exportación. */
    public record ReportData(LocalDate from, LocalDate to, List<Order> orders, ReportResponse report) {}

    @Transactional(readOnly = true)
    public ReportResponse build(LocalDate from, LocalDate to) {
        return load(from, to).report();
    }

    @Transactional(readOnly = true)
    public ReportData load(LocalDate from, LocalDate to) {
        validateRange(from, to);
        List<Order> orders = orderRepository.findForReport(toUtc(from), toUtc(to.plusDays(1)));
        List<Order> valid = orders.stream().filter(o -> o.getStatus() != OrderStatus.CANCELLED).toList();
        List<Order> cancelled = orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).toList();

        List<DayRow> daily = buildDaily(from, to, valid);
        DayRow best = daily.stream()
                .filter(d -> d.getOrders() > 0)
                .max(Comparator.comparing(DayRow::getRevenue))
                .orElse(null);

        long days = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate prevTo = from.minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(days - 1);
        List<Order> previousOrders = orderRepository.findForReport(toUtc(prevFrom), toUtc(prevTo.plusDays(1)))
                .stream().filter(o -> o.getStatus() != OrderStatus.CANCELLED).toList();
        BigDecimal prevRevenue = sum(previousOrders, Order::getTotal);

        BigDecimal revenue = sum(valid, Order::getTotal);
        List<Order> rated = valid.stream().filter(o -> o.getRating() != null).toList();
        List<Order> electronic = valid.stream().filter(o -> o.getElectronicInvoiceNumber() != null).toList();

        Summary summary = Summary.builder()
                .orders(valid.size())
                .revenue(revenue)
                .averageTicket(average(revenue, valid.size()))
                .discounts(sum(valid, Order::getDiscount))
                .deliveryFees(sum(valid, Order::getDeliveryFee))
                .itemsSold(valid.stream().flatMap(o -> items(o).stream()).mapToLong(OrderItem::getQuantity).sum())
                .ordersWithDiscount(valid.stream().filter(o -> positive(o.getDiscount())).count())
                .cancelledOrders(cancelled.size())
                .cancelledAmount(sum(cancelled, Order::getTotal))
                .electronicInvoices(electronic.size())
                .electronicInvoicedAmount(sum(electronic, Order::getTotal))
                .averageRating(rated.isEmpty() ? null
                        : Math.round(rated.stream().mapToInt(Order::getRating).average().orElse(0) * 10) / 10.0)
                .ratedOrders(rated.size())
                .bestDay(best != null ? best.getDate() : null)
                .bestDayRevenue(best != null ? best.getRevenue() : null)
                .build();

        ReportResponse report = ReportResponse.builder()
                .from(from.toString())
                .to(to.toString())
                .summary(summary)
                .previous(PreviousPeriod.builder()
                        .from(prevFrom.toString())
                        .to(prevTo.toString())
                        .orders(previousOrders.size())
                        .revenue(prevRevenue)
                        .averageTicket(average(prevRevenue, previousOrders.size()))
                        .build())
                .daily(daily)
                .bySource(group(valid, o -> o.getSource().name()))
                .byStatus(group(orders, o -> o.getStatus().name()))
                .byHour(buildHourly(valid))
                .byWeekday(buildWeekday(valid))
                .topProducts(buildTopProducts(valid))
                .electronicByPaymentMethod(group(electronic, o -> paymentMethodLabel(o.getElectronicPaymentMethodCode())))
                .coupons(buildCoupons(valid))
                .shifts(buildShifts(from, to))
                .build();

        return new ReportData(from, to, orders, report);
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica la fecha inicial y final");
        }
        if (to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha final no puede ser anterior a la inicial");
        }
        if (ChronoUnit.DAYS.between(from, to) + 1 > MAX_DAYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango máximo es de " + MAX_DAYS + " días");
        }
    }

    private List<DayRow> buildDaily(LocalDate from, LocalDate to, List<Order> valid) {
        Map<LocalDate, List<Order>> byDate = valid.stream().collect(Collectors.groupingBy(o -> bogotaDate(o.getCreatedAt())));
        List<DayRow> rows = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<Order> dayOrders = byDate.getOrDefault(d, List.of());
            rows.add(DayRow.builder().date(d.toString()).orders(dayOrders.size()).revenue(sum(dayOrders, Order::getTotal)).build());
        }
        return rows;
    }

    private List<HourRow> buildHourly(List<Order> valid) {
        Map<Integer, List<Order>> byHour = valid.stream().collect(Collectors.groupingBy(o -> toBogota(o.getCreatedAt()).getHour()));
        return byHour.keySet().stream().sorted()
                .map(h -> HourRow.builder().hour(h).orders(byHour.get(h).size()).revenue(sum(byHour.get(h), Order::getTotal)).build())
                .toList();
    }

    private List<GroupRow> buildWeekday(List<Order> valid) {
        Map<DayOfWeek, List<Order>> byDay = valid.stream().collect(Collectors.groupingBy(o -> bogotaDate(o.getCreatedAt()).getDayOfWeek()));
        return Arrays.stream(DayOfWeek.values())
                .map(d -> {
                    List<Order> list = byDay.getOrDefault(d, List.of());
                    return GroupRow.builder().key(WEEKDAYS[d.getValue() - 1]).orders(list.size()).revenue(sum(list, Order::getTotal)).build();
                })
                .toList();
    }

    private List<ProductRow> buildTopProducts(List<Order> valid) {
        Map<String, long[]> qty = new HashMap<>();
        Map<String, BigDecimal> revenue = new HashMap<>();
        for (Order o : valid) {
            for (OrderItem i : items(o)) {
                qty.computeIfAbsent(i.getProductName(), k -> new long[1])[0] += i.getQuantity();
                revenue.merge(i.getProductName(), i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())), BigDecimal::add);
            }
        }
        return qty.keySet().stream()
                .map(name -> ProductRow.builder().name(name).quantity(qty.get(name)[0]).revenue(revenue.get(name)).build())
                .sorted(Comparator.comparingLong(ProductRow::getQuantity).reversed().thenComparing(ProductRow::getName))
                .toList();
    }

    private List<CouponRow> buildCoupons(List<Order> valid) {
        Map<String, List<Order>> byCoupon = valid.stream()
                .filter(o -> o.getCouponCode() != null && !o.getCouponCode().isBlank())
                .collect(Collectors.groupingBy(o -> o.getCouponCode().toUpperCase(Locale.ROOT)));
        return byCoupon.entrySet().stream()
                .map(e -> CouponRow.builder().code(e.getKey()).uses(e.getValue().size()).discount(sum(e.getValue(), Order::getDiscount)).build())
                .sorted(Comparator.comparingLong(CouponRow::getUses).reversed())
                .toList();
    }

    private List<ShiftRow> buildShifts(LocalDate from, LocalDate to) {
        return shiftRepository
                .findByOpenedAtGreaterThanEqualAndOpenedAtLessThanOrderByOpenedAtDesc(toUtc(from), toUtc(to.plusDays(1)))
                .stream()
                .map(shiftService::toResponseWithSummary)
                .map(this::toShiftRow)
                .toList();
    }

    private ShiftRow toShiftRow(ShiftResponse s) {
        return ShiftRow.builder()
                .id(s.getId())
                .openedAt(s.getOpenedAt() != null ? toBogota(s.getOpenedAt()).toString() : null)
                .closedAt(s.getClosedAt() != null ? toBogota(s.getClosedAt()).toString() : null)
                .active(s.isActive())
                .orders(s.getTotalOrders() != null ? s.getTotalOrders() : 0)
                .revenue(s.getTotalRevenue())
                .initialCash(s.getInitialCash())
                .finalCash(s.getFinalCash())
                .expectedCash(s.getExpectedCash())
                .difference(s.getDifference())
                .build();
    }

    // ── Utilidades ───────────────────────────────────────────────

    private List<GroupRow> group(List<Order> orders, Function<Order, String> key) {
        Map<String, List<Order>> grouped = orders.stream().collect(Collectors.groupingBy(key));
        return grouped.entrySet().stream()
                .map(e -> GroupRow.builder().key(e.getKey()).orders(e.getValue().size()).revenue(sum(e.getValue(), Order::getTotal)).build())
                .sorted(Comparator.comparing(GroupRow::getRevenue).reversed())
                .toList();
    }

    static String paymentMethodLabel(String code) {
        if (code == null) return "Sin dato";
        return switch (code) {
            case "47" -> "Transferencia";
            case "48" -> "Tarjeta";
            default -> "Efectivo";
        };
    }

    static List<OrderItem> items(Order o) {
        return o.getItems() != null ? o.getItems() : List.of();
    }

    static BigDecimal sum(List<Order> orders, Function<Order, BigDecimal> field) {
        return orders.stream().map(field).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal average(BigDecimal total, long count) {
        return count == 0 ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(count), 0, RoundingMode.HALF_UP);
    }

    private static boolean positive(BigDecimal value) {
        return value != null && value.signum() > 0;
    }

    static LocalDateTime toUtc(LocalDate bogotaDate) {
        return bogotaDate.atStartOfDay(BOGOTA).withZoneSameInstant(UTC).toLocalDateTime();
    }

    static LocalDateTime toBogota(LocalDateTime utc) {
        return utc.atZone(UTC).withZoneSameInstant(BOGOTA).toLocalDateTime();
    }

    static LocalDate bogotaDate(LocalDateTime utc) {
        return toBogota(utc).toLocalDate();
    }
}
