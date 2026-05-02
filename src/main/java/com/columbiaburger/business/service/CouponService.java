package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.CouponResponse;
import com.columbiaburger.business.dto.response.CouponValidateResponse;
import com.columbiaburger.business.entity.Coupon;
import com.columbiaburger.business.entity.CouponType;
import com.columbiaburger.business.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public List<CouponResponse> findAll() {
        return couponRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CouponResponse create(Map<String, Object> body) {
        String code = ((String) body.get("code")).toUpperCase().trim();
        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El código ya existe");
        }
        Coupon coupon = Coupon.builder()
                .code(code)
                .type(CouponType.valueOf((String) body.get("type")))
                .value(new BigDecimal(body.get("value").toString()))
                .active(true)
                .maxUses(body.get("maxUses") != null ? (Integer) body.get("maxUses") : null)
                .expiresAt(body.get("expiresAt") != null
                        ? LocalDateTime.parse((String) body.get("expiresAt")) : null)
                .build();
        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public CouponResponse toggle(Long id) {
        Coupon coupon = findEntity(id);
        coupon.setActive(!coupon.getActive());
        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public void delete(Long id) {
        couponRepository.delete(findEntity(id));
    }

    /** Validates a coupon code against an order total and returns the discount amount. */
    @Transactional(readOnly = true)
    public CouponValidateResponse validate(String code, BigDecimal orderTotal) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cupón no encontrado"));

        if (!coupon.getActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cupón no está activo");
        }
        if (coupon.getExpiresAt() != null && LocalDateTime.now().isAfter(coupon.getExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cupón ha expirado");
        }
        if (coupon.getMaxUses() != null && coupon.getCurrentUses() >= coupon.getMaxUses()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cupón ha alcanzado su límite de usos");
        }

        BigDecimal discount = coupon.getType() == CouponType.PERCENTAGE
                ? orderTotal.multiply(coupon.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : coupon.getValue().min(orderTotal);

        return CouponValidateResponse.builder()
                .code(coupon.getCode())
                .type(coupon.getType())
                .value(coupon.getValue())
                .discountAmount(discount)
                .build();
    }

    /** Called when an order with a coupon is confirmed — increments usage count. */
    @Transactional
    public void incrementUsage(String code) {
        couponRepository.findByCodeIgnoreCase(code).ifPresent(c -> {
            c.setCurrentUses(c.getCurrentUses() + 1);
            couponRepository.save(c);
        });
    }

    private Coupon findEntity(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cupón no encontrado"));
    }

    private CouponResponse toResponse(Coupon c) {
        return CouponResponse.builder()
                .id(c.getId())
                .code(c.getCode())
                .type(c.getType())
                .value(c.getValue())
                .active(c.getActive())
                .expiresAt(c.getExpiresAt())
                .maxUses(c.getMaxUses())
                .currentUses(c.getCurrentUses())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
