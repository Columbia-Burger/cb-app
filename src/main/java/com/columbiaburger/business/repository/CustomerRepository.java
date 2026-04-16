package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByWhatsapp(String whatsapp);
    boolean existsByWhatsapp(String whatsapp);
}
