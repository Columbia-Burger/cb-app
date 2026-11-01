package com.columbiaburger.business.service;

import com.columbiaburger.business.entity.Shift;
import com.columbiaburger.business.repository.OrderRepository;
import com.columbiaburger.business.repository.ShiftRepository;
import com.columbiaburger.business.util.BogotaTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InvoiceServiceTest {

    private OrderRepository orderRepository;
    private ShiftRepository shiftRepository;
    private InvoiceService service;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        shiftRepository = mock(ShiftRepository.class);
        service = new InvoiceService(orderRepository, mock(OrderService.class), mock(FactusService.class), shiftRepository);
        when(orderRepository.findInvoicesForDay(any(), any())).thenReturn(List.of());
    }

    private LocalDateTime[] queriedRange() {
        ArgumentCaptor<LocalDateTime> from = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> to = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(orderRepository).findInvoicesForDay(from.capture(), to.capture());
        return new LocalDateTime[]{from.getValue(), to.getValue()};
    }

    @Test
    void withOpenShiftFromYesterdayListsSinceTheShiftDayEvenAfterMidnight() {
        LocalDateTime openedYesterday = BogotaTime.today().minusDays(1).atTime(16, 0);
        Shift shift = new Shift();
        shift.setOpenedAt(openedYesterday);
        shift.setActive(true);
        when(shiftRepository.findByActiveTrue()).thenReturn(Optional.of(shift));

        service.listInvoices();

        LocalDateTime[] range = queriedRange();
        assertThat(range[0]).isEqualTo(BogotaTime.today().minusDays(1).atStartOfDay());
        assertThat(range[1]).isAfter(BogotaTime.now());
    }

    @Test
    void withoutOpenShiftListsToday() {
        when(shiftRepository.findByActiveTrue()).thenReturn(Optional.empty());

        service.listInvoices();

        LocalDateTime[] range = queriedRange();
        assertThat(range[0]).isEqualTo(BogotaTime.today().atStartOfDay());
        assertThat(range[1]).isAfter(BogotaTime.now());
    }
}
