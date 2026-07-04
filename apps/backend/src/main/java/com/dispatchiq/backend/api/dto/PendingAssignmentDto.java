package com.dispatchiq.backend.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.ZonedDateTime;
import java.util.UUID;

@Schema(description = "Pending assignment summary for dispatcher and driver workflows")
public record PendingAssignmentDto(
        UUID assignmentId,
        String status,
        String pickupAddress,
        String dropoffAddress,
        ZonedDateTime requestedPickupTime,
        String priority
) {
}
