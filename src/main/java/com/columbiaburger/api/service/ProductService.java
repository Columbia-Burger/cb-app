package com.columbiaburger.api.service;

import com.columbiaburger.api.dto.request.ProductRequest;
import com.columbiaburger.api.dto.response.ProductAdditionResponse;
import com.columbiaburger.api.dto.response.ProductResponse;
import com.columbiaburger.api.entity.Category;
import com.columbiaburger.api.entity.Flavor;
import com.columbiaburger.api.entity.Product;
import com.columbiaburger.api.repository.CategoryRepository;
import com.columbiaburger.api.repository.FlavorRepository;
import com.columbiaburger.api.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FlavorRepository flavorRepository;

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ProductResponse> findAllAvailable() {
        return productRepository.findByAvailableTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ProductResponse> findByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + request.getCategoryId()));

        Flavor flavor = null;
        if (request.getFlavorId() != null) {
            flavor = flavorRepository.findById(request.getFlavorId())
                    .orElseThrow(() -> new EntityNotFoundException("Flavor not found: " + request.getFlavorId()));
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .category(category)
                .flavor(flavor)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getOrThrow(id);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + request.getCategoryId()));

        Flavor flavor = null;
        if (request.getFlavorId() != null) {
            flavor = flavorRepository.findById(request.getFlavorId())
                    .orElseThrow(() -> new EntityNotFoundException("Flavor not found: " + request.getFlavorId()));
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(category);
        product.setFlavor(flavor);

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void toggleAvailable(Long id) {
        Product product = getOrThrow(id);
        product.setAvailable(!product.getAvailable());
        productRepository.save(product);
    }

    private Product getOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));
    }

    private ProductResponse toResponse(Product p) {
        List<ProductAdditionResponse> additions = p.getProductAdditions() == null ? List.of() :
                p.getProductAdditions().stream()
                        .map(pa -> ProductAdditionResponse.builder()
                                .id(pa.getId())
                                .additionId(pa.getAddition().getId())
                                .additionName(pa.getAddition().getName())
                                .basePrice(pa.getAddition().getBasePrice())
                                .priceOverride(pa.getPriceOverride())
                                .effectivePrice(pa.getPriceOverride() != null
                                        ? pa.getPriceOverride()
                                        : pa.getAddition().getBasePrice())
                                .build())
                        .toList();

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .imageUrl(p.getImageUrl())
                .available(p.getAvailable())
                .categoryId(p.getCategory().getId())
                .categoryName(p.getCategory().getName())
                .flavorId(p.getFlavor() != null ? p.getFlavor().getId() : null)
                .flavorName(p.getFlavor() != null ? p.getFlavor().getName() : null)
                .additions(additions)
                .build();
    }
}
