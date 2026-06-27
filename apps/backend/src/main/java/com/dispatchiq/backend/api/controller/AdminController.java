package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.response.PendingDispatcherResponse;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.entity.Role;
import com.dispatchiq.backend.entity.Vehicle;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.repository.VehicleRepository;
import com.dispatchiq.backend.service.NotificationService; // IMPORTED NEW SERVICE
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final NotificationService notificationService; // ADDED FIELD

    public AdminController(UserRepository userRepository, 
                           VehicleRepository vehicleRepository, 
                           NotificationService notificationService) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.notificationService = notificationService;
    }

    // 1. Fetch all pending dispatchers packed cleanly into our DTO format
    @GetMapping("/pending-dispatchers")
    public ResponseEntity<List<PendingDispatcherResponse>> getPendingDispatchers() {
        log.info("Fetching all pending dispatcher registrations");
        
        List<User> pendingUsers = userRepository.findByRoleAndOnboardingStatus(Role.DISPATCHER, "PENDING");
        List<PendingDispatcherResponse> responseList = new ArrayList<>();
        
        for (User user : pendingUsers) {
            Vehicle vehicle = vehicleRepository.findByDriver(user).orElse(null);
            
            PendingDispatcherResponse dto = new PendingDispatcherResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                vehicle != null ? vehicle.getId() : null,
                vehicle != null ? vehicle.getLicensePlate() : null,
                vehicle != null ? vehicle.getVin() : null,
                vehicle != null ? vehicle.getCapacity() : null,
                vehicle != null ? vehicle.getCurrentLocation() : null
            );
            responseList.add(dto);
        }
        
        return ResponseEntity.ok(responseList);
    }

    // 2. Transact the approval steps and trigger real email/SMS alerts
    @Transactional
    @PutMapping("/dispatchers/{id}/approve")
    public ResponseEntity<?> approveDispatcher(@PathVariable UUID id) {
        log.info("Approving dispatcher with ID: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dispatcher not found"));
        
        user.setOnboardingStatus("APPROVED");
        userRepository.save(user);
        
        Vehicle vehicle = vehicleRepository.findByDriver(user).orElse(null);
        if (vehicle != null) {
            vehicle.setOnboardingStatus("APPROVED");
            vehicleRepository.save(vehicle);
        }
        
        // Construct clear, professional notification messages
        String plateInfo = vehicle != null ? "with vehicle plate [" + vehicle.getLicensePlate() + "]" : "";
        String subject = "DispatchIQ Account Approved!";
        String messageText = String.format(
            "Hello %s, your DispatchIQ Dispatcher account %s has been approved! You can now log into your dashboard.",
            user.getFullName() != null ? user.getFullName() : "Driver",
            plateInfo
        );

        // TRIGGER THE REAL EMAIL
        notificationService.sendEmail(user.getEmail(), subject, messageText);

        // TRIGGER THE REAL SMS DISPATCH
        notificationService.sendSMS(user.getPhone(), messageText);

        return ResponseEntity.ok(Map.of(
            "message", "Dispatcher and vehicle approved successfully",
            "emailStatus", "Sent to " + user.getEmail(),
            "smsStatus", "Dispatched"
        ));
    }
}