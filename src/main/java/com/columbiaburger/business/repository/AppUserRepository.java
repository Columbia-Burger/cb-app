package com.columbiaburger.business.repository;

import com.columbiaburger.business.entity.AppUser;
import com.columbiaburger.business.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);

    long countByRoleAndActiveTrue(UserRole role);

    List<AppUser> findAllByOrderByActiveDescRoleAscUsernameAsc();
}
