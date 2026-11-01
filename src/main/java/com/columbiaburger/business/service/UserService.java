package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.request.UserRequest;
import com.columbiaburger.business.dto.response.UserResponse;
import com.columbiaburger.business.entity.AppUser;
import com.columbiaburger.business.entity.UserRole;
import com.columbiaburger.business.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements ApplicationRunner {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9._-]{3,30}$");
    private static final int MIN_PASSWORD_LENGTH = 6;
    private static final long SESSION_CACHE_MS = 60_000;

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Cuentas anteriores (por correo, desde variables de entorno). Solo se usan para crear los
    // usuarios iniciales y para aceptar sesiones/logins que aún usen el correo.
    @Value("${app.admin.email:}")    private String legacyAdminEmail;
    @Value("${app.admin.password:}") private String legacyAdminPassword;
    @Value("${app.kitchen.email:}")    private String legacyKitchenEmail;
    @Value("${app.kitchen.password:}") private String legacyKitchenPassword;
    @Value("${app.delivery.email:}")    private String legacyDeliveryEmail;
    @Value("${app.delivery.password:}") private String legacyDeliveryPassword;

    private final Map<String, String> legacyEmailToUsername = new HashMap<>();
    private final Map<String, CachedSession> sessionCache = new ConcurrentHashMap<>();

    private record CachedSession(String role, boolean active, long loadedAt) {}

    /** Crea admin / cocina / domicilio con las contraseñas actuales si la tabla está vacía. */
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        registerLegacy(legacyAdminEmail, "admin");
        registerLegacy(legacyKitchenEmail, "cocina");
        registerLegacy(legacyDeliveryEmail, "domicilio");

        if (userRepository.count() > 0) return;
        seed("admin", "Administrador", UserRole.ADMIN, legacyAdminPassword);
        seed("cocina", "Cocina", UserRole.KITCHEN, legacyKitchenPassword);
        seed("domicilio", "Domicilio", UserRole.DELIVERY, legacyDeliveryPassword);
    }

    private void registerLegacy(String email, String username) {
        if (email != null && !email.isBlank()) {
            legacyEmailToUsername.put(email.trim().toLowerCase(Locale.ROOT), username);
        }
    }

    private void seed(String username, String displayName, UserRole role, String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            log.warn("No se creó el usuario inicial '{}': falta su contraseña en las variables de entorno", username);
            return;
        }
        userRepository.save(AppUser.builder()
                .username(username)
                .displayName(displayName)
                .role(role)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .build());
        log.info("Usuario inicial creado: {} ({})", username, role);
    }

    /** Normaliza lo que el usuario escribió (o el subject de un token viejo) a un username. */
    public String resolveUsername(String identifier) {
        String normalized = identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
        return legacyEmailToUsername.getOrDefault(normalized, normalized);
    }

    @Transactional
    public Optional<AppUser> authenticate(String identifier, String rawPassword) {
        Optional<AppUser> user = userRepository.findByUsername(resolveUsername(identifier))
                .filter(AppUser::getActive)
                .filter(u -> passwordEncoder.matches(rawPassword, u.getPasswordHash()));
        user.ifPresent(u -> u.setLastLoginAt(java.time.LocalDateTime.now()));
        return user;
    }

    /**
     * ¿Sigue vigente la sesión de este usuario con este rol? Se consulta en cada request del
     * personal, así que se cachea un minuto: desactivar a alguien o cambiarle el rol corta su
     * sesión en máximo ~1 minuto.
     */
    public boolean isSessionValid(String username, String role) {
        CachedSession cached = sessionCache.get(username);
        if (cached == null || System.currentTimeMillis() - cached.loadedAt() > SESSION_CACHE_MS) {
            cached = userRepository.findByUsername(username)
                    .map(u -> new CachedSession(u.getRole().name(), u.getActive(), System.currentTimeMillis()))
                    .orElse(new CachedSession("", false, System.currentTimeMillis()));
            sessionCache.put(username, cached);
        }
        return cached.active() && cached.role().equals(role);
    }

    @Transactional(readOnly = true)
    public Optional<AppUser> findActive(String username) {
        return userRepository.findByUsername(username).filter(AppUser::getActive);
    }

    // ── Administración ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAllByOrderByActiveDescRoleAscUsernameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public UserResponse create(UserRequest req) {
        String username = req.getUsername() == null ? "" : req.getUsername().trim().toLowerCase(Locale.ROOT);
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw badRequest("El usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, punto, guion o guion bajo, sin espacios");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe el usuario '" + username + "'");
        }
        AppUser user = AppUser.builder()
                .username(username)
                .displayName(requireDisplayName(req.getDisplayName()))
                .role(parseRole(req.getRole()))
                .passwordHash(passwordEncoder.encode(requirePassword(req.getPassword())))
                .active(req.getActive() == null || req.getActive())
                .build();
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest req, String currentUsername) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        boolean isSelf = user.getUsername().equals(currentUsername);

        if (req.getDisplayName() != null) {
            user.setDisplayName(requireDisplayName(req.getDisplayName()));
        }
        if (req.getRole() != null) {
            UserRole newRole = parseRole(req.getRole());
            if (isSelf && newRole != user.getRole()) {
                throw badRequest("No puedes cambiar tu propio rol");
            }
            if (user.getRole() == UserRole.ADMIN && newRole != UserRole.ADMIN) {
                ensureAnotherActiveAdmin(user);
            }
            user.setRole(newRole);
        }
        if (req.getActive() != null && !req.getActive().equals(user.getActive())) {
            if (isSelf && !req.getActive()) {
                throw badRequest("No puedes desactivar tu propio usuario");
            }
            if (!req.getActive() && user.getRole() == UserRole.ADMIN) {
                ensureAnotherActiveAdmin(user);
            }
            user.setActive(req.getActive());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(requirePassword(req.getPassword())));
        }

        sessionCache.remove(user.getUsername());
        return toResponse(userRepository.save(user));
    }

    private void ensureAnotherActiveAdmin(AppUser user) {
        long activeAdmins = userRepository.countByRoleAndActiveTrue(UserRole.ADMIN);
        boolean userCounts = user.getActive() && user.getRole() == UserRole.ADMIN;
        if (activeAdmins - (userCounts ? 1 : 0) < 1) {
            throw badRequest("Debe quedar al menos un administrador activo");
        }
    }

    private UserRole parseRole(String role) {
        try {
            return UserRole.valueOf(role == null ? "" : role.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw badRequest("Rol inválido. Usa ADMIN, KITCHEN o DELIVERY");
        }
    }

    private String requireDisplayName(String displayName) {
        if (displayName == null || displayName.isBlank()) throw badRequest("El nombre es obligatorio");
        String trimmed = displayName.trim();
        if (trimmed.length() > 80) throw badRequest("El nombre no puede superar 80 caracteres");
        return trimmed;
    }

    private String requirePassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw badRequest("La contraseña debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres");
        }
        return password;
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private UserResponse toResponse(AppUser u) {
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .displayName(u.getDisplayName())
                .role(u.getRole().name())
                .active(u.getActive())
                .lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
