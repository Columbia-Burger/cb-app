package com.columbiaburger.api.service;

import com.columbiaburger.api.dto.request.SeasonalSpecialRequest;
import com.columbiaburger.api.dto.response.SeasonalSpecialResponse;
import com.columbiaburger.api.entity.SeasonalSpecial;
import com.columbiaburger.api.repository.SeasonalSpecialRepository;
import com.columbiaburger.api.util.BogotaTime;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeasonalSpecialService {

    private final SeasonalSpecialRepository seasonalSpecialRepository;

    public List<SeasonalSpecialResponse> findAll() {
        return seasonalSpecialRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<SeasonalSpecialResponse> findAllActive() {
        return seasonalSpecialRepository.findByActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<SeasonalSpecialResponse> findCurrentlyAvailable() {
        var today = BogotaTime.today();
        return seasonalSpecialRepository
                .findByActiveTrueAndSeasonStartLessThanEqualAndSeasonEndGreaterThanEqual(today, today)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SeasonalSpecialResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    @Transactional
    public SeasonalSpecialResponse create(SeasonalSpecialRequest request) {
        SeasonalSpecial special = SeasonalSpecial.builder()
                .name(request.getName())
                .description(request.getDescription())
                .tagline(request.getTagline())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .seasonStart(request.getSeasonStart())
                .seasonEnd(request.getSeasonEnd())
                .build();
        return toResponse(seasonalSpecialRepository.save(special));
    }

    @Transactional
    public SeasonalSpecialResponse update(Long id, SeasonalSpecialRequest request) {
        SeasonalSpecial special = getOrThrow(id);
        special.setName(request.getName());
        special.setDescription(request.getDescription());
        special.setTagline(request.getTagline());
        special.setPrice(request.getPrice());
        special.setImageUrl(request.getImageUrl());
        special.setSeasonStart(request.getSeasonStart());
        special.setSeasonEnd(request.getSeasonEnd());
        return toResponse(seasonalSpecialRepository.save(special));
    }

    @Transactional
    public void toggleActive(Long id) {
        SeasonalSpecial special = getOrThrow(id);
        special.setActive(!special.getActive());
        seasonalSpecialRepository.save(special);
    }

    private SeasonalSpecial getOrThrow(Long id) {
        return seasonalSpecialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("SeasonalSpecial not found: " + id));
    }

    private SeasonalSpecialResponse toResponse(SeasonalSpecial s) {
        return SeasonalSpecialResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .tagline(s.getTagline())
                .price(s.getPrice())
                .imageUrl(s.getImageUrl())
                .active(s.getActive())
                .seasonStart(s.getSeasonStart())
                .seasonEnd(s.getSeasonEnd())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
