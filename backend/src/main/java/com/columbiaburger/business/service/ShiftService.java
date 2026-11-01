package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.CloseShiftRequest;
import com.columbiaburger.business.dto.request.OpenShiftRequest;
import com.columbiaburger.business.dto.response.ShiftResponse;
import com.columbiaburger.business.entity.Shift;
import com.columbiaburger.business.repository.OrderRepository;
import com.columbiaburger.business.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public ShiftResponse open(OpenShiftRequest req) {
        shiftRepository.findByActiveTrue().ifPresent(s -> {
            s.setActive(false);
            s.setClosedAt(LocalDateTime.now());
            shiftRepository.save(s);
        });

        BigDecimal initialCash = req != null && req.getInitialCash() != null
                ? req.getInitialCash() : BigDecimal.ZERO;

        Shift shift = Shift.builder()
                .openedAt(LocalDateTime.now())
                .active(true)
                .initialCash(initialCash)
                .build();

        return toResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ShiftResponse close(CloseShiftRequest req) {
        Shift shift = shiftRepository.findByActiveTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay turno activo"));

        LocalDateTime closedAt = LocalDateTime.now();
        shift.setActive(false);
        shift.setClosedAt(closedAt);

        BigDecimal finalCash = req != null && req.getFinalCash() != null
                ? req.getFinalCash() : BigDecimal.ZERO;
        shift.setFinalCash(finalCash);

        Shift saved = shiftRepository.save(shift);
        return toResponseWithSummary(saved);
    }

    @Transactional(readOnly = true)
    public Optional<ShiftResponse> current() {
        return shiftRepository.findByActiveTrue().map(this::toResponseWithSummary);
    }

    private ShiftResponse toResponse(Shift s) {
        return ShiftResponse.builder()
                .id(s.getId())
                .openedAt(s.getOpenedAt())
                .closedAt(s.getClosedAt())
                .active(s.isActive())
                .initialCash(s.getInitialCash())
                .finalCash(s.getFinalCash())
                .build();
    }

    // También lo usa ReportService para listar los turnos de un rango
    ShiftResponse toResponseWithSummary(Shift s) {
        LocalDateTime to = s.getClosedAt() != null ? s.getClosedAt() : LocalDateTime.now();
        BigDecimal totalRevenue = orderRepository.sumTotalBetween(s.getOpenedAt(), to);
        long totalOrders = orderRepository.countByCreatedAtBetweenExcludingCancelled(s.getOpenedAt(), to);

        BigDecimal initialCash = s.getInitialCash() != null ? s.getInitialCash() : BigDecimal.ZERO;
        BigDecimal expectedCash = initialCash.add(totalRevenue);
        BigDecimal difference = s.getFinalCash() != null
                ? s.getFinalCash().subtract(expectedCash)
                : null;

        return ShiftResponse.builder()
                .id(s.getId())
                .openedAt(s.getOpenedAt())
                .closedAt(s.getClosedAt())
                .active(s.isActive())
                .initialCash(initialCash)
                .finalCash(s.getFinalCash())
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .expectedCash(expectedCash)
                .difference(difference)
                .build();
    }
}
