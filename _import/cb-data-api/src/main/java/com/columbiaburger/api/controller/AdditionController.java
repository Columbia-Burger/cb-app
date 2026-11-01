package com.columbiaburger.api.controller;

import com.columbiaburger.api.dto.request.AdditionRequest;
import com.columbiaburger.api.dto.response.AdditionResponse;
import com.columbiaburger.api.service.AdditionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Additions", description = "Gestión de adiciones / extras para productos")
@RestController
@RequestMapping("/api/additions")
@RequiredArgsConstructor
public class AdditionController {

    private final AdditionService additionService;

    @Operation(summary = "Listar adiciones")
    @GetMapping
    public List<AdditionResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return activeOnly ? additionService.findAllActive() : additionService.findAll();
    }

    @Operation(summary = "Obtener adición por ID")
    @GetMapping("/{id}")
    public AdditionResponse getById(@PathVariable Long id) {
        return additionService.findById(id);
    }

    @Operation(summary = "Crear adición")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdditionResponse create(@Valid @RequestBody AdditionRequest request) {
        return additionService.create(request);
    }

    @Operation(summary = "Actualizar adición")
    @PutMapping("/{id}")
    public AdditionResponse update(@PathVariable Long id, @Valid @RequestBody AdditionRequest request) {
        return additionService.update(id, request);
    }

    @Operation(summary = "Activar / desactivar adición")
    @PatchMapping("/{id}/toggle-active")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleActive(@PathVariable Long id) {
        additionService.toggleActive(id);
    }
}
