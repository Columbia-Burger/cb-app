package com.columbiaburger.business.service;

import com.columbiaburger.business.repository.OrderRepository;
import com.columbiaburger.business.util.BogotaTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Pedidos que quedaron en Recibido / Preparando / En camino de días anteriores (nadie los marcó
 * como entregados) se cierran solos al empezar el día de operación, para que no se acumulen en
 * cocina, domicilios y el dashboard. Corre a las 5:00 a. m. y al arrancar la app.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StaleOrderCleanupService implements ApplicationRunner {

    /** El día de operación va de 5:00 a. m. a 5:00 a. m. (igual que en el frontend). */
    static final int BUSINESS_DAY_START_HOUR = 5;

    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        closeStaleOrders();
    }

    @Scheduled(cron = "0 0 5 * * *", zone = "America/Bogota")
    @Transactional
    public int closeStaleOrders() {
        LocalDateTime before = currentBusinessDayStart(BogotaTime.now());
        int closed = orderRepository.closeStaleOrders(before);
        if (closed > 0) {
            log.info("Cierre automático: {} pedidos de días anteriores pasaron a Entregado (antes de {})", closed, before);
        }
        return closed;
    }

    /** Inicio del día de operación: hoy a las 5:00, o ayer a las 5:00 si aún no son las 5. */
    static LocalDateTime currentBusinessDayStart(LocalDateTime now) {
        LocalDateTime todayStart = now.toLocalDate().atTime(BUSINESS_DAY_START_HOUR, 0);
        return now.isBefore(todayStart) ? todayStart.minusDays(1) : todayStart;
    }
}
