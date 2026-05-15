package com.dispatchiq.backend.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record FleetDto(
    @Schema(description = "Public fleet UUID", example = "f1a2b3c4-5717-4562-b3fc-2c963f66ddd4")
    @NotBlank
    String publicId,

    @Schema(example = "East Coast Fleet")
    String name,

    @Schema(example = "us-east-1")
    String region
) {}
