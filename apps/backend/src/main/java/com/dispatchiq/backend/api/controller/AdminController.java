package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.response.PendingDispatcherResponse;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.entity.Role;
import com.dispatchiq.backend.entity.Vehicle;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.repository.VehicleRepository;
import com.dispatchiq.backend.service.NotificationService;
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
    private final NotificationService notificationService;

    public AdminController(UserRepository userRepository, 
                           VehicleRepository vehicleRepository, 
                           NotificationService notificationService) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.notificationService = notificationService;
    }

    @GetMapping("/pending-dispatchers")
    public ResponseEntity<List<PendingDispatcherResponse>> getPendingDispatchers() {
        log.info("--- DEBUGGING START ---");
        
        // Log all users to see if we are even talking to the right database
        List<User> allUsers = userRepository.findAll();
        log.info("Total users found in database: {}", allUsers.size());
        for (User u : allUsers) {
            log.info("Found User: {} | Role: {} | OnboardingStatus: {}", 
                     u.getEmail(), u.getRole(), u.getOnboardingStatus());
        }

        // Execute the search
        List<User> pendingUsers = userRepository.findByRoleAndOnboardingStatus(Role.DISPATCHER, "PENDING_APPROVAL");
        log.info("Query returned {} matches", pendingUsers.size());
        log.info("--- DEBUGGING END ---");

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
        
        String plateInfo = vehicle != null ? "with vehicle plate [" + vehicle.getLicensePlate() + "]" : "";
        String subject = "DispatchIQ Account Approved!";
        String messageText = String.format(
            "Hello %s, your DispatchIQ Dispatcher account %s has been approved!",
            user.getFullName() != null ? user.getFullName() : "Driver",
            plateInfo
        );

        notificationService.sendEmail(user.getEmail(), subject, messageText);
        notificationService.sendSMS(user.getPhone(), messageText);

        return ResponseEntity.ok(Map.of(
            "message", "Dispatcher and vehicle approved successfully",
            "emailStatus", "Sent to " + user.getEmail(),
            "smsStatus", "Dispatched"
        ));
    }


    @GetMapping("/all-users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/all-dispatchers")
    public ResponseEntity<List<User>> getAllDispatchers() {
        return ResponseEntity.ok(userRepository.findByRole(Role.DISPATCHER));
    }
}
