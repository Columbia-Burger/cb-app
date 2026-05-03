package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.request.CloseShiftRequest;
import com.columbiaburger.business.dto.request.OpenShiftRequest;
import com.columbiaburger.business.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    @GetMapping("/api/admin/shifts/current")
    public ResponseEntity<?> current() {
        return shiftService.current()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(Map.of("active", false)));
    }

    @PostMapping("/api/admin/shifts/open")
    public ResponseEntity<?> open(@RequestBody(required = false) OpenShiftRequest req) {
        return ResponseEntity.ok(shiftService.open(req));
    }

    @PostMapping("/api/admin/shifts/close")
    public ResponseEntity<?> close(@RequestBody(required = false) CloseShiftRequest req) {
        return ResponseEntity.ok(shiftService.close(req));
    }
}
