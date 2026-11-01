package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.CustomerResponse;
import com.columbiaburger.business.entity.Customer;
import com.columbiaburger.business.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse findOrCreate(String name, String whatsapp, String neighborhood, String address) {
        Customer customer = customerRepository.findByWhatsapp(whatsapp)
                .orElseGet(() -> customerRepository.save(
                        Customer.builder()
                                .name(name)
                                .whatsapp(whatsapp)
                                .neighborhood(neighborhood)
                                .address(address)
                                .build()
                ));
        // Update name/neighborhood/address if provided and changed
        boolean changed = false;
        if (name != null && !name.isBlank() && !name.equals(customer.getName())) {
            customer.setName(name);
            changed = true;
        }
        if (neighborhood != null && !neighborhood.isBlank() && !neighborhood.equals(customer.getNeighborhood())) {
            customer.setNeighborhood(neighborhood);
            changed = true;
        }
        if (address != null && !address.isBlank() && !address.equals(customer.getAddress())) {
            customer.setAddress(address);
            changed = true;
        }
        if (changed) {
            customer = customerRepository.save(customer);
        }
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> findAll() {
        return customerRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        return customerRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .whatsapp(c.getWhatsapp())
                .neighborhood(c.getNeighborhood())
                .address(c.getAddress())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
