package com.columbiaburger.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${app.server-url:http://localhost:8080}")
    private String serverUrl;

    @Bean
    OpenAPI columbiaburgerOpenAPI() {
        List<Server> servers = new ArrayList<>();
        for (String url : serverUrl.split(",")) {
            servers.add(new Server().url(url.trim()));
        }

        return new OpenAPI()
                .info(new Info()
                        .title("Columbia Burger — Catalog API")
                        .description("API REST para el catálogo de Columbia Burger: productos, categorías, sabores, adiciones, especiales de temporada y zonas de delivery.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Columbia Burger")
                                .email("dev@columbiaburger.com")))
                .servers(servers);
    }
}