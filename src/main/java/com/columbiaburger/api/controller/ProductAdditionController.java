package com.columbiaburger.api.controller;

import com.columbiaburger.api.dto.request.ProductAdditionRequest;
import com.columbiaburger.api.dto.response.ProductAdditionResponse;
import com.columbiaburger.api.service.ProductAdditionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Product Additions", description = "Relación entre productos y sus adiciones disponibles")
@RestController
@RequestMapping("/api/product-additions")
@RequiredArgsConstructor
public class ProductAdditionController {

    private final ProductAdditionService productAdditionService;

    @Operation(summary = "Listar adiciones de un producto", description = "Requiere productId como query param.")
    @GetMapping
    public List<ProductAdditionResponse> getByProduct(@RequestParam Long productId) {
        return productAdditionService.findByProduct(productId);
    }

    @Operation(summary = "Asignar adición a un producto")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductAdditionResponse create(@Valid @RequestBody ProductAdditionRequest request) {
        return productAdditionService.create(request);
    }

    @Operation(summary = "Quitar adición de un producto")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        productAdditionService.delete(id);
    }
}
