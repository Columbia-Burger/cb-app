package com.columbiaburger.api.controller;

import com.columbiaburger.api.dto.request.SeasonalSpecialRequest;
import com.columbiaburger.api.dto.response.SeasonalSpecialResponse;
import com.columbiaburger.api.service.SeasonalSpecialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Seasonal Specials", description = "Especiales de temporada disponibles en el menú")
@RestController
@RequestMapping("/api/seasonal-specials")
@RequiredArgsConstructor
public class SeasonalSpecialController {

    private final SeasonalSpecialService seasonalSpecialService;

    @Operation(summary = "Listar especiales de temporada", description = "Usa currentOnly=true para obtener solo los vigentes hoy.")
    @GetMapping
    public List<SeasonalSpecialResponse> getAll(@RequestParam(defaultValue = "false") boolean currentOnly) {
        return currentOnly
                ? seasonalSpecialService.findCurrentlyAvailable()
                : seasonalSpecialService.findAll();
    }

    @Operation(summary = "Obtener especial por ID")
    @GetMapping("/{id}")
    public SeasonalSpecialResponse getById(@PathVariable Long id) {
        return seasonalSpecialService.findById(id);
    }

    @Operation(summary = "Crear especial de temporada")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SeasonalSpecialResponse create(@Valid @RequestBody SeasonalSpecialRequest request) {
        return seasonalSpecialService.create(request);
    }

    @Operation(summary = "Actualizar especial de temporada")
    @PutMapping("/{id}")
    public SeasonalSpecialResponse update(@PathVariable Long id, @Valid @RequestBody SeasonalSpecialRequest request) {
        return seasonalSpecialService.update(id, request);
    }

    @Operation(summary = "Activar / desactivar especial de temporada")
    @PatchMapping("/{id}/toggle-active")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleActive(@PathVariable Long id) {
        seasonalSpecialService.toggleActive(id);
    }
}
