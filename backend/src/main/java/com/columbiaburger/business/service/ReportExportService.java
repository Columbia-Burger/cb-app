package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.ReportResponse;
import com.columbiaburger.business.dto.response.ReportResponse.*;
import com.columbiaburger.business.entity.Order;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Exporta el reporte de un rango a un Excel con varias hojas. */
@Service
@RequiredArgsConstructor
public class ReportExportService {

    private static final Map<String, String> SOURCE_LABELS = Map.of(
            "WEB", "Web", "WHATSAPP", "WhatsApp", "WAITER", "Mesero", "DELIVERY", "Domicilio");
    private static final Map<String, String> STATUS_LABELS = Map.of(
            "RECEIVED", "Recibido", "PREPARING", "En preparación", "ON_THE_WAY", "En camino",
            "DELIVERED", "Entregado", "CANCELLED", "Cancelado");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final ReportService reportService;

    @Transactional(readOnly = true)
    public byte[] exportXlsx(LocalDate from, LocalDate to) {
        ReportService.ReportData data = reportService.load(from, to);
        ReportResponse r = data.report();

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles s = new Styles(wb);
            writeSummary(wb, s, r);
            writeDaily(wb, s, r.getDaily());
            writeProducts(wb, s, r.getTopProducts());
            writeOrders(wb, s, data.orders());
            writeShifts(wb, s, r.getShifts());
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el Excel", e);
        }
    }

    private void writeSummary(Workbook wb, Styles s, ReportResponse r) {
        Sheet sh = wb.createSheet("Resumen");
        Summary sum = r.getSummary();
        int row = 0;
        Row title = sh.createRow(row++);
        cell(title, 0, "Reporte Columbia Burger", s.title);
        sh.addMergedRegion(new CellRangeAddress(0, 0, 0, 2));
        cell(sh.createRow(row++), 0, "Del " + fmtDate(r.getFrom()) + " al " + fmtDate(r.getTo()), null);
        row++;

        Row header = sh.createRow(row++);
        cell(header, 0, "Indicador", s.header);
        cell(header, 1, "Este periodo", s.header);
        cell(header, 2, "Periodo anterior", s.header);

        Previous p = new Previous(r.getPrevious());
        row = metric(sh, s, row, "Pedidos", sum.getOrders(), p.orders, false);
        row = metric(sh, s, row, "Ventas", sum.getRevenue(), p.revenue, true);
        row = metric(sh, s, row, "Ticket promedio", sum.getAverageTicket(), p.averageTicket, true);
        row = metric(sh, s, row, "Productos vendidos", sum.getItemsSold(), null, false);
        row = metric(sh, s, row, "Descuentos otorgados", sum.getDiscounts(), null, true);
        row = metric(sh, s, row, "Pedidos con descuento", sum.getOrdersWithDiscount(), null, false);
        row = metric(sh, s, row, "Domicilios cobrados", sum.getDeliveryFees(), null, true);
        row = metric(sh, s, row, "Pedidos cancelados", sum.getCancelledOrders(), null, false);
        row = metric(sh, s, row, "Valor cancelado", sum.getCancelledAmount(), null, true);
        row = metric(sh, s, row, "Facturas electrónicas", sum.getElectronicInvoices(), null, false);
        row = metric(sh, s, row, "Valor facturado electrónicamente", sum.getElectronicInvoicedAmount(), null, true);
        if (sum.getAverageRating() != null) {
            Row rr = sh.createRow(row++);
            cell(rr, 0, "Calificación promedio", null);
            cell(rr, 1, sum.getAverageRating() + " (" + sum.getRatedOrders() + " calificaciones)", null);
        }
        if (sum.getBestDay() != null) {
            Row br = sh.createRow(row++);
            cell(br, 0, "Mejor día", null);
            cell(br, 1, fmtDate(sum.getBestDay()) + " — $" + String.format("%,d", sum.getBestDayRevenue().longValue()).replace(',', '.'), null);
        }

        row++;
        row = groupTable(sh, s, row, "Por canal", r.getBySource(), SOURCE_LABELS);
        row = groupTable(sh, s, row, "Por día de la semana", r.getByWeekday(), Map.of());
        if (!r.getElectronicByPaymentMethod().isEmpty()) {
            row = groupTable(sh, s, row, "Facturas electrónicas por medio de pago", r.getElectronicByPaymentMethod(), Map.of());
        }
        if (!r.getCoupons().isEmpty()) {
            Row h = sh.createRow(row++);
            cell(h, 0, "Cupón", s.header);
            cell(h, 1, "Usos", s.header);
            cell(h, 2, "Descuento", s.header);
            for (CouponRow c : r.getCoupons()) {
                Row cr = sh.createRow(row++);
                cell(cr, 0, c.getCode(), null);
                number(cr, 1, c.getUses(), s.integer);
                money(cr, 2, c.getDiscount(), s.money);
            }
        }
        autosize(sh, 3);
    }

    private int metric(Sheet sh, Styles s, int row, String label, Object current, Object previous, boolean isMoney) {
        Row r = sh.createRow(row);
        cell(r, 0, label, null);
        writeValue(r, 1, current, isMoney, s);
        if (previous != null) writeValue(r, 2, previous, isMoney, s);
        return row + 1;
    }

    private void writeValue(Row r, int col, Object value, boolean isMoney, Styles s) {
        if (value instanceof BigDecimal bd) money(r, col, bd, isMoney ? s.money : s.integer);
        else if (value instanceof Number n) number(r, col, n.longValue(), s.integer);
    }

    private int groupTable(Sheet sh, Styles s, int row, String title, List<GroupRow> rows, Map<String, String> labels) {
        Row h = sh.createRow(row++);
        cell(h, 0, title, s.header);
        cell(h, 1, "Pedidos", s.header);
        cell(h, 2, "Ventas", s.header);
        for (GroupRow g : rows) {
            Row gr = sh.createRow(row++);
            cell(gr, 0, labels.getOrDefault(g.getKey(), g.getKey()), null);
            number(gr, 1, g.getOrders(), s.integer);
            money(gr, 2, g.getRevenue(), s.money);
        }
        return row + 1;
    }

    private void writeDaily(Workbook wb, Styles s, List<DayRow> daily) {
        Sheet sh = wb.createSheet("Por día");
        Row h = sh.createRow(0);
        String[] cols = {"Fecha", "Día", "Pedidos", "Ventas"};
        for (int i = 0; i < cols.length; i++) cell(h, i, cols[i], s.header);
        int row = 1;
        for (DayRow d : daily) {
            LocalDate date = LocalDate.parse(d.getDate());
            Row r = sh.createRow(row++);
            cell(r, 0, date.format(DATE), null);
            cell(r, 1, capitalize(date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, new java.util.Locale("es", "CO"))), null);
            number(r, 2, d.getOrders(), s.integer);
            money(r, 3, d.getRevenue(), s.money);
        }
        totalsRow(sh, s, row, 2, 3);
        sh.createFreezePane(0, 1);
        autosize(sh, cols.length);
    }

    private void writeProducts(Workbook wb, Styles s, List<ProductRow> products) {
        Sheet sh = wb.createSheet("Productos");
        Row h = sh.createRow(0);
        String[] cols = {"Producto", "Cantidad", "Ventas"};
        for (int i = 0; i < cols.length; i++) cell(h, i, cols[i], s.header);
        int row = 1;
        for (ProductRow p : products) {
            Row r = sh.createRow(row++);
            cell(r, 0, p.getName(), null);
            number(r, 1, p.getQuantity(), s.integer);
            money(r, 2, p.getRevenue(), s.money);
        }
        totalsRow(sh, s, row, 1, 2);
        sh.createFreezePane(0, 1);
        autosize(sh, cols.length);
    }

    private void writeOrders(Workbook wb, Styles s, List<Order> orders) {
        Sheet sh = wb.createSheet("Pedidos");
        String[] cols = {"Pedido", "Fecha", "Hora", "Canal", "Estado", "Cliente", "Productos",
                "Domicilio", "Descuento", "Cupón", "Total", "Factura interna", "Factura electrónica", "Medio de pago (FE)"};
        Row h = sh.createRow(0);
        for (int i = 0; i < cols.length; i++) cell(h, i, cols[i], s.header);
        int row = 1;
        for (Order o : orders) {
            LocalDateTime at = o.getCreatedAt();
            Row r = sh.createRow(row++);
            number(r, 0, o.getId(), null);
            cell(r, 1, at.format(DATE), null);
            cell(r, 2, at.format(TIME), null);
            cell(r, 3, SOURCE_LABELS.getOrDefault(o.getSource().name(), o.getSource().name()), null);
            cell(r, 4, STATUS_LABELS.getOrDefault(o.getStatus().name(), o.getStatus().name()), null);
            cell(r, 5, o.getCustomer() != null ? o.getCustomer().getName() : "", null);
            cell(r, 6, ReportService.items(o).stream()
                    .map(i -> i.getQuantity() + "x " + i.getProductName())
                    .collect(Collectors.joining(", ")), null);
            money(r, 7, o.getDeliveryFee(), s.money);
            money(r, 8, o.getDiscount(), s.money);
            cell(r, 9, o.getCouponCode() != null ? o.getCouponCode() : "", null);
            money(r, 10, o.getTotal(), s.money);
            cell(r, 11, o.getInvoiceNumber() != null ? o.getInvoiceNumber() : "", null);
            cell(r, 12, o.getElectronicInvoiceNumber() != null ? o.getElectronicInvoiceNumber() : "", null);
            cell(r, 13, o.getElectronicInvoiceNumber() != null ? ReportService.paymentMethodLabel(o.getElectronicPaymentMethodCode()) : "", null);
        }
        sh.setAutoFilter(new CellRangeAddress(0, Math.max(0, row - 1), 0, cols.length - 1));
        sh.createFreezePane(0, 1);
        autosize(sh, cols.length);
    }

    private void writeShifts(Workbook wb, Styles s, List<ShiftRow> shifts) {
        Sheet sh = wb.createSheet("Turnos");
        String[] cols = {"Turno", "Apertura", "Cierre", "Pedidos", "Ventas", "Base inicial", "Efectivo esperado", "Efectivo contado", "Diferencia"};
        Row h = sh.createRow(0);
        for (int i = 0; i < cols.length; i++) cell(h, i, cols[i], s.header);
        int row = 1;
        DateTimeFormatter dt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        for (ShiftRow t : shifts) {
            Row r = sh.createRow(row++);
            number(r, 0, t.getId(), null);
            cell(r, 1, t.getOpenedAt() != null ? LocalDateTime.parse(t.getOpenedAt()).format(dt) : "", null);
            cell(r, 2, t.getClosedAt() != null ? LocalDateTime.parse(t.getClosedAt()).format(dt) : (t.isActive() ? "Abierto" : ""), null);
            number(r, 3, t.getOrders(), s.integer);
            money(r, 4, t.getRevenue(), s.money);
            money(r, 5, t.getInitialCash(), s.money);
            money(r, 6, t.getExpectedCash(), s.money);
            money(r, 7, t.getFinalCash(), s.money);
            money(r, 8, t.getDifference(), s.money);
        }
        sh.createFreezePane(0, 1);
        autosize(sh, cols.length);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private void totalsRow(Sheet sh, Styles s, int row, int qtyCol, int moneyCol) {
        if (row <= 1) return;
        Row r = sh.createRow(row);
        cell(r, 0, "Total", s.header);
        Cell q = r.createCell(qtyCol);
        q.setCellFormula("SUM(" + col(qtyCol) + "2:" + col(qtyCol) + row + ")");
        q.setCellStyle(s.totalInteger);
        Cell m = r.createCell(moneyCol);
        m.setCellFormula("SUM(" + col(moneyCol) + "2:" + col(moneyCol) + row + ")");
        m.setCellStyle(s.totalMoney);
    }

    private static String col(int index) {
        return String.valueOf((char) ('A' + index));
    }

    private static void cell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        if (style != null) c.setCellStyle(style);
    }

    private static void number(Row row, int col, long value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        if (style != null) c.setCellStyle(style);
    }

    private static void money(Row row, int col, BigDecimal value, CellStyle style) {
        if (value == null) return;
        Cell c = row.createCell(col);
        c.setCellValue(value.doubleValue());
        c.setCellStyle(style);
    }

    // Ancho según el largo del texto. No se usa autoSizeColumn porque requiere fuentes del sistema
    // (AWT), que el contenedor de Railway puede no tener.
    private static void autosize(Sheet sh, int columns) {
        int[] widths = new int[columns];
        for (Row row : sh) {
            for (int i = 0; i < columns; i++) {
                Cell c = row.getCell(i);
                if (c == null || isMergedTitle(sh, c)) continue;
                int len = switch (c.getCellType()) {
                    case STRING -> c.getStringCellValue().length();
                    case NUMERIC -> 12;
                    case FORMULA -> 14;
                    default -> 0;
                };
                widths[i] = Math.max(widths[i], len);
            }
        }
        for (int i = 0; i < columns; i++) {
            sh.setColumnWidth(i, Math.min(Math.max(widths[i] + 3, 10), 60) * 256);
        }
    }

    private static boolean isMergedTitle(Sheet sh, Cell c) {
        return sh.getMergedRegions().stream().anyMatch(r -> r.isInRange(c));
    }

    private static String fmtDate(String iso) {
        return LocalDate.parse(iso).format(DATE);
    }

    private static String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private record Previous(Long orders, BigDecimal revenue, BigDecimal averageTicket) {
        Previous(PreviousPeriod p) {
            this(p.getOrders(), p.getRevenue(), p.getAverageTicket());
        }
    }

    private static final class Styles {
        final CellStyle title, header, money, integer, totalMoney, totalInteger;

        Styles(Workbook wb) {
            DataFormat fmt = wb.createDataFormat();
            Font bold = wb.createFont();
            bold.setBold(true);
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);

            title = wb.createCellStyle();
            title.setFont(titleFont);

            header = wb.createCellStyle();
            header.setFont(bold);
            header.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            money = wb.createCellStyle();
            money.setDataFormat(fmt.getFormat("\"$\"#,##0"));
            integer = wb.createCellStyle();
            integer.setDataFormat(fmt.getFormat("#,##0"));

            totalMoney = wb.createCellStyle();
            totalMoney.cloneStyleFrom(money);
            totalMoney.setFont(bold);
            totalInteger = wb.createCellStyle();
            totalInteger.cloneStyleFrom(integer);
            totalInteger.setFont(bold);
        }
    }
}
