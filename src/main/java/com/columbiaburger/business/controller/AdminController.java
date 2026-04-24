package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.response.DailyStatResponse;
import com.columbiaburger.business.dto.response.DashboardStatsResponse;
import com.columbiaburger.business.dto.response.HourlyStatResponse;
import com.columbiaburger.business.dto.response.SourceStatResponse;
import com.columbiaburger.business.dto.response.TopProductResponse;
import com.columbiaburger.business.service.AdminService;
import com.columbiaburger.business.service.CatalogProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CatalogProxyService catalogProxyService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/products/top")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminService.getTopProducts(limit));
    }

    @GetMapping("/stats/daily")
    public ResponseEntity<List<DailyStatResponse>> getDailyStats(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(adminService.getDailyStats(days));
    }

    @GetMapping("/stats/by-source")
    public ResponseEntity<List<SourceStatResponse>> getStatsBySource() {
        return ResponseEntity.ok(adminService.getStatsBySource());
    }

    @GetMapping("/stats/by-hour")
    public ResponseEntity<List<HourlyStatResponse>> getStatsByHour() {
        return ResponseEntity.ok(adminService.getStatsByHour());
    }

    @GetMapping("/catalog/products")
    public ResponseEntity<String> getProducts() {
        return ResponseEntity.ok(catalogProxyService.getProducts());
    }

    @PatchMapping("/catalog/products/{id}/toggle")
    public ResponseEntity<Void> toggleProduct(@PathVariable Long id) {
        catalogProxyService.toggleAvailable(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/catalog/flavors")
    public ResponseEntity<String> getFlavors() {
        return ResponseEntity.ok(catalogProxyService.getFlavors());
    }

    @PatchMapping("/catalog/products/{id}/flavors")
    public ResponseEntity<Void> updateProductFlavors(
            @PathVariable Long id,
            @RequestBody List<Long> flavorIds) {
        catalogProxyService.updateProductFlavors(id, flavorIds);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/catalog/categories")
    public ResponseEntity<String> getCategories() {
        return ResponseEntity.ok(catalogProxyService.getCategories());
    }

    @PostMapping("/catalog/products")
    public ResponseEntity<String> createProduct(@RequestBody String body) {
        String result = catalogProxyService.createProduct(body);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/catalog/additions")
    public ResponseEntity<String> getAdditions() {
        return ResponseEntity.ok(catalogProxyService.getAdditions());
    }

    @PatchMapping("/catalog/products/{id}/additions")
    public ResponseEntity<Void> updateProductAdditions(
            @PathVariable Long id,
            @RequestBody List<Long> additionIds) {
        catalogProxyService.updateProductAdditions(id, additionIds);
        return ResponseEntity.noContent().build();
    }
}
