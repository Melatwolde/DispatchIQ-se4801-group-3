package com.dispatchiq.backend.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AssignmentRequest(
    @Schema(description = "Public UUID of the order", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    @NotBlank(message = "orderId is required")
    @Pattern(regexp = "[0-9a-fA-F-]{36}", message = "orderId must be UUID")
    String orderId,

    @Schema(description = "Public UUID of the driver; omit to let the matching algorithm choose the best available driver")
    @Pattern(regexp = "[0-9a-fA-F-]{36}", message = "driverId must be UUID")
    String driverId,

    @Schema(description = "Assignment priority, higher is more urgent", example = "1")
    @NotNull(message = "priority is required")
    Integer priority,

    @Schema(description = "Optional notes for driver", example = "Leave at back door if not home")
    @Size(max = 500, message = "notes max length 500")
    String notes
) {}
