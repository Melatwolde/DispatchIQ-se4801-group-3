package com.dispatchiq.backend.repository;

import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    

List<User> findByRoleAndOnboardingStatus(@Param("role") Role role, @Param("status") String onboardingStatus);
}