package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.ShiftResponse;
import com.columbiaburger.business.entity.Shift;
import com.columbiaburger.business.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ShiftService {

    private final ShiftRepository shiftRepository;

    @Transactional
    public ShiftResponse open() {
        shiftRepository.findByActiveTrue().ifPresent(s -> {
            s.setActive(false);
            s.setClosedAt(LocalDateTime.now());
            shiftRepository.save(s);
        });

        Shift shift = Shift.builder()
                .openedAt(LocalDateTime.now())
                .active(true)
                .build();

        return toResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ShiftResponse close() {
        Shift shift = shiftRepository.findByActiveTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay turno activo"));
        shift.setActive(false);
        shift.setClosedAt(LocalDateTime.now());
        return toResponse(shiftRepository.save(shift));
    }

    @Transactional(readOnly = true)
    public Optional<ShiftResponse> current() {
        return shiftRepository.findByActiveTrue().map(this::toResponse);
    }

    private ShiftResponse toResponse(Shift s) {
        return ShiftResponse.builder()
                .id(s.getId())
                .openedAt(s.getOpenedAt())
                .closedAt(s.getClosedAt())
                .active(s.isActive())
                .build();
    }
}
