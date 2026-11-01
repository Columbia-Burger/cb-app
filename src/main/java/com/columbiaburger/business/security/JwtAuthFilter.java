package com.columbiaburger.business.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.columbiaburger.business.service.UserService;
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

    public static final String AUTH_ERROR_ATTR = "auth_error";

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                String validationError = jwtUtil.getValidationError(token);
                boolean valid = validationError == null;
                log.info("isTokenValid={} para {} {}", valid, request.getMethod(), request.getRequestURI());

                String subject = valid ? jwtUtil.extractSubject(token) : null;
                String role = valid ? jwtUtil.extractRole(token) : null;
                if (valid && !"CUSTOMER".equals(role)) {
                    // Personal: el usuario debe seguir activo y con el mismo rol. Los tokens viejos
                    // traen el correo como subject; se traduce al username.
                    subject = userService.resolveUsername(subject);
                    if (!userService.isSessionValid(subject, role)) {
                        valid = false;
                        validationError = "Usuario desactivado o con otro rol";
                    }
                }

                if (valid) {
                    log.info("Token valido - subject={}, role={}", subject, role);

                    String authority = switch (role) {
                        case "CUSTOMER" -> "ROLE_CUSTOMER";
                        case "KITCHEN" -> "ROLE_KITCHEN";
                        case "DELIVERY" -> "ROLE_DELIVERY";
                        case "ADMIN" -> "ROLE_ADMIN";
                        default -> throw new IllegalStateException("Rol desconocido en token: " + role);
                    };

                    var auth = new UsernamePasswordAuthenticationToken(
                            subject,
                            null,
                            List.of(new SimpleGrantedAuthority(authority))
                    );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    request.setAttribute(AUTH_ERROR_ATTR, validationError);
                    log.warn("Token invalido para {} {}: {}", request.getMethod(), request.getRequestURI(), validationError);
                }
            } catch (Exception e) {
                request.setAttribute(AUTH_ERROR_ATTR, "Error procesando token");
                log.error("Excepcion procesando JWT para {} {}: {}",
                        request.getMethod(), request.getRequestURI(), e.getMessage(), e);
                SecurityContextHolder.clearContext();
            }
        } else {
            log.debug("Sin header Authorization para {} {}", request.getMethod(), request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}
