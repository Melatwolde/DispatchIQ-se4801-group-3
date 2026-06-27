package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.AssignmentAcceptResponse;
import com.dispatchiq.backend.api.exception.AssignmentConflictException;
import com.dispatchiq.backend.api.exception.AssignmentValidationException;
import com.dispatchiq.backend.entity.*;
import com.dispatchiq.backend.repository.AssignmentRepository;
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
            AssignmentStatus.IN_TRANSIT
    );

    private final AssignmentRepository assignmentRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final StringRedisTemplate redisTemplate;

    @Autowired
    public AssignmentAcceptServiceImpl(
            AssignmentRepository assignmentRepository,
            DriverProfileRepository driverProfileRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.assignmentRepository = assignmentRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.redisTemplate = redisTemplate;
    }

    @Override
    @Transactional
    public AssignmentAcceptResponse acceptAssignment(UUID assignmentId, UUID driverId) {
        acquireLock(assignmentId);

        Assignment assignment = assignmentRepository.findByIdAndDriverId(assignmentId, driverId)
                .orElseThrow(() -> new AssignmentValidationException("Assignment not found for driver"));

        if (assignment.getStatus() == AssignmentStatus.ACCEPTED) {
            return toResponse(assignment, "Assignment already accepted");
        }

        if (assignment.getStatus() != AssignmentStatus.ASSIGNED) {
            throw new AssignmentValidationException("Assignment is not in assignable state: " + assignment.getStatus());
        }

        DriverProfile profile = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new AssignmentValidationException("Driver profile not found"));

        if (profile.getStructuralState() != DriverStructuralState.AVAILABLE) {
            throw new AssignmentValidationException(
                    "Driver must be AVAILABLE, current state: " + profile.getStructuralState());
        }

        long activeCount = assignmentRepository.countByDriverIdAndStatusIn(driverId, ACTIVE_STATUSES);
        if (activeCount >= profile.getCapacityCap()) {
            throw new AssignmentValidationException(
                    "Driver workload at capacity (" + activeCount + "/" + profile.getCapacityCap() + ")");
        }

        validateProximity(profile, assignment);

        OffsetDateTime acceptedAt = OffsetDateTime.now();
        assignment.setStatus(AssignmentStatus.ACCEPTED);
        assignment.setAcceptedAt(acceptedAt);

        Delivery delivery = assignment.getDelivery();
        delivery.setStatus(DeliveryStatus.ASSIGNED);

        profile.setStructuralState(DriverStructuralState.ON_DELIVERY);
        if (profile.getCurrentLat() == null) {
            profile.setCurrentLat(assignment.getPickupLat());
            profile.setCurrentLng(assignment.getPickupLng());
        }

        assignmentRepository.save(assignment);
        driverProfileRepository.save(profile);

        return toResponse(assignment, "Assignment accepted successfully");
    }

    private void acquireLock(UUID assignmentId) {
        String key = "lock:assignment:" + assignmentId;
        if (redisTemplate != null) {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, "LOCKED", LOCK_TTL);
            if (!Boolean.TRUE.equals(acquired)) {
                throw new AssignmentConflictException("Assignment is being processed by another driver");
            }
            return;
        }
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
                assignment.getAcceptedAt()
        );
    }
}
