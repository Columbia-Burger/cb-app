package com.columbiaburger.business;

import com.columbiaburger.business.util.BogotaTime;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

/**
 * Una sola app: negocio (com.columbiaburger.business, esquema "business") y catálogo
 * (com.columbiaburger.catalog, esquema "public", antes el servicio cb-data-api).
 */
@SpringBootApplication(
        scanBasePackages = "com.columbiaburger",
        exclude = {UserDetailsServiceAutoConfiguration.class})
@EntityScan(basePackages = {"com.columbiaburger.business.entity", "com.columbiaburger.catalog.entity"})
@EnableJpaRepositories(basePackages = {"com.columbiaburger.business.repository", "com.columbiaburger.catalog.repository"})
@EnableScheduling
public class CbApiBusinessApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone(BogotaTime.ZONE));
        SpringApplication.run(CbApiBusinessApplication.class, args);
    }
}
