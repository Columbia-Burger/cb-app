package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.response.DashboardStatsResponse;
import com.columbiaburger.business.dto.response.TopProductResponse;
import com.columbiaburger.business.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/products/top")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminService.getTopProducts(limit));
    }
}
