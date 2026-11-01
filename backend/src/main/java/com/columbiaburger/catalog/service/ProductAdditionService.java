package com.columbiaburger.catalog.service;

import com.columbiaburger.catalog.dto.request.ProductAdditionRequest;
import com.columbiaburger.catalog.dto.response.ProductAdditionResponse;
import com.columbiaburger.catalog.entity.Addition;
import com.columbiaburger.catalog.entity.Product;
import com.columbiaburger.catalog.entity.ProductAddition;
import com.columbiaburger.catalog.repository.AdditionRepository;
import com.columbiaburger.catalog.repository.ProductAdditionRepository;
import com.columbiaburger.catalog.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductAdditionService {

    private final ProductAdditionRepository productAdditionRepository;
    private final ProductRepository productRepository;
    private final AdditionRepository additionRepository;

    public List<ProductAdditionResponse> findByProduct(Long productId) {
        return productAdditionRepository.findByProductId(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductAdditionResponse create(ProductAdditionRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + request.getProductId()));
        Addition addition = additionRepository.findById(request.getAdditionId())
                .orElseThrow(() -> new EntityNotFoundException("Addition not found: " + request.getAdditionId()));

        ProductAddition pa = ProductAddition.builder()
                .product(product)
                .addition(addition)
                .priceOverride(request.getPriceOverride())
                .build();

        return toResponse(productAdditionRepository.save(pa));
    }

    @Transactional
    public void delete(Long id) {
        if (!productAdditionRepository.existsById(id)) {
            throw new EntityNotFoundException("ProductAddition not found: " + id);
        }
        productAdditionRepository.deleteById(id);
    }

    private ProductAdditionResponse toResponse(ProductAddition pa) {
        return ProductAdditionResponse.builder()
                .id(pa.getId())
                .additionId(pa.getAddition().getId())
                .additionName(pa.getAddition().getName())
                .basePrice(pa.getAddition().getBasePrice())
                .priceOverride(pa.getPriceOverride())
                .effectivePrice(pa.getPriceOverride() != null
                        ? pa.getPriceOverride()
                        : pa.getAddition().getBasePrice())
                .build();
    }
}
