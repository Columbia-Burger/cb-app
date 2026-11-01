package com.columbiaburger.business.security;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.http.HttpMethod;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(ct -> {})
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true))
                .referrerPolicy(rp -> rp
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            )
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // ── Público ──
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/auth/otp/**").permitAll()
                .requestMatchers(req -> "POST".equals(req.getMethod()) && "/api/orders".equals(req.getRequestURI())).permitAll()
                .requestMatchers("/api/orders/*/tracking").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders/*/rating").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/coupons/validate").permitAll()
                .requestMatchers("/api/orders/events").permitAll() // valida el token en el controlador (EventSource no envía headers)
                .requestMatchers(HttpMethod.GET, "/api/products*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/seasonal-specials*").permitAll()
                // ── Cualquier sesión válida ──
                .requestMatchers(HttpMethod.POST, "/api/auth/refresh").authenticated()
                // ── Cliente (OTP) ──
                .requestMatchers("/api/customers/me", "/api/customers/me/orders").hasRole("CUSTOMER")
                // ── Personal ──
                .requestMatchers("/api/orders/kitchen").hasAnyRole("ADMIN", "KITCHEN")
                .requestMatchers("/api/orders/delivery").hasAnyRole("ADMIN", "DELIVERY")
                .requestMatchers(HttpMethod.PATCH, "/api/orders/*/status").hasAnyRole("ADMIN", "KITCHEN", "DELIVERY")
                .requestMatchers(HttpMethod.GET, "/api/admin/catalog/delivery-zones").hasAnyRole("ADMIN", "DELIVERY")
                .requestMatchers(HttpMethod.PUT, "/api/orders/*").hasRole("ADMIN")
                .requestMatchers("/api/admin", "/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/users", "/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/customers", "/api/customers/**").hasRole("ADMIN")
                .requestMatchers("/api/coupons", "/api/coupons/**").hasRole("ADMIN")
                .requestMatchers("/api/social", "/api/social/**").hasRole("ADMIN")
                .requestMatchers("/api/invoices", "/api/invoices/**").hasRole("ADMIN")
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").hasRole("ADMIN")
                // ── Frontend de Angular (lo sirve esta misma app; ver SpaWebConfig) ──
                .requestMatchers(req -> !req.getRequestURI().startsWith("/api/")).permitAll()
                // Todo lo demás (p. ej. listar pedidos) solo para el personal: antes bastaba cualquier
                // token, incluido el de un cliente obtenido por OTP.
                .anyRequest().hasAnyRole("ADMIN", "KITCHEN", "DELIVERY")
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    Object authError = request.getAttribute(JwtAuthFilter.AUTH_ERROR_ATTR);
                    String message = authError != null ? authError.toString() : "Unauthorized";
                    response.getWriter().write("{\"error\":\"" + message + "\"}");
                })
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(new RlsContextFilter(), JwtAuthFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
