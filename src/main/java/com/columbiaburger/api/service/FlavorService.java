package com.columbiaburger.api.service;

import com.columbiaburger.api.dto.request.FlavorRequest;
import com.columbiaburger.api.dto.response.FlavorResponse;
import com.columbiaburger.api.entity.Flavor;
import com.columbiaburger.api.repository.FlavorRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FlavorService {

    private final FlavorRepository flavorRepository;

    public List<FlavorResponse> findAll() {
        return flavorRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<FlavorResponse> findAllActive() {
        return flavorRepository.findByActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    public FlavorResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    @Transactional
    public FlavorResponse create(FlavorRequest request) {
        Flavor flavor = Flavor.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        return toResponse(flavorRepository.save(flavor));
    }

    @Transactional
    public FlavorResponse update(Long id, FlavorRequest request) {
        Flavor flavor = getOrThrow(id);
        flavor.setName(request.getName());
        flavor.setDescription(request.getDescription());
        return toResponse(flavorRepository.save(flavor));
    }

    @Transactional
    public void toggleActive(Long id) {
        Flavor flavor = getOrThrow(id);
        flavor.setActive(!flavor.getActive());
        flavorRepository.save(flavor);
    }

    private Flavor getOrThrow(Long id) {
        return flavorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Flavor not found: " + id));
    }

    private FlavorResponse toResponse(Flavor f) {
        return FlavorResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .description(f.getDescription())
                .active(f.getActive())
                .build();
    }
}
