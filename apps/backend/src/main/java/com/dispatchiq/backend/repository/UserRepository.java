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
    
    // We pass the role name as a plain text String to match the column transformer perfectly
    @Query(value = "SELECT * FROM users WHERE role = ?1::user_role AND onboarding_status = ?2", nativeQuery = true)
    List<User> findByRoleAndOnboardingStatus(Role role, String onboardingStatus);
}