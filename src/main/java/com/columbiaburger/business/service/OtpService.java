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

    private record OtpEntry(String code, Instant expiresAt, int attempts) {}
    private record RateEntry(Instant windowStart, int count) {}

    private final ConcurrentHashMap<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateEntry> sendRate = new ConcurrentHashMap<>();
    private final Random random = new Random();
    private final RestTemplate restTemplate = new RestTemplate();

    private static final int MAX_SEND_PER_WINDOW = 3;
    private static final long WINDOW_SECONDS = 300;
    private static final int MAX_VERIFY_ATTEMPTS = 5;

    public void sendOtp(String whatsapp) {
        if (whatsapp == null || !whatsapp.matches("\\d{10,15}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Número inválido");
        }

        RateEntry rate = sendRate.get(whatsapp);
        Instant now = Instant.now();
        if (rate != null && now.isBefore(rate.windowStart().plusSeconds(WINDOW_SECONDS))) {
            if (rate.count() >= MAX_SEND_PER_WINDOW) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Demasiados intentos. Espera 5 minutos.");
            }
            sendRate.put(whatsapp, new RateEntry(rate.windowStart(), rate.count() + 1));
        } else {
            sendRate.put(whatsapp, new RateEntry(now, 1));
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        store.put(whatsapp, new OtpEntry(code, now.plusSeconds(600), 0));
        restTemplate.postForEntity(otpWebhookUrl, Map.of("whatsapp", whatsapp, "code", code), Void.class);
    }

    public void verifyOtp(String whatsapp, String code) {
        if (whatsapp == null || code == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datos inválidos");
        }

        OtpEntry entry = store.get(whatsapp);
        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            store.remove(whatsapp);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Código expirado o inválido");
        }
        if (entry.attempts() >= MAX_VERIFY_ATTEMPTS) {
            store.remove(whatsapp);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Demasiados intentos fallidos");
        }
        if (!entry.code().equals(code)) {
            store.put(whatsapp, new OtpEntry(entry.code(), entry.expiresAt(), entry.attempts() + 1));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Código incorrecto");
        }
        store.remove(whatsapp);
    }
}
