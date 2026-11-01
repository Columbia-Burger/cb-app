package com.columbiaburger.business.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

/** Reporte de ventas de un rango de fechas (en hora de Bogotá, ambos días incluidos). */
@Getter
@Builder
public class ReportResponse {
    private String from;
    private String to;
    private Summary summary;
    /** Mismo número de días inmediatamente antes del rango, para comparar. */
    private PreviousPeriod previous;
    private List<DayRow> daily;
    private List<GroupRow> bySource;
    private List<GroupRow> byStatus;
    private List<HourRow> byHour;
    private List<GroupRow> byWeekday;
    private List<ProductRow> topProducts;
    /** Medio de pago: solo disponible para pedidos con factura electrónica. */
    private List<GroupRow> electronicByPaymentMethod;
    private List<CouponRow> coupons;
    private List<ShiftRow> shifts;

    @Getter @Builder
    public static class Summary {
        private long orders;
        private BigDecimal revenue;
        private BigDecimal averageTicket;
        private BigDecimal discounts;
        private BigDecimal deliveryFees;
        private long itemsSold;
        private long ordersWithDiscount;
        private long cancelledOrders;
        private BigDecimal cancelledAmount;
        private long electronicInvoices;
        private BigDecimal electronicInvoicedAmount;
        private Double averageRating;
        private long ratedOrders;
        private String bestDay;
        private BigDecimal bestDayRevenue;
    }

    @Getter @Builder
    public static class PreviousPeriod {
        private String from;
        private String to;
        private long orders;
        private BigDecimal revenue;
        private BigDecimal averageTicket;
    }

    @Getter @Builder
    public static class DayRow {
        private String date;
        private long orders;
        private BigDecimal revenue;
    }

    @Getter @Builder
    public static class GroupRow {
        private String key;
        private long orders;
        private BigDecimal revenue;
    }

    @Getter @Builder
    public static class HourRow {
        private int hour;
        private long orders;
        private BigDecimal revenue;
    }

    @Getter @Builder
    public static class ProductRow {
        private String name;
        private long quantity;
        private BigDecimal revenue;
    }

    @Getter @Builder
    public static class CouponRow {
        private String code;
        private long uses;
        private BigDecimal discount;
    }

    @Getter @Builder
    public static class ShiftRow {
        private Long id;
        private String openedAt;
        private String closedAt;
        private boolean active;
        private long orders;
        private BigDecimal revenue;
        private BigDecimal initialCash;
        private BigDecimal finalCash;
        private BigDecimal expectedCash;
        private BigDecimal difference;
    }
}
