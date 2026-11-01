package com.columbiaburger.catalog.repository;

import com.columbiaburger.catalog.entity.SeasonalSpecial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SeasonalSpecialRepository extends JpaRepository<SeasonalSpecial, Long> {
    List<SeasonalSpecial> findByActiveTrue();
    List<SeasonalSpecial> findByActiveTrueAndSeasonStartLessThanEqualAndSeasonEndGreaterThanEqual(
            LocalDate start, LocalDate end);
}
