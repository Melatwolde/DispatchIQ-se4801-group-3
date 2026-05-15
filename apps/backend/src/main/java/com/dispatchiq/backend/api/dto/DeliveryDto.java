package com.dispatchiq.backend.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record DeliveryDto(
    @Schema(description = "Public UUID of delivery", example = "d4b1c2f3-5717-4562-b3fc-2c963f66ccc3")
    @NotBlank
    @Pattern(regexp = "[0-9a-fA-F-]{36}")
    String publicId,

    @Schema(example = "PENDING")
    String status,

    @Schema(example = "123 Main St, Springfield")
    String address
) {}
