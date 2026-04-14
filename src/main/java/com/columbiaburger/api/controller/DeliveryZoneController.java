package com.columbiaburger.api.controller;

import com.columbiaburger.api.dto.request.DeliveryZoneRequest;
import com.columbiaburger.api.dto.response.DeliveryZoneResponse;
import com.columbiaburger.api.service.DeliveryZoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Delivery Zones", description = "Gestión de zonas de delivery y sus tarifas")
@RestController
@RequestMapping("/api/delivery-zones")
@RequiredArgsConstructor
public class DeliveryZoneController {

    private final DeliveryZoneService deliveryZoneService;

    @Operation(summary = "Listar zonas de delivery")
    @GetMapping
    public List<DeliveryZoneResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return activeOnly ? deliveryZoneService.findAllActive() : deliveryZoneService.findAll();
    }

    @Operation(summary = "Obtener zona de delivery por ID")
    @GetMapping("/{id}")
    public DeliveryZoneResponse getById(@PathVariable Long id) {
        return deliveryZoneService.findById(id);
    }

    @Operation(summary = "Crear zona de delivery")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryZoneResponse create(@Valid @RequestBody DeliveryZoneRequest request) {
        return deliveryZoneService.create(request);
    }

    @Operation(summary = "Actualizar zona de delivery")
    @PutMapping("/{id}")
    public DeliveryZoneResponse update(@PathVariable Long id, @Valid @RequestBody DeliveryZoneRequest request) {
        return deliveryZoneService.update(id, request);
    }

    @Operation(summary = "Activar / desactivar zona de delivery")
    @PatchMapping("/{id}/toggle-active")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleActive(@PathVariable Long id) {
        deliveryZoneService.toggleActive(id);
    }
}
