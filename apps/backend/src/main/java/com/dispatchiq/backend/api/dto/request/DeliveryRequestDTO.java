package com.dispatchiq.backend.api.dto.request;

import com.dispatchiq.backend.entity.DeliveryStatus;
import com.dispatchiq.backend.entity.DeliveryUrgency;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Inbound delivery creation payload")
public record DeliveryRequestDTO(
        @Schema(description = "Processing status; defaults to PENDING when omitted", example = "PENDING")
        DeliveryStatus status,

        @NotBlank(message = "pickupAddress is required")
        @Schema(example = "Bole Medhanialem, Addis Ababa")
        String pickupAddress,

        @NotNull(message = "pickupLatitude is required")
        @Schema(example = "9.0352")
        Double pickupLatitude,

        @NotNull(message = "pickupLongitude is required")
        @Schema(example = "38.7818")
        Double pickupLongitude,

        @NotBlank(message = "dropoffAddress is required")
        @Schema(example = "4 Kilo, Addis Ababa")
        String dropoffAddress,

        @NotNull(message = "dropoffLatitude is required")
        @Schema(example = "9.0435")
        Double dropoffLatitude,

        @NotNull(message = "dropoffLongitude is required")
        @Schema(example = "38.7615")
        Double dropoffLongitude,

        @NotNull(message = "urgency is required")
        @Schema(example = "LOW", allowableValues = {"LOW", "NORMAL", "URGENT", "CRITICAL"})
        DeliveryUrgency urgency,

        @Schema(example = "Call upon arrival at gate")
        String notes
) {}
