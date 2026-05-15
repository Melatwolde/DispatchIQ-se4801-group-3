package com.dispatchiq.backend.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record DispatchDto(
    @Schema(description = "Public UUID of the dispatch", example = "a1b2c3d4-5717-4562-b3fc-2c963f66eee5")
    @NotBlank
    String publicId,

    @Schema(description = "Assignment public id", example = "e7b1c6f2-3a8f-4a9a-9c5a-1d2f3e4b5c6d")
    String assignmentId,

    @Schema(description = "ISO-8601 timestamp of dispatch", example = "2026-05-15T12:34:56Z")
    String dispatchedAt
) {}
