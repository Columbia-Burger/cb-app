package com.columbiaburger.business.controller;

import com.columbiaburger.business.service.CatalogProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogProxyService catalog;

    @GetMapping(value = "/api/categories", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getCategories() {
        return ResponseEntity.ok(catalog.getCategories());
    }

    @GetMapping(value = "/api/products", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getProducts(
            @RequestParam(defaultValue = "false") boolean availableOnly) {
        return ResponseEntity.ok(catalog.getProducts(availableOnly));
    }

    @GetMapping(value = "/api/seasonal-specials", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getSeasonalSpecials(
            @RequestParam(defaultValue = "false") boolean currentOnly) {
        return ResponseEntity.ok(catalog.getSeasonalSpecials(currentOnly));
    }
}
