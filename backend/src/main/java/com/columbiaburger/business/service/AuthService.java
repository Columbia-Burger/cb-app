package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.LoginRequest;
import com.columbiaburger.business.dto.response.LoginResponse;
import com.columbiaburger.business.entity.AppUser;
import com.columbiaburger.business.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    public LoginResponse login(LoginRequest request) {
        AppUser user = userService.authenticate(request.getUsername(), request.getPassword())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos"));
        return toLoginResponse(user);
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

        if ("CUSTOMER".equals(role)) {
            String subject = authentication.getName();
            return new LoginResponse(jwtUtil.generateToken(subject, role), subject, subject, role);
        }
        // El filtro ya resolvió el subject a username; se re-lee el usuario para reflejar su estado actual
        AppUser user = userService.findActive(authentication.getName())
                .filter(u -> u.getRole().name().equals(role))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario desactivado o con otro rol"));
        return toLoginResponse(user);
    }

    private LoginResponse toLoginResponse(AppUser user) {
        String role = user.getRole().name();
        return new LoginResponse(
                jwtUtil.generateToken(user.getUsername(), role),
                user.getUsername(),
                user.getDisplayName(),
                role
        );
    }
}
