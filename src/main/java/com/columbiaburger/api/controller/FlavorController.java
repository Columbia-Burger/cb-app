package com.columbiaburger.api.controller;

import com.columbiaburger.api.dto.request.FlavorRequest;
import com.columbiaburger.api.dto.response.FlavorResponse;
import com.columbiaburger.api.service.FlavorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Flavors", description = "Gestión de sabores de productos")
@RestController
@RequestMapping("/api/flavors")
@RequiredArgsConstructor
public class FlavorController {

    private final FlavorService flavorService;

    @Operation(summary = "Listar sabores")
    @GetMapping
    public List<FlavorResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return activeOnly ? flavorService.findAllActive() : flavorService.findAll();
    }

    @Operation(summary = "Obtener sabor por ID")
    @GetMapping("/{id}")
    public FlavorResponse getById(@PathVariable Long id) {
        return flavorService.findById(id);
    }

    @Operation(summary = "Crear sabor")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FlavorResponse create(@Valid @RequestBody FlavorRequest request) {
        return flavorService.create(request);
    }

    @Operation(summary = "Actualizar sabor")
    @PutMapping("/{id}")
    public FlavorResponse update(@PathVariable Long id, @Valid @RequestBody FlavorRequest request) {
        return flavorService.update(id, request);
    }

    @Operation(summary = "Activar / desactivar sabor")
    @PatchMapping("/{id}/toggle-active")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleActive(@PathVariable Long id) {
        flavorService.toggleActive(id);
    }
}
