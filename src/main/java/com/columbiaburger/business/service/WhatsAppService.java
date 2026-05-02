package com.columbiaburger.business.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
public class WhatsAppService {

    @Value("${whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.access-token:}")
    private String accessToken;

    private static final String GRAPH_API = "https://graph.facebook.com/v19.0";

    public void sendText(String whatsappNumber, String message) {
        if (phoneNumberId.isBlank() || accessToken.isBlank()) {
            log.warn("WhatsApp no configurado — omitiendo mensaje a {}", whatsappNumber);
            return;
        }
        try {
            RestClient.create().post()
                    .uri(GRAPH_API + "/" + phoneNumberId + "/messages")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "messaging_product", "whatsapp",
                            "to", whatsappNumber,
                            "type", "text",
                            "text", Map.of("body", message)
                    ))
                    .retrieve()
                    .toBodilessEntity();
            log.info("WhatsApp enviado a {}", whatsappNumber);
        } catch (Exception e) {
            log.error("Error enviando WhatsApp a {}: {}", whatsappNumber, e.getMessage());
        }
    }
}
