package com.columbiaburger.business.controller;

import com.columbiaburger.business.dto.response.CouponResponse;
import com.columbiaburger.business.dto.response.CouponValidateResponse;
import com.columbiaburger.business.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    public ResponseEntity<List<CouponResponse>> findAll() {
        return ResponseEntity.ok(couponService.findAll());
    }

    @PostMapping
    public ResponseEntity<CouponResponse> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.create(body));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<CouponResponse> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(couponService.toggle(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponValidateResponse> validate(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        BigDecimal total = new BigDecimal(body.get("total").toString());
        return ResponseEntity.ok(couponService.validate(code, total));
    }
}
