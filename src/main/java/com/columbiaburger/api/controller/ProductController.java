package com.columbiaburger.api.controller;

import com.columbiaburger.api.dto.request.ProductRequest;
import com.columbiaburger.api.dto.response.ProductResponse;
import com.columbiaburger.api.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Products", description = "Gestión de productos del menú")
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @Operation(summary = "Listar productos", description = "Filtra por availableOnly=true o por categoryId.")
    @GetMapping
    public List<ProductResponse> getAll(
            @RequestParam(defaultValue = "false") boolean availableOnly,
            @RequestParam(required = false) Long categoryId) {
        if (categoryId != null) return productService.findByCategory(categoryId);
        return availableOnly ? productService.findAllAvailable() : productService.findAll();
    }

    @Operation(summary = "Obtener producto por ID")
    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.findById(id);
    }

    @Operation(summary = "Crear producto")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @Operation(summary = "Actualizar producto")
    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @Operation(summary = "Activar / desactivar disponibilidad del producto")
    @PatchMapping("/{id}/toggle-available")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleAvailable(@PathVariable Long id) {
        productService.toggleAvailable(id);
    }

    @Operation(summary = "Actualizar sabores del producto")
    @PatchMapping("/{id}/flavors")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateFlavors(@PathVariable Long id, @RequestBody List<Long> flavorIds) {
        productService.updateFlavors(id, flavorIds);
    }
}
