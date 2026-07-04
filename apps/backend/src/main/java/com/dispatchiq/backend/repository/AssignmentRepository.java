package com.dispatchiq.backend.repository;

import com.dispatchiq.backend.entity.Assignment;
import com.dispatchiq.backend.entity.AssignmentStatus;
import com.dispatchiq.backend.entity.DeliveryStatus; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    long countByDriverIdAndStatusIn(UUID driverId, List<AssignmentStatus> statuses);

    Optional<Assignment> findByIdAndDriverId(UUID id, UUID driverId);

    Optional<Assignment> findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(UUID driverId, List<AssignmentStatus> statuses);

    List<Assignment> findByDeliveryIdAndStatusIn(UUID deliveryId, List<AssignmentStatus> statuses);

    List<Assignment> findByDriverIdAndStatusInOrderByCreatedAtDesc(UUID driverId, List<AssignmentStatus> statuses);

    List<Assignment> findByStatusOrderByCreatedAtDesc(AssignmentStatus status);

    // --- ADD THIS METHOD ---
    @Query("SELECT a FROM Assignment a WHERE a.delivery.status = :status ORDER BY a.createdAt DESC")
    List<Assignment> findByDeliveryStatusOrderByCreatedAtDesc(@Param("status") DeliveryStatus status);
}