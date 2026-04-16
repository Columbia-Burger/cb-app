package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByCustomerIdOrderByCreatedAtAsc(Long customerId);
    void deleteByCustomerId(Long customerId);
}
