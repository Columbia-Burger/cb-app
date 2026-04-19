package com.columbiaburger.business.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.http.HttpMethod;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    /** Chain de alta prioridad: POST /api/orders y POST /api/customers son siempre públicos */
    @Bean
    @Order(1)
    public SecurityFilterChain publicPostChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(request ->
                "POST".equals(request.getMethod()) &&
                (request.getRequestURI().equals("/api/orders") ||
                 request.getRequestURI().equals("/api/customers")))
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/auth/otp/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()  // WhatsApp bot / frontend crea pedidos
                .requestMatchers(HttpMethod.GET, "/api/orders").authenticated()   // solo admin
                .requestMatchers(HttpMethod.POST, "/api/customers").permitAll()   // WhatsApp bot crea clientes
                .requestMatchers(HttpMethod.GET, "/api/customers").authenticated()
                .requestMatchers("/api/customers/whatsapp/**").permitAll() // n8n consulta perfil y ubicación
                .requestMatchers("/api/orders/*/tracking").permitAll()   // Tracking público
                .requestMatchers("/api/shifts/open", "/api/shifts/close").permitAll() // n8n cron
                .requestMatchers("/api/customers/me", "/api/customers/me/orders").hasRole("CUSTOMER")
                .requestMatchers("/api/orders/kitchen").hasAnyRole("ADMIN", "KITCHEN")
                .requestMatchers("/api/orders/delivery").hasAnyRole("ADMIN", "DELIVERY")
                .requestMatchers(HttpMethod.PATCH, "/api/orders/*/status").hasAnyRole("ADMIN", "KITCHEN", "DELIVERY")
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
