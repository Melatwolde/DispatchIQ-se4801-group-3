package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.AssignmentAcceptResponse;
import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.idempotency.IdempotencyService;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.repository.AssignmentRepository;
import com.dispatchiq.backend.entity.Assignment;
import com.dispatchiq.backend.entity.Role;
import com.dispatchiq.backend.service.AssignmentAcceptService;
import com.dispatchiq.backend.service.AssignmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assignments")
@Validated
@Tag(name = "assignments", description = "Assignment operations (idempotent)")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentAcceptService assignmentAcceptService;
    private final IdempotencyService idempotencyService;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;

    public AssignmentController(
            AssignmentService assignmentService,
            AssignmentAcceptService assignmentAcceptService,
            IdempotencyService idempotencyService,
            UserRepository userRepository,
            AssignmentRepository assignmentRepository
    ) {
        this.assignmentService = assignmentService;
        this.assignmentAcceptService = assignmentAcceptService;
        this.idempotencyService = idempotencyService;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @PostMapping
    public ResponseEntity<AssignmentResponse> createAssignment(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody AssignmentRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (!idempotencyService.acquire(idempotencyKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.assign(request));
    }

    @PutMapping("/{publicId}/reassign")
    public ResponseEntity<AssignmentResponse> reassign(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @PathVariable("publicId") String publicId,
            @Valid @RequestBody AssignmentRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (!idempotencyService.acquire(idempotencyKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(assignmentService.reassign(publicId, request));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<AssignmentAcceptResponse> acceptAssignment(@PathVariable("id") UUID id) {
        UUID driverId = resolveDriverIdForAcceptReject(id);
        System.out.println("Accept requested for assignmentId=" + id + " on behalf of driverId=" + driverId);
        AssignmentAcceptResponse response = assignmentAcceptService.acceptAssignment(id, driverId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<AssignmentResponse> rejectAssignment(@PathVariable("id") UUID id) {
        UUID driverId = resolveDriverIdForAcceptReject(id);
        System.out.println("Reject requested for assignmentId=" + id + " on behalf of driverId=" + driverId);
        AssignmentResponse response = assignmentService.reject(id, driverId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-pending")
    public ResponseEntity<java.util.List<com.dispatchiq.backend.api.dto.PendingAssignmentDto>> getMyPendingAssignments() {
        UUID driverId = resolveAuthenticatedDriverId();
        return ResponseEntity.ok(assignmentService.getPendingAssignments(driverId));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<java.util.List<com.dispatchiq.backend.api.dto.PendingAssignmentDto>> getDriverAssignments(@PathVariable("driverId") UUID driverId) {
        System.out.println("Fetching assignments for driverId=" + driverId);
        return ResponseEntity.ok(assignmentService.getPendingAssignments(driverId));
    }

    // --- ADD THIS ENDPOINT FOR DISPATCHER TO VIEW THE AUTOMATCHED LIST ---
    @GetMapping("/dispatcher-review")
    public ResponseEntity<java.util.List<com.dispatchiq.backend.api.dto.PendingAssignmentDto>> getDispatcherReviewQueue() {
        return ResponseEntity.ok(assignmentService.getAssignmentsForDispatcherApproval());
    }

    // --- ADD THIS ENDPOINT FOR DISPATCHER TO APPROVE AN AUTOMATCHED ITEM ---
    @PostMapping("/{id}/approve")
    public ResponseEntity<AssignmentResponse> approveAssignment(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(assignmentService.approveByDispatcher(id));
    }

    private UUID resolveDriverIdForAcceptReject(UUID assignmentId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails ud ? ud.getUsername() : principal.toString();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found"));
        System.out.println("resolveDriverIdForAcceptReject: user=" + user.getEmail() + ", role=" + user.getRole());
        if (user.getRole() == Role.DISPATCHER || user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER) {
            Assignment assignment = assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new com.dispatchiq.backend.api.exception.AssignmentValidationException("Assignment not found for dispatcher action"));
            return assignment.getDriver().getId();
        }
        return user.getId();
    }

    private UUID resolveAuthenticatedDriverId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails ud ? ud.getUsername() : principal.toString();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated driver not found"));
        return user.getId();
    }
}
