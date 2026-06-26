package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;
import com.dispatchiq.backend.api.exception.AssignmentValidationException;
import com.dispatchiq.backend.entity.*;
import com.dispatchiq.backend.repository.AssignmentRepository;
import com.dispatchiq.backend.repository.DeliveryRepository;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.service.AssignmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InMemoryAssignmentService implements AssignmentService {

    private final Map<String, AssignmentResponse> store = new ConcurrentHashMap<>();
    private final AssignmentRepository assignmentRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;

    public InMemoryAssignmentService(
            AssignmentRepository assignmentRepository,
            DeliveryRepository deliveryRepository,
            UserRepository userRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public AssignmentResponse assign(AssignmentRequest request) {
        UUID deliveryId = UUID.fromString(request.orderId());
        UUID driverId = UUID.fromString(request.driverId());

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new AssignmentValidationException("Delivery not found"));
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new AssignmentValidationException("Driver not found"));

        if (driver.getRole() != Role.DRIVER) {
            throw new AssignmentValidationException("User is not a driver");
        }

        Assignment assignment = new Assignment();
        assignment.setDelivery(delivery);
        assignment.setDriver(driver);
        assignment.setStatus(AssignmentStatus.ASSIGNED);
        assignment.setPriority(request.priority());
        assignment.setNotes(request.notes());
        assignment.setPickupAddress(delivery.getPickupAddress());
        assignment.setDropoffAddress(delivery.getDropoffAddress());

        // Default coords when not parsed from geography column
        assignment.setPickupLat(9.0192);
        assignment.setPickupLng(38.7525);
        assignment.setDropoffLat(9.0300);
        assignment.setDropoffLng(38.7600);

        Assignment saved = assignmentRepository.save(assignment);
        delivery.setStatus(DeliveryStatus.ASSIGNED);

        AssignmentResponse resp = new AssignmentResponse(
                saved.getId().toString(), "ASSIGNED", "Assigned to driver");
        store.put(saved.getId().toString(), resp);
        return resp;
    }

    @Override
    public AssignmentResponse reassign(String publicId, AssignmentRequest request) {
        AssignmentResponse resp = new AssignmentResponse(publicId, "REASSIGNED", "Reassigned to new driver");
        store.put(publicId, resp);
        return resp;
    }

    @Override
    @Transactional
    public AssignmentResponse reject(UUID assignmentId, UUID driverId) {
        Assignment assignment = assignmentRepository.findByIdAndDriverId(assignmentId, driverId)
                .orElseThrow(() -> new AssignmentValidationException("Assignment not found for driver"));

        if (assignment.getStatus() != AssignmentStatus.ASSIGNED) {
            throw new AssignmentValidationException("Assignment cannot be rejected in state: " + assignment.getStatus());
        }

        assignment.setStatus(AssignmentStatus.REJECTED);
        assignmentRepository.save(assignment);

        return new AssignmentResponse(assignmentId.toString(), "REJECTED", "Assignment rejected by driver");
    }
}
