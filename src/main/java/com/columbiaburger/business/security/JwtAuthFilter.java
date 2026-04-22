package com.columbiaburger.business.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

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

            if (jwtUtil.isTokenValid(token)) {
                String subject = jwtUtil.extractSubject(token);
                String role = jwtUtil.extractRole(token);

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
            }

        } catch (Exception e) {
            // 👇 CLAVE: ignorar token inválido
            SecurityContextHolder.clearContext();
        }
    }

    filterChain.doFilter(request, response);
}
}
