package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.response.LoginResponse;
import com.columbiaburger.business.entity.Customer;
import com.columbiaburger.business.repository.CustomerRepository;
import com.columbiaburger.business.security.JwtUtil;
import com.columbiaburger.business.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final JwtUtil jwtUtil;
    private final CustomerRepository customerRepository;

    @PostMapping("/send")
    public ResponseEntity<Void> send(@RequestBody Map<String, String> body) {
        otpService.sendOtp(body.get("whatsapp"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<LoginResponse> verify(@RequestBody Map<String, String> body) {
        String whatsapp = body.get("whatsapp");
        otpService.verifyOtp(whatsapp, body.get("code"));

        // Crear cliente si no existe
        customerRepository.findByWhatsapp(whatsapp).orElseGet(() ->
                customerRepository.save(Customer.builder()
                        .name("Cliente")
                        .whatsapp(whatsapp)
                        .build())
        );

        String token = jwtUtil.generateToken(whatsapp, "CUSTOMER");
        return ResponseEntity.ok(new LoginResponse(token, whatsapp, whatsapp, "CUSTOMER"));
    }
}
