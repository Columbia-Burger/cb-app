package com.columbiaburger.business;

import com.columbiaburger.business.util.BogotaTime;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
@EnableScheduling
public class CbApiBusinessApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone(BogotaTime.ZONE));
        SpringApplication.run(CbApiBusinessApplication.class, args);
    }
}
