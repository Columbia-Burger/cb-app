package com.columbiaburger.business.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CatalogProxyService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${catalog.api.url}")
    private String catalogApiUrl;

    @Value("${catalog.api.key}")
    private String catalogApiKey;

    public String getProducts() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", catalogApiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                catalogApiUrl + "/api/products",
                HttpMethod.GET, entity, String.class);
        return response.getBody();
    }

    public void toggleAvailable(Long productId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", catalogApiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        restTemplate.exchange(
                catalogApiUrl + "/api/products/" + productId + "/toggle-available",
                HttpMethod.PATCH, entity, Void.class);
    }
}
