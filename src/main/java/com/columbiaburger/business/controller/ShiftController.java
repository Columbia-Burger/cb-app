package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.response.ShiftResponse;
import com.columbiaburger.business.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    // Endpoints públicos para n8n (cron automático)
    @PostMapping("/api/shifts/open")
    public ResponseEntity<ShiftResponse> open() {
        return ResponseEntity.ok(shiftService.open());
    }

    @PostMapping("/api/shifts/close")
    public ResponseEntity<ShiftResponse> close() {
        return ResponseEntity.ok(shiftService.close());
    }

    // Endpoint protegido para el frontend
    @GetMapping("/api/admin/shifts/current")
    public ResponseEntity<?> current() {
        return shiftService.current()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(Map.of("active", false)));
    }
}
