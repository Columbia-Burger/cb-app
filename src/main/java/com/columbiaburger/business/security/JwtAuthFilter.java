package com.columbiaburger.business.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                log.debug("JWT recibido (primeros 20 chars): {}", token.length() > 20 ? token.substring(0, 20) : token);

                boolean valid = jwtUtil.isTokenValid(token);
                log.info("isTokenValid={} para {} {}", valid, request.getMethod(), request.getRequestURI());

                if (valid) {
                    String subject = jwtUtil.extractSubject(token);
                    String role = jwtUtil.extractRole(token);
                    log.info("Token válido — subject={}, role={}", subject, role);

                    String authority = switch (role) {
                        case "CUSTOMER" -> "ROLE_CUSTOMER";
                        case "KITCHEN" -> "ROLE_KITCHEN";
                        case "DELIVERY" -> "ROLE_DELIVERY";
                        default -> "ROLE_ADMIN";
                    };

                    var auth = new UsernamePasswordAuthenticationToken(
                            subject, null,
                            List.of(new SimpleGrantedAuthority(authority))
                    );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    log.warn("Token inválido (isTokenValid=false) para {} {}", request.getMethod(), request.getRequestURI());
                }

            } catch (Exception e) {
                log.error("Excepción procesando JWT para {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage(), e);
                SecurityContextHolder.clearContext();
            }
        } else {
            log.debug("Sin header Authorization para {} {}", request.getMethod(), request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}
