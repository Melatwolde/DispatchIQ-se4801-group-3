package com.dispatchiq.backend.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

public record AssignmentAcceptResponse(
        @Schema(description = "Assignment UUID")
        String assignmentId,

        @Schema(example = "ACCEPTED")
        String status,

        @Schema(example = "Assignment accepted successfully")
        String message,

        @Schema(description = "Linked delivery UUID")
        String deliveryId,

        @Schema(description = "Acceptance timestamp")
        OffsetDateTime acceptedAt
) {}
