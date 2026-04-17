package com.columbiaburger.business.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OtpService {

    @Value("${n8n.otp.webhook.url}")
    private String otpWebhookUrl;

    private record OtpEntry(String code, Instant expiresAt) {}

    private final ConcurrentHashMap<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final Random random = new Random();
    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtp(String whatsapp) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        store.put(whatsapp, new OtpEntry(code, Instant.now().plusSeconds(600)));
        restTemplate.postForEntity(otpWebhookUrl, Map.of("whatsapp", whatsapp, "code", code), Void.class);
    }

    public void verifyOtp(String whatsapp, String code) {
        OtpEntry entry = store.get(whatsapp);
        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Código expirado o inválido");
        }
        if (!entry.code().equals(code)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Código incorrecto");
        }
        store.remove(whatsapp);
    }
}
