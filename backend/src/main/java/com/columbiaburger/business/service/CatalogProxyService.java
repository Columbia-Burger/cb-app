package com.columbiaburger.business.service;

import com.columbiaburger.catalog.dto.request.AdditionRequest;
import com.columbiaburger.catalog.dto.request.ComboRequest;
import com.columbiaburger.catalog.dto.request.DeliveryZoneRequest;
import com.columbiaburger.catalog.dto.request.ProductRequest;
import com.columbiaburger.catalog.service.AdditionService;
import com.columbiaburger.catalog.service.CategoryService;
import com.columbiaburger.catalog.service.DeliveryZoneService;
import com.columbiaburger.catalog.service.FlavorService;
import com.columbiaburger.catalog.service.ProductService;
import com.columbiaburger.catalog.service.SeasonalSpecialService;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Acceso al catálogo. Antes llamaba por HTTP al servicio cb-data-api; desde que el catálogo vive en
 * esta misma app (paquete com.columbiaburger.catalog) llama a sus servicios directamente. Se mantiene
 * la firma con JSON en texto para no cambiar a AdminController ni CatalogController.
 */
@Service
@RequiredArgsConstructor
public class CatalogProxyService {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final SeasonalSpecialService seasonalSpecialService;
    private final FlavorService flavorService;
    private final AdditionService additionService;
    private final DeliveryZoneService deliveryZoneService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    // ── Productos ────────────────────────────────────────────────

    public String getProducts() {
        return getProducts(false);
    }

    public String getProducts(boolean availableOnly) {
        return json(availableOnly ? productService.findAllAvailable() : productService.findAll());
    }

    public String createProduct(String body) {
        return json(productService.create(read(body, ProductRequest.class)));
    }

    public void toggleAvailable(Long productId) {
        productService.toggleAvailable(productId);
    }

    public void updateProductFlavors(Long productId, List<Long> flavorIds) {
        productService.updateFlavors(productId, flavorIds);
    }

    public void updateProductAdditions(Long productId, List<Long> additionIds) {
        productService.updateAdditions(productId, additionIds);
    }

    public void setProductCombo(Long id, String body) {
        productService.setCombo(id, read(body, ComboRequest.class));
    }

    public void clearProductCombo(Long id) {
        productService.clearCombo(id);
    }

    // ── Categorías, especiales, sabores ──────────────────────────

    public String getCategories() {
        return json(categoryService.findAll());
    }

    public String getSeasonalSpecials(boolean currentOnly) {
        return json(currentOnly ? seasonalSpecialService.findCurrentlyAvailable() : seasonalSpecialService.findAll());
    }

    public String getFlavors() {
        return json(flavorService.findAll());
    }

    // ── Adiciones ────────────────────────────────────────────────

    public String getAdditions() {
        return json(additionService.findAll());
    }

    public String createAddition(String body) {
        return json(additionService.create(read(body, AdditionRequest.class)));
    }

    public String updateAddition(Long id, String body) {
        return json(additionService.update(id, read(body, AdditionRequest.class)));
    }

    public void toggleAdditionActive(Long id) {
        additionService.toggleActive(id);
    }

    // ── Zonas de domicilio ───────────────────────────────────────

    public String getDeliveryZones(boolean activeOnly) {
        return json(activeOnly ? deliveryZoneService.findAllActive() : deliveryZoneService.findAll());
    }

    public String createDeliveryZone(String body) {
        return json(deliveryZoneService.create(read(body, DeliveryZoneRequest.class)));
    }

    public String updateDeliveryZone(Long id, String body) {
        return json(deliveryZoneService.update(id, read(body, DeliveryZoneRequest.class)));
    }

    public void toggleDeliveryZoneActive(Long id) {
        deliveryZoneService.toggleActive(id);
    }

    // ── Helpers ──────────────────────────────────────────────────

    /** Lee el cuerpo y aplica las mismas validaciones que tenía el @Valid del controlador del catálogo. */
    private <T> T read(String body, Class<T> type) {
        T value;
        try {
            value = objectMapper.readValue(body, type);
        } catch (JacksonException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datos inválidos: " + e.getOriginalMessage());
        }
        Set<ConstraintViolation<T>> violations = validator.validate(value);
        if (!violations.isEmpty()) {
            String message = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .sorted()
                    .collect(Collectors.joining("; "));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value;
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException e) {
            throw new IllegalStateException("No se pudo serializar la respuesta del catálogo", e);
        }
    }
}
