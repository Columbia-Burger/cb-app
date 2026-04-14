package com.columbiaburger.api.service;

import com.columbiaburger.api.dto.request.DeliveryZoneRequest;
import com.columbiaburger.api.dto.response.DeliveryZoneResponse;
import com.columbiaburger.api.entity.DeliveryZone;
import com.columbiaburger.api.repository.DeliveryZoneRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryZoneService {

    private final DeliveryZoneRepository deliveryZoneRepository;

    public List<DeliveryZoneResponse> findAll() {
        return deliveryZoneRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<DeliveryZoneResponse> findAllActive() {
        return deliveryZoneRepository.findByActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    public DeliveryZoneResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    @Transactional
    public DeliveryZoneResponse create(DeliveryZoneRequest request) {
        DeliveryZone zone = DeliveryZone.builder()
                .name(request.getName())
                .deliveryFee(request.getDeliveryFee())
                .build();
        return toResponse(deliveryZoneRepository.save(zone));
    }

    @Transactional
    public DeliveryZoneResponse update(Long id, DeliveryZoneRequest request) {
        DeliveryZone zone = getOrThrow(id);
        zone.setName(request.getName());
        zone.setDeliveryFee(request.getDeliveryFee());
        return toResponse(deliveryZoneRepository.save(zone));
    }

    @Transactional
    public void toggleActive(Long id) {
        DeliveryZone zone = getOrThrow(id);
        zone.setActive(!zone.getActive());
        deliveryZoneRepository.save(zone);
    }

    private DeliveryZone getOrThrow(Long id) {
        return deliveryZoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DeliveryZone not found: " + id));
    }

    private DeliveryZoneResponse toResponse(DeliveryZone z) {
        return DeliveryZoneResponse.builder()
                .id(z.getId())
                .name(z.getName())
                .deliveryFee(z.getDeliveryFee())
                .active(z.getActive())
                .build();
    }
}
