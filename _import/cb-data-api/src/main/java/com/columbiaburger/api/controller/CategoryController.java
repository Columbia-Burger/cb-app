package com.columbiaburger.api.controller;

import com.columbiaburger.api.dto.request.CategoryRequest;
import com.columbiaburger.api.dto.response.CategoryResponse;
import com.columbiaburger.api.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Categories", description = "Gestión de categorías de productos")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "Listar categorías", description = "Retorna todas las categorías. Usa activeOnly=true para filtrar solo las activas.")
    @GetMapping
    public List<CategoryResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return activeOnly ? categoryService.findAllActive() : categoryService.findAll();
    }

    @Operation(summary = "Obtener categoría por ID")
    @GetMapping("/{id}")
    public CategoryResponse getById(@PathVariable Long id) {
        return categoryService.findById(id);
    }

    @Operation(summary = "Crear categoría")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @Operation(summary = "Actualizar categoría")
    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @Operation(summary = "Activar / desactivar categoría")
    @PatchMapping("/{id}/toggle-active")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleActive(@PathVariable Long id) {
        categoryService.toggleActive(id);
    }
}
