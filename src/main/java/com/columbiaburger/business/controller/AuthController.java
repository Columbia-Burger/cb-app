package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.request.LoginRequest;
import com.columbiaburger.business.dto.response.LoginResponse;
import com.columbiaburger.business.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Re-emite el token de una sesión válida para que el personal no tenga que volver a iniciar sesión. */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(authService.refresh(authentication));
    }
}
