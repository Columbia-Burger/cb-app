package com.columbiaburger.business.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CatalogProxyService {

    private final RestTemplate restTemplate = new RestTemplate(new JdkClientHttpRequestFactory());

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
        try {
            restTemplate.exchange(
                    catalogApiUrl + "/api/products/" + productId + "/toggle-available",
                    HttpMethod.PATCH, entity, Void.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String getFlavors() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", catalogApiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                catalogApiUrl + "/api/flavors",
                HttpMethod.GET, entity, String.class);
        return response.getBody();
    }

    public void updateProductFlavors(Long productId, List<Long> flavorIds) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", catalogApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<List<Long>> entity = new HttpEntity<>(flavorIds, headers);
        try {
            restTemplate.exchange(
                    catalogApiUrl + "/api/products/" + productId + "/flavors",
                    HttpMethod.PATCH, entity, Void.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String getCategories() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", catalogApiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                catalogApiUrl + "/api/categories",
                HttpMethod.GET, entity, String.class);
        return response.getBody();
    }

    public String createProduct(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", catalogApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/products",
                    HttpMethod.POST, entity, String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Error al crear el producto: " + e.getStatusCode());
        }
    }
}
