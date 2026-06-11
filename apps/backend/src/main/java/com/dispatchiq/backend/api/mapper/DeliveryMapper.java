package com.dispatchiq.backend.api.mapper;

import com.dispatchiq.backend.api.dto.DeliveryDto;
import com.dispatchiq.backend.entity.Delivery;
import com.dispatchiq.backend.entity.DeliveryPriority;
import com.dispatchiq.backend.entity.DeliveryStatus;
import java.time.ZoneId;

public class DeliveryMapper {

    /**
     * Converts a database Delivery entity into a safe, serializable DeliveryDto response
     */
    public static DeliveryDto toDto(Delivery delivery) {
        if (delivery == null) {
            return null;
        }

        // Default coordinate fallbacks if needed
        Double pickupLat = 0.0;
        Double pickupLong = 0.0;
        Double dropoffLat = 0.0;
        Double dropoffLong = 0.0;

        // Use system default or UTC timezone to convert OffsetDateTime to ZonedDateTime cleanly
        ZoneId zone = ZoneId.systemDefault();

        return new DeliveryDto(
            delivery.getId() != null ? delivery.getId().toString() : null,
            delivery.getStatus() != null ? delivery.getStatus() : DeliveryStatus.PENDING,
            delivery.getPickupAddress(),
            pickupLat,
            pickupLong,
            delivery.getDropoffAddress(),
            dropoffLat,
            dropoffLong,
            delivery.getRequestedPickupTime() != null ? delivery.getRequestedPickupTime().atZoneSameInstant(zone) : null,
            delivery.getDeadline() != null ? delivery.getDeadline().atZoneSameInstant(zone) : null,
            delivery.getPriority() != null ? delivery.getPriority() : DeliveryPriority.MEDIUM,
            delivery.getSpecialInstructions()
        );
    }

    /**
     * Helper method to attach an initialized ID back to a payload response
     */
    public static DeliveryDto withId(String id, DeliveryDto dto) {
        return new DeliveryDto(
            id,
            dto.status(),
            dto.pickupAddress(),
            dto.pickupLatitude(),
            dto.pickupLongitude(),
            dto.dropoffAddress(),
            dto.dropoffLatitude(),
            dto.dropoffLongitude(),
            dto.requestedPickupTime(),
            dto.deadline(),
            dto.priority(),
            dto.specialInstructions()
        );
    }
}