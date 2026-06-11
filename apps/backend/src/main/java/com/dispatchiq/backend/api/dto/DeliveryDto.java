package com.dispatchiq.backend.api.dto;

import com.dispatchiq.backend.entity.DeliveryPriority;
import com.dispatchiq.backend.entity.DeliveryStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.ZonedDateTime;

@Schema(description = "Data Transfer Object for managing delivery order payloads")
public record DeliveryDto(
    @Schema(description = "Unique identifier of the delivery tracking record", example = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d")
    String id,

    @Schema(description = "Current processing status of the delivery", example = "PENDING")
    DeliveryStatus status,

    @Schema(description = "Full textual description of the source pickup location", example = "Bole Medhanialem, Building 4A, Addis Ababa")
    @NotBlank(message = "Pickup location address text is highly required")
    String pickupAddress,

    @Schema(description = "Calculated coordinate latitude for location mapping matching spatial standards", example = "9.0352")
    @NotNull(message = "Pickup latitude positioning point is required")
    Double pickupLatitude,

    @Schema(description = "Calculated coordinate longitude for location mapping matching spatial standards", example = "38.7818")
    @NotNull(message = "Pickup longitude positioning point is required")
    Double pickupLongitude,

    @Schema(description = "Full textual description of the target destination address", example = "4 Kilo, University Campus Gate 2, Addis Ababa")
    @NotBlank(message = "Dropoff destination location address text is highly required")
    String dropoffAddress,

    @Schema(description = "Calculated coordinate latitude for destination point tracking", example = "9.0435")
    @NotNull(message = "Dropoff latitude positioning point is required")
    Double dropoffLatitude,

    @Schema(description = "Calculated coordinate longitude for destination point tracking", example = "38.7615")
    @NotNull(message = "Dropoff longitude positioning point is required")
    Double dropoffLongitude,

    @Schema(description = "Target dispatch arrival timestamp window scheduled by the client", example = "2026-06-10T18:00:00Z")
    @NotNull(message = "Requested dispatch execution timestamp schedule cannot be blank")
    ZonedDateTime requestedPickupTime,

    @Schema(description = "Strict outer fulfillment completion constraint time tracker", example = "2026-06-10T20:00:00Z")
    @NotNull(message = "Fulfillment deadline constraint target timestamp tracking is required")
    ZonedDateTime deadline,

    @Schema(description = "Urgency categorization tier", example = "URGENT")
    @NotNull(message = "Fulfillment priority tier classification is required")
    DeliveryPriority priority,

    @Schema(description = "Optional structural tracking configurations or gate access passes for courier routing", example = "Call customer upon arrival at outer gate.")
    String specialInstructions
) {}