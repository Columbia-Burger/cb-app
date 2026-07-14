package com.columbiaburger.api;

import com.columbiaburger.api.util.BogotaTime;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

import java.util.TimeZone;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class CbBackEndApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone(BogotaTime.ZONE));
		SpringApplication.run(CbBackEndApplication.class, args);
	}

}
