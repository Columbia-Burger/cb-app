package com.columbiaburger.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class CbBackEndApplication {

	public static void main(String[] args) {
		SpringApplication.run(CbBackEndApplication.class, args);
	}

}
