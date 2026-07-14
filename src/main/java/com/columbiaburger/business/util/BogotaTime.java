package com.columbiaburger.business.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class BogotaTime {

    public static final ZoneId ZONE = ZoneId.of("America/Bogota");

    private BogotaTime() {}

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
