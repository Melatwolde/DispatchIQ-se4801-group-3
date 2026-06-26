package com.dispatchiq.backend.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TelemetryPayload(
        @NotBlank
        String driverId,

        @NotNull
        Double lat,

        @NotNull
        Double lng,

        String assignmentId
) {}
