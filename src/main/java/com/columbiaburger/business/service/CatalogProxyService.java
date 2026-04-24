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

    private HttpHeaders apiHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set("X-API-Key", catalogApiKey);
        return h;
    }

    private HttpHeaders apiJsonHeaders() {
        HttpHeaders h = apiHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    public String getProducts() {
        ResponseEntity<String> response = restTemplate.exchange(
                catalogApiUrl + "/api/products",
                HttpMethod.GET, new HttpEntity<>(apiHeaders()), String.class);
        return response.getBody();
    }

    public void toggleAvailable(Long productId) {
        try {
            restTemplate.exchange(
                    catalogApiUrl + "/api/products/" + productId + "/toggle-available",
                    HttpMethod.PATCH, new HttpEntity<>(apiHeaders()), Void.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String getFlavors() {
        ResponseEntity<String> response = restTemplate.exchange(
                catalogApiUrl + "/api/flavors",
                HttpMethod.GET, new HttpEntity<>(apiHeaders()), String.class);
        return response.getBody();
    }

    public void updateProductFlavors(Long productId, List<Long> flavorIds) {
        try {
            restTemplate.exchange(
                    catalogApiUrl + "/api/products/" + productId + "/flavors",
                    HttpMethod.PATCH, new HttpEntity<>(flavorIds, apiJsonHeaders()), Void.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String getCategories() {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/categories",
                    HttpMethod.GET, new HttpEntity<>(apiHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String getAdditions() {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/additions",
                    HttpMethod.GET, new HttpEntity<>(apiHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public void updateProductAdditions(Long productId, List<Long> additionIds) {
        try {
            restTemplate.exchange(
                    catalogApiUrl + "/api/products/" + productId + "/additions",
                    HttpMethod.PATCH, new HttpEntity<>(additionIds, apiJsonHeaders()), Void.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String createProduct(String body) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/products",
                    HttpMethod.POST, new HttpEntity<>(body, apiJsonHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Error al crear el producto: " + e.getStatusCode());
        }
    }

    public String getDeliveryZones(boolean activeOnly) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/delivery-zones?activeOnly=" + activeOnly,
                    HttpMethod.GET, new HttpEntity<>(apiHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String createDeliveryZone(String body) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/delivery-zones",
                    HttpMethod.POST, new HttpEntity<>(body, apiJsonHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Error al crear la zona: " + e.getStatusCode());
        }
    }

    public String updateDeliveryZone(Long id, String body) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/delivery-zones/" + id,
                    HttpMethod.PUT, new HttpEntity<>(body, apiJsonHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Error al actualizar la zona: " + e.getStatusCode());
        }
    }

    public void toggleDeliveryZoneActive(Long id) {
        try {
            restTemplate.exchange(
                    catalogApiUrl + "/api/delivery-zones/" + id + "/toggle-active",
                    HttpMethod.PATCH, new HttpEntity<>(apiHeaders()), Void.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }

    public String createAddition(String body) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/additions",
                    HttpMethod.POST, new HttpEntity<>(body, apiJsonHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Error al crear la adición: " + e.getStatusCode());
        }
    }

    public String updateAddition(Long id, String body) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    catalogApiUrl + "/api/additions/" + id,
                    HttpMethod.PUT, new HttpEntity<>(body, apiJsonHeaders()), String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Error al actualizar la adición: " + e.getStatusCode());
        }
    }

    public void toggleAdditionActive(Long id) {
        try {
            restTemplate.exchange(
                    catalogApiUrl + "/api/additions/" + id + "/toggle-active",
                    HttpMethod.PATCH, new HttpEntity<>(apiHeaders()), Void.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al contactar el catálogo: " + e.getStatusCode());
        }
    }
}
