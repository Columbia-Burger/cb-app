package com.columbiaburger.api.config;

import com.columbiaburger.api.entity.Flavor;
import com.columbiaburger.api.entity.Product;
import com.columbiaburger.api.repository.FlavorRepository;
import com.columbiaburger.api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class FlavorSeeder implements ApplicationRunner {

    private final FlavorRepository flavorRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Flavor agua = flavorRepository.findByName("Agua")
                .orElseGet(() -> flavorRepository.save(
                        Flavor.builder().name("Agua").active(true).build()));

        Flavor leche = flavorRepository.findByName("Leche")
                .orElseGet(() -> flavorRepository.save(
                        Flavor.builder().name("Leche").active(true).build()));

        List<Product> jugos = productRepository.findByNameContainingIgnoreCaseWithFlavors("jugo natural");

        for (Product product : jugos) {
            List<Flavor> flavors = product.getFlavors();
            boolean changed = false;
            if (flavors.stream().noneMatch(f -> "Agua".equals(f.getName()))) {
                flavors.add(agua);
                changed = true;
            }
            if (flavors.stream().noneMatch(f -> "Leche".equals(f.getName()))) {
                flavors.add(leche);
                changed = true;
            }
            if (changed) {
                productRepository.save(product);
            }
        }
    }
}
