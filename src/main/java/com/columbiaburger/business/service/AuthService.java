package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.LoginRequest;
import com.columbiaburger.business.dto.response.LoginResponse;
import com.columbiaburger.business.security.JwtUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPasswordRaw;

    @Value("${app.kitchen.email}")
    private String kitchenEmail;

    @Value("${app.kitchen.password}")
    private String kitchenPasswordRaw;

    @Value("${app.delivery.email}")
    private String deliveryEmail;

    @Value("${app.delivery.password}")
    private String deliveryPasswordRaw;

    private String adminHash;
    private String kitchenHash;
    private String deliveryHash;

    @PostConstruct
    public void init() {
        adminHash = passwordEncoder.encode(adminPasswordRaw);
        kitchenHash = passwordEncoder.encode(kitchenPasswordRaw);
        deliveryHash = passwordEncoder.encode(deliveryPasswordRaw);
        adminPasswordRaw = null;
        kitchenPasswordRaw = null;
        deliveryPasswordRaw = null;
    }

    public LoginResponse login(LoginRequest request) {
        if (adminEmail.equals(request.getEmail()) && passwordEncoder.matches(request.getPassword(), adminHash)) {
            return new LoginResponse(jwtUtil.generateToken(adminEmail, "ADMIN"), adminEmail);
        }
        if (kitchenEmail.equals(request.getEmail()) && passwordEncoder.matches(request.getPassword(), kitchenHash)) {
            return new LoginResponse(jwtUtil.generateToken(kitchenEmail, "KITCHEN"), kitchenEmail);
        }
        if (deliveryEmail.equals(request.getEmail()) && passwordEncoder.matches(request.getPassword(), deliveryHash)) {
            return new LoginResponse(jwtUtil.generateToken(deliveryEmail, "DELIVERY"), deliveryEmail);
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
    }

    public LoginResponse refresh(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida");
        }
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión sin rol"));
        String subject = authentication.getName();
        return new LoginResponse(jwtUtil.generateToken(subject, role), subject);
    }
}
