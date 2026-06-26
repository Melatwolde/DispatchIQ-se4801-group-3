package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.AssignmentAcceptResponse;
import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.idempotency.IdempotencyService;
import com.dispatchiq.backend.repository.UserRepository;
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

    public AssignmentController(
            AssignmentService assignmentService,
            AssignmentAcceptService assignmentAcceptService,
            IdempotencyService idempotencyService,
            UserRepository userRepository
    ) {
        this.assignmentService = assignmentService;
        this.assignmentAcceptService = assignmentAcceptService;
        this.idempotencyService = idempotencyService;
        this.userRepository = userRepository;
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
        UUID driverId = resolveAuthenticatedDriverId();
        AssignmentAcceptResponse response = assignmentAcceptService.acceptAssignment(id, driverId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<AssignmentResponse> rejectAssignment(@PathVariable("id") UUID id) {
        UUID driverId = resolveAuthenticatedDriverId();
        AssignmentResponse response = assignmentService.reject(id, driverId);
        return ResponseEntity.ok(response);
    }

    private UUID resolveAuthenticatedDriverId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails ud ? ud.getUsername() : principal.toString();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated driver not found"));
        return user.getId();
    }
}
