package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;
import com.dispatchiq.backend.api.exception.AssignmentValidationException;
import com.dispatchiq.backend.entity.*;
import com.dispatchiq.backend.repository.AssignmentRepository;
import com.dispatchiq.backend.repository.DeliveryRepository;
import com.dispatchiq.backend.repository.DriverProfileRepository;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.service.AssignmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class InMemoryAssignmentService implements AssignmentService {

        private static final List<AssignmentStatus> ACTIVE_STATUSES = List.of(
                        AssignmentStatus.ASSIGNED,
                        AssignmentStatus.ACCEPTED,
                        AssignmentStatus.IN_TRANSIT);

        private final AssignmentRepository assignmentRepository;
        private final DeliveryRepository deliveryRepository;
        private final DriverProfileRepository driverProfileRepository;
        private final UserRepository userRepository;

        public InMemoryAssignmentService(
                        AssignmentRepository assignmentRepository,
                        DeliveryRepository deliveryRepository,
                        DriverProfileRepository driverProfileRepository,
                        UserRepository userRepository) {
                this.assignmentRepository = assignmentRepository;
                this.deliveryRepository = deliveryRepository;
                this.driverProfileRepository = driverProfileRepository;
                this.userRepository = userRepository;
        }

        @Override
        @Transactional
        public AssignmentResponse reassign(String publicId, AssignmentRequest request) {
                UUID assignmentId = UUID.fromString(publicId);

                Assignment existing = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new AssignmentValidationException("Assignment not found"));

                if (existing.getStatus() == AssignmentStatus.COMPLETED) {
                        throw new AssignmentValidationException("Cannot reassign completed assignment");
                }

                User newDriver = resolveDriver(UUID.fromString(request.driverId()));

                existing.setDriver(newDriver);
                existing.setStatus(AssignmentStatus.ASSIGNED);
                existing.setNotes(request.notes() != null ? request.notes() : existing.getNotes());

                Assignment saved = assignmentRepository.save(existing);

                return new AssignmentResponse(
                                saved.getId().toString(),
                                "REASSIGNED",
                                "Assignment reassigned successfully.");
        }

        @Override
        @Transactional
        public AssignmentResponse reject(UUID assignmentId, UUID driverId) {
                System.out.println("Reject requested for assignmentId=" + assignmentId + ", driverId=" + driverId);
                Assignment assignment = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new AssignmentValidationException("Assignment not found"));

                if (!assignment.getDriver().getId().equals(driverId)) {
                        throw new AssignmentValidationException("Not authorized to reject this assignment");
                }

                assignment.setStatus(AssignmentStatus.REJECTED);
                assignmentRepository.save(assignment);

                // Optionally notify or create new assignment opportunity
                return new AssignmentResponse(
                                assignment.getId().toString(),
                                "REJECTED",
                                "Assignment rejected successfully.");
        }

        @Override
        @Transactional
        public AssignmentResponse assign(AssignmentRequest request) {
                UUID deliveryId = UUID.fromString(request.orderId());
                System.out.println("Assignment create requested for deliveryId=" + deliveryId
                                + ", requestedDriverId=" + request.driverId());

                Delivery delivery = deliveryRepository.findById(deliveryId)
                                .orElseThrow(() -> new AssignmentValidationException("Delivery not found"));
                ensureDeliveryCoordinates(delivery);

                List<Assignment> existingActiveAssignments = assignmentRepository.findByDeliveryIdAndStatusIn(
                                deliveryId,
                                List.of(AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED,
                                                AssignmentStatus.IN_TRANSIT));
                if (!existingActiveAssignments.isEmpty()) {
                        Assignment existing = existingActiveAssignments.get(0);
                        System.out.println("Delivery already has active assignment. deliveryId=" + deliveryId
                                        + ", assignmentId=" + existing.getId()
                                        + ", status=" + existing.getStatus());
                        return new AssignmentResponse(
                                        existing.getId().toString(),
                                        existing.getStatus().name(),
                                        "Delivery already has an active assignment.");
                }

                User driver = request.driverId() != null && !request.driverId().isBlank()
                                ? resolveDriver(UUID.fromString(request.driverId()))
                                : selectBestAvailableDriver(delivery, request.priority());

                System.out.println("Selected driver for assignment. deliveryId=" + deliveryId + ", driverId="
                                + driver.getId());
                Assignment assignment = buildAssignment(request, delivery, driver);
                Assignment saved = assignmentRepository.save(assignment);
                System.out.println("Assignment created with ID: " + saved.getId()
                                + ", deliveryId=" + delivery.getId()
                                + ", driverId=" + driver.getId()
                                + ", status=" + saved.getStatus());

                deliveryRepository.updateStatusById(delivery.getId(), DeliveryStatus.ASSIGNED);

                System.out.println("Assignment creation success. deliveryId=" + delivery.getId()
                                + ", driverId=" + driver.getId() + ", assignmentId=" + saved.getId());

                return new AssignmentResponse(saved.getId().toString(), "ASSIGNED",
                                "Automatically matched and approved by dispatcher.");
        }

        // New Method 1: Fetch all automatically suggested assignments waiting for
        // dispatcher review
        @Override
        @Transactional(readOnly = true)
        public List<com.dispatchiq.backend.api.dto.PendingAssignmentDto> getAssignmentsForDispatcherApproval() {
                // Return assignments that are currently assigned and waiting for dispatcher review.
                List<Assignment> assignments = assignmentRepository
                                .findByStatusOrderByCreatedAtDesc(AssignmentStatus.ASSIGNED);

                return assignments.stream()
                                .map(a -> new com.dispatchiq.backend.api.dto.PendingAssignmentDto(
                                                a.getId(),
                                                a.getStatus().name(),
                                                a.getPickupAddress(),
                                                a.getDropoffAddress(),
                                                a.getDelivery() != null
                                                                && a.getDelivery().getRequestedPickupTime() != null
                                                                                ? a.getDelivery()
                                                                                                .getRequestedPickupTime()
                                                                                                .toZonedDateTime()
                                                                                : null,
                                                String.valueOf(a.getPriority())))
                                .toList();
        }

        @Override
        @Transactional
        public AssignmentResponse approveByDispatcher(UUID assignmentId) {
                System.out.println("Dispatcher approval requested for assignmentId=" + assignmentId);
                Assignment assignment = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new AssignmentValidationException("Assignment entry not found"));

                Delivery delivery = assignment.getDelivery();

                if (assignment.getStatus() != AssignmentStatus.ASSIGNED) {
                        System.out.println(
                                        "Dispatcher approval skipped because assignment is not ASSIGNED. assignmentId="
                                                        + assignmentId + ", status=" + assignment.getStatus());
                        return new AssignmentResponse(
                                        assignment.getId().toString(),
                                        assignment.getStatus().name(),
                                        "Assignment is already " + assignment.getStatus().name() + ".");
                }

                deliveryRepository.updateStatusById(delivery.getId(), DeliveryStatus.ASSIGNED);

                Assignment saved = assignmentRepository.save(assignment);
                System.out.println("Dispatcher approved assignment. assignmentId=" + saved.getId()
                                + ", deliveryId=" + delivery.getId()
                                + ", driverId=" + saved.getDriver().getId()
                                + ", assignmentStatus=" + saved.getStatus()
                                + ", deliveryStatus=" + delivery.getStatus());

                return new AssignmentResponse(assignment.getId().toString(), "ASSIGNED",
                                "Approved by dispatcher. Sent to driver.");
        }

        private Assignment buildAssignment(AssignmentRequest request, Delivery delivery, User driver) {
                System.out.println("Building assignment for deliveryId=" + delivery.getId()
                                + ", driverId=" + driver.getId()
                                + ", priority=" + request.priority());
                Assignment assignment = new Assignment();
                assignment.setDelivery(delivery);
                assignment.setDriver(driver);
                assignment.setStatus(AssignmentStatus.ASSIGNED);
                assignment.setPriority(request.priority());
                assignment.setNotes(request.notes());
                assignment.setPickupAddress(delivery.getPickupAddress());
                assignment.setDropoffAddress(delivery.getDropoffAddress());
                assignment.setPickupLat(delivery.getPickupLatitude());
                assignment.setPickupLng(delivery.getPickupLongitude());
                assignment.setDropoffLat(delivery.getDropoffLatitude());
                assignment.setDropoffLng(delivery.getDropoffLongitude());
                return assignment;
        }

        private User resolveDriver(UUID driverId) {
                User driver = userRepository.findById(driverId)
                                .orElseThrow(() -> new AssignmentValidationException("Driver not found"));
                // Allow assigning to either DRIVER or DISPATCHER (dispatchers can accept assignments)
                if (driver.getRole() != Role.DRIVER && driver.getRole() != Role.DISPATCHER) {
                        throw new AssignmentValidationException("User is not a driver or dispatcher");
                }
                return driver;
        }

        private User selectBestAvailableDriver(Delivery delivery, Integer priority) {
                                try {
                                        List<User> drivers = userRepository.findByRoleAndOnboardingStatus(Role.DRIVER, "APPROVED");
                                        return drivers.stream()
                                .map(driver -> {
                                        var profileOpt = driverProfileRepository.findByUserId(driver.getId());
                                        if (profileOpt.isEmpty()) {
                                                return null;
                                        }
                                        DriverProfile profile = profileOpt.get();
                                        if (profile.getStructuralState() != DriverStructuralState.AVAILABLE) {
                                                return null;
                                        }
                                        long activeCount = assignmentRepository
                                                        .countByDriverIdAndStatusIn(driver.getId(), ACTIVE_STATUSES);
                                        if (activeCount >= profile.getCapacityCap()) {
                                                return null;
                                        }

                                        double workloadFactor = (double) activeCount
                                                        / Math.max(profile.getCapacityCap(), 1);
                                        double priorityBonus = (3
                                                        - Math.max(1, Math.min(priority == null ? 1 : priority, 3)))
                                                        * 250.0;
                                        double score = (workloadFactor * 10_000) + priorityBonus;
                                        System.out.println(
                                                        "Auto-match candidate accepted without proximity gate. driverId="
                                                                        + driver.getId() + ", activeCount="
                                                                        + activeCount + ", score=" + score);
                                        return new DriverCandidate(driver, profile, score);
                                })
                                .filter(candidate -> candidate != null)
                                .min(Comparator.comparingDouble(DriverCandidate::score))
                                                                .orElseThrow(() -> new AssignmentValidationException(
                                                                                                "No available drivers found matching the request"))
                                                                .driver();
                                } catch (AssignmentValidationException ex) {
                                        // Relaxed fallback: first try any DRIVER users
                                        List<User> anyDrivers = userRepository.findByRole(Role.DRIVER);
                                        if (anyDrivers != null && !anyDrivers.isEmpty()) {
                                                User fallback = anyDrivers.get(0);
                                                System.out.println("Fallback assignment: no matched drivers, assigning first driverId=" + fallback.getId());
                                                return fallback;
                                        }

                                        // If no drivers exist, allow assigning to a DISPATCHER (approved)
                                        List<User> approvDispatchers = userRepository.findByRoleAndOnboardingStatus(Role.DISPATCHER, "APPROVED");
                                        if (approvDispatchers != null && !approvDispatchers.isEmpty()) {
                                                User fallback = approvDispatchers.get(0);
                                                System.out.println("Fallback assignment: no drivers, assigning dispatcherId=" + fallback.getId());
                                                return fallback;
                                        }

                                        // Nothing to fall back to; rethrow original
                                        throw ex;
                                }
        }
        private void ensureDeliveryCoordinates(Delivery delivery) {
        System.out.println("ensureDeliveryCoordinates for deliveryId=" + delivery.getId());
        
        // Extract coordinates natively from JTS Point if @Transient lat/lng are not yet set
        if ((delivery.getPickupLatitude() == null || delivery.getPickupLatitude() == 0.0)
                && delivery.getPickupCoords() != null && !delivery.getPickupCoords().isEmpty()) {
                delivery.setPickupLongitude(delivery.getPickupCoords().getX());
                delivery.setPickupLatitude(delivery.getPickupCoords().getY());
                System.out.println("Extracted pickup coords: lng=" + delivery.getPickupLongitude() + ", lat=" + delivery.getPickupLatitude());
        }
        if ((delivery.getDropoffLatitude() == null || delivery.getDropoffLatitude() == 0.0)
                && delivery.getDropoffCoords() != null && !delivery.getDropoffCoords().isEmpty()) {
                delivery.setDropoffLongitude(delivery.getDropoffCoords().getX());
                delivery.setDropoffLatitude(delivery.getDropoffCoords().getY());
                System.out.println("Extracted dropoff coords: lng=" + delivery.getDropoffLongitude() + ", lat=" + delivery.getDropoffLatitude());
        }
        
        // Fallback to native queries if WKT/Point fields are null or empty
        if (delivery.getPickupLatitude() == null || delivery.getPickupLatitude() == 0.0) {
                Double lat = deliveryRepository.findPickupLatitudeById(delivery.getId());
                delivery.setPickupLatitude(lat != null ? lat : 0.0);
        }
        if (delivery.getPickupLongitude() == null || delivery.getPickupLongitude() == 0.0) {
                Double lng = deliveryRepository.findPickupLongitudeById(delivery.getId());
                delivery.setPickupLongitude(lng != null ? lng : 0.0);
        }
        if (delivery.getDropoffLatitude() == null || delivery.getDropoffLatitude() == 0.0) {
                Double lat = deliveryRepository.findDropoffLatitudeById(delivery.getId());
                delivery.setDropoffLatitude(lat != null ? lat : 0.0);
        }
        if (delivery.getDropoffLongitude() == null || delivery.getDropoffLongitude() == 0.0) {
                Double lng = deliveryRepository.findDropoffLongitudeById(delivery.getId());
                delivery.setDropoffLongitude(lng != null ? lng : 0.0);
        }
}


        /** Parse a WKT POINT string like "POINT(lng lat)" and return {lng, lat}. */
        private double[] parseWktPoint(String wkt) {
                // Expected format: "POINT(lng lat)" or "POINT (lng lat)"
                String inner = wkt.replaceAll("(?i)^POINT\\s*\\(", "").replaceAll("\\)$", "").trim();
                String[] parts = inner.split("\\s+");
                return new double[]{Double.parseDouble(parts[0]), Double.parseDouble(parts[1])};
        }

        @Override
        @Transactional(readOnly = true)
        public List<com.dispatchiq.backend.api.dto.PendingAssignmentDto> getPendingAssignments(UUID driverId) {
                System.out.println("getPendingAssignments: driverId=" + driverId);
                List<Assignment> assignments = assignmentRepository.findByDriverIdAndStatusInOrderByCreatedAtDesc(
                                driverId, List.of(AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED,
                                                AssignmentStatus.IN_TRANSIT));
                return assignments.stream()
                                .map(a -> new com.dispatchiq.backend.api.dto.PendingAssignmentDto(
                                                a.getId(),
                                                a.getStatus().name(),
                                                a.getPickupAddress(),
                                                a.getDropoffAddress(),
                                                a.getDelivery() != null
                                                                && a.getDelivery().getRequestedPickupTime() != null
                                                                                ? a.getDelivery()
                                                                                                .getRequestedPickupTime()
                                                                                                .toZonedDateTime()
                                                                                : null,
                                                String.valueOf(a.getPriority())))
                                .toList();
        }

        private double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
                final double R = 6371000.0;
                double dLat = Math.toRadians(lat2 - lat1);
                double dLng = Math.toRadians(lng2 - lng1);
                double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                                                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
                return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        private static final class DriverCandidate {
                private final User driver;
                private final DriverProfile profile;
                private final double score;

                private DriverCandidate(User driver, DriverProfile profile, double score) {
                        this.driver = driver;
                        this.profile = profile;
                        this.score = score;
                }

                public User driver() {
                        return driver;
                }

                public double score() {
                        return score;
                }
        }
}
