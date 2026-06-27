package com.dispatchiq.backend.repository;

import com.dispatchiq.backend.entity.Assignment;
import com.dispatchiq.backend.entity.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    long countByDriverIdAndStatusIn(UUID driverId, List<AssignmentStatus> statuses);

    Optional<Assignment> findByIdAndDriverId(UUID id, UUID driverId);

    Optional<Assignment> findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(UUID driverId, List<AssignmentStatus> statuses);
}
