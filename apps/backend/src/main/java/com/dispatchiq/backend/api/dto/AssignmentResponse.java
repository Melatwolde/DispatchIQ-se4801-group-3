package com.dispatchiq.backend.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record AssignmentResponse(
    @Schema(description = "Public UUID of the assignment", example = "e7b1c6f2-3a8f-4a9a-9c5a-1d2f3e4b5c6d")
    @NotBlank
    String publicId,

    @Schema(example = "ASSIGNED")
    String status,

    @Schema(example = "Assigned to driver")
    String message
) {}
