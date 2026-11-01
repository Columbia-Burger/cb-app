package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShiftRepository extends JpaRepository<Shift, Long> {
    Optional<Shift> findByActiveTrue();

    List<Shift> findByOpenedAtGreaterThanEqualAndOpenedAtLessThanOrderByOpenedAtDesc(LocalDateTime from, LocalDateTime to);
}
