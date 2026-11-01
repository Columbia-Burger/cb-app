package com.columbiaburger.catalog.service;

import com.columbiaburger.catalog.dto.request.AdditionRequest;
import com.columbiaburger.catalog.dto.response.AdditionResponse;
import com.columbiaburger.catalog.entity.Addition;
import com.columbiaburger.catalog.repository.AdditionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdditionService {

    private final AdditionRepository additionRepository;

    public List<AdditionResponse> findAll() {
        return additionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AdditionResponse> findAllActive() {
        return additionRepository.findByActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    public AdditionResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    @Transactional
    public AdditionResponse create(AdditionRequest request) {
        Addition addition = Addition.builder()
                .name(request.getName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .build();
        return toResponse(additionRepository.save(addition));
    }

    @Transactional
    public AdditionResponse update(Long id, AdditionRequest request) {
        Addition addition = getOrThrow(id);
        addition.setName(request.getName());
        addition.setDescription(request.getDescription());
        addition.setBasePrice(request.getBasePrice());
        return toResponse(additionRepository.save(addition));
    }

    @Transactional
    public void toggleActive(Long id) {
        Addition addition = getOrThrow(id);
        addition.setActive(!addition.getActive());
        additionRepository.save(addition);
    }

    private Addition getOrThrow(Long id) {
        return additionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Addition not found: " + id));
    }

    private AdditionResponse toResponse(Addition a) {
        return AdditionResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .description(a.getDescription())
                .basePrice(a.getBasePrice())
                .active(a.getActive())
                .build();
    }
}
