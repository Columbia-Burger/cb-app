package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.LoginRequest;
import com.columbiaburger.business.dto.response.LoginResponse;
import com.columbiaburger.business.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    public LoginResponse login(LoginRequest request) {
        if (!adminEmail.equals(request.getEmail()) || !adminPassword.equals(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }
        String token = jwtUtil.generateToken(adminEmail);
        return new LoginResponse(token, adminEmail);
    }
}
