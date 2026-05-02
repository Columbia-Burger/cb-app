package com.columbiaburger.business.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class FactusTokenService {

    private final RestTemplate restTemplate;

    @Value("${factus.base-url}")
    private String baseUrl;

    @Value("${factus.client-id}")
    private String clientId;

    @Value("${factus.client-secret}")
    private String clientSecret;

    @Value("${factus.username}")
    private String username;

    @Value("${factus.password}")
    private String password;

    private String cachedToken;
    private Instant tokenExpiresAt = Instant.EPOCH;

    public synchronized String getToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiresAt.minusSeconds(60))) {
            return cachedToken;
        }
        return fetchNewToken();
    }

    private String fetchNewToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", username);
        body.add("password", password);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/oauth/token",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                (Class<Map<String, Object>>) (Class<?>) Map.class
        );

        Map<String, Object> resp = response.getBody();
        cachedToken = (String) resp.get("access_token");
        int expiresIn = (Integer) resp.get("expires_in");
        tokenExpiresAt = Instant.now().plusSeconds(expiresIn);

        log.info("Factus token renovado, expira en {}s", expiresIn);
        return cachedToken;
    }
}
