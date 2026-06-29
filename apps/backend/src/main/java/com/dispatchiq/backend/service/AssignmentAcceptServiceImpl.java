package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.AssignmentAcceptResponse;
import com.dispatchiq.backend.api.exception.AssignmentConflictException;
import com.dispatchiq.backend.api.exception.AssignmentValidationException;
import com.dispatchiq.backend.entity.*;
import com.dispatchiq.backend.repository.AssignmentRepository;
import com.dispatchiq.backend.repository.DeliveryRepository;
import com.dispatchiq.backend.repository.DriverProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AssignmentAcceptServiceImpl implements AssignmentAcceptService {

    private static final Duration LOCK_TTL = Duration.ofMinutes(5);
    private static final List<AssignmentStatus> ACTIVE_STATUSES = List.of(
            AssignmentStatus.ASSIGNED,
            AssignmentStatus.ACCEPTED,
            AssignmentStatus.IN_TRANSIT);

    private final AssignmentRepository assignmentRepository;
    private final DeliveryRepository deliveryRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final StringRedisTemplate redisTemplate;

    @Autowired
    public AssignmentAcceptServiceImpl(
            AssignmentRepository assignmentRepository,
            DeliveryRepository deliveryRepository,
            DriverProfileRepository driverProfileRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.assignmentRepository = assignmentRepository;
        this.deliveryRepository = deliveryRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.redisTemplate = redisTemplate;
    }

    @Override
    @Transactional
    public AssignmentAcceptResponse acceptAssignment(UUID assignmentId, UUID driverId) {
        System.out.println("Accept requested for assignmentId=" + assignmentId + ", driverId=" + driverId);
        acquireLock(assignmentId);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AssignmentValidationException("Assignment not found"));

        UUID assignedDriverId = assignment.getDriver().getId();
        System.out.println("Loaded assignment for accept. assignmentId=" + assignmentId
                + ", assignedDriverId=" + assignedDriverId
                + ", requestingDriverId=" + driverId
                + ", status=" + assignment.getStatus());

        if (!assignedDriverId.equals(driverId)) {
            throw new AssignmentValidationException("Assignment is assigned to another driver");
        }

        Delivery delivery = assignment.getDelivery();
        // True conflict check: check if the delivery has already been accepted or is
        // in-transit by another driver
        List<Assignment> activeAssignments = assignmentRepository.findByDeliveryIdAndStatusIn(
                delivery.getId(),
                List.of(AssignmentStatus.ACCEPTED, AssignmentStatus.IN_TRANSIT, AssignmentStatus.COMPLETED));
        for (Assignment active : activeAssignments) {
            if (!active.getDriver().getId().equals(driverId)) {
                System.out.println("Conflict: delivery " + delivery.getId() + " was already taken by driver "
                        + active.getDriver().getId());
                throw new AssignmentValidationException("This assignment was already taken by another driver");
            }
        }

        if (assignment.getStatus() == AssignmentStatus.ACCEPTED) {
            System.out.println("Assignment already accepted by assigned driver. assignmentId=" + assignmentId);
            return toResponse(assignment, "Assignment already accepted");
        }

        if (assignment.getStatus() != AssignmentStatus.ASSIGNED) {
            throw new AssignmentValidationException("Assignment is not in assignable state: " + assignment.getStatus());
        }

        DriverProfile profile = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new AssignmentValidationException("Driver profile not found"));

        System.out.println("Accepting assignment without availability, capacity, or proximity gate. assignmentId="
                + assignmentId + ", driverId=" + driverId
                + ", currentDriverState=" + profile.getStructuralState());

        OffsetDateTime acceptedAt = OffsetDateTime.now();
        assignment.setStatus(AssignmentStatus.ACCEPTED);
        assignment.setAcceptedAt(acceptedAt);

        deliveryRepository.updateStatusById(delivery.getId(), DeliveryStatus.ASSIGNED);

        profile.setStructuralState(DriverStructuralState.ON_DELIVERY);
        if (profile.getCurrentLat() == null) {
            profile.setCurrentLat(assignment.getPickupLat());
            profile.setCurrentLng(assignment.getPickupLng());
        }

        assignmentRepository.save(assignment);
        driverProfileRepository.save(profile);

        System.out.println("Assignment accepted successfully. assignmentId=" + assignment.getId()
                + ", deliveryId=" + delivery.getId()
                + ", driverId=" + driverId);

        return toResponse(assignment, "Assignment accepted successfully");
    }

    private void acquireLock(UUID assignmentId) {
        String key = "lock:assignment:" + assignmentId;
        if (redisTemplate != null) {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, "LOCKED", LOCK_TTL);
            if (!Boolean.TRUE.equals(acquired)) {
                System.out.println("Assignment lock already held. assignmentId=" + assignmentId);
                throw new AssignmentConflictException("Assignment is being processed");
            }
            System.out.println("Assignment lock acquired. assignmentId=" + assignmentId);
            return;
        }
        System.out.println("Redis unavailable; accepting without distributed lock. assignmentId=" + assignmentId);
        // Fallback when Redis unavailable: proceed without distributed lock
    }

    private void validateProximity(DriverProfile profile, Assignment assignment) {
        Double driverLat = profile.getCurrentLat();
        Double driverLng = profile.getCurrentLng();

        if (driverLat == null || driverLng == null) {
            driverLat = assignment.getPickupLat();
            driverLng = assignment.getPickupLng();
        }

        double distanceMeters = haversineMeters(
                driverLat, driverLng,
                assignment.getPickupLat(), assignment.getPickupLng());

        if (distanceMeters > profile.getProximityRadiusMeters()) {
            throw new AssignmentValidationException(String.format(
                    "Driver too far from pickup (%.0fm > %dm radius)",
                    distanceMeters, profile.getProximityRadiusMeters()));
        }
    }

    static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private AssignmentAcceptResponse toResponse(Assignment assignment, String message) {
        return new AssignmentAcceptResponse(
                assignment.getId().toString(),
                assignment.getStatus().name(),
                message,
                assignment.getDelivery().getId().toString(),
                assignment.getAcceptedAt());
    }
}
