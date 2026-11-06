package com.columbiaburger.business.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class StaleOrderCleanupServiceTest {

    @Test
    void afterFiveAmTheBusinessDayStartsToday() {
        assertThat(StaleOrderCleanupService.currentBusinessDayStart(LocalDateTime.of(2026, 11, 6, 16, 30)))
                .isEqualTo(LocalDateTime.of(2026, 11, 6, 5, 0));
    }

    @Test
    void beforeFiveAmItIsStillYesterdaysBusinessDay() {
        // 00:30 del 6: los pedidos de la noche del 5 todavía no se cierran
        assertThat(StaleOrderCleanupService.currentBusinessDayStart(LocalDateTime.of(2026, 11, 6, 0, 30)))
                .isEqualTo(LocalDateTime.of(2026, 11, 5, 5, 0));
    }

    @Test
    void handlesMonthChange() {
        assertThat(StaleOrderCleanupService.currentBusinessDayStart(LocalDateTime.of(2026, 12, 1, 2, 0)))
                .isEqualTo(LocalDateTime.of(2026, 11, 30, 5, 0));
    }
}
