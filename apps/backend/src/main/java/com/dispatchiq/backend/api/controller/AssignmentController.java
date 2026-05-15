package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;
import com.dispatchiq.backend.idempotency.IdempotencyService;
import com.dispatchiq.backend.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignments")
@Validated
@Tag(name = "assignments", description = "Assignment operations (idempotent)")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final IdempotencyService idempotencyService;

    public AssignmentController(AssignmentService assignmentService, IdempotencyService idempotencyService) {
        this.assignmentService = assignmentService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    public ResponseEntity<?> createAssignment(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody AssignmentRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Idempotency-Key header is required");
        }
        boolean acquired = idempotencyService.acquire(idempotencyKey);
        if (!acquired) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Idempotency key already in use");
        }
        AssignmentResponse resp = assignmentService.assign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PutMapping("/{publicId}/reassign")
    public ResponseEntity<?> reassign(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @PathVariable("publicId") String publicId,
            @Valid @RequestBody AssignmentRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Idempotency-Key header is required");
        }
        boolean acquired = idempotencyService.acquire(idempotencyKey);
        if (!acquired) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Idempotency key already in use");
        }
        AssignmentResponse resp = assignmentService.reassign(publicId, request);
        return ResponseEntity.ok(resp);
    }
}
