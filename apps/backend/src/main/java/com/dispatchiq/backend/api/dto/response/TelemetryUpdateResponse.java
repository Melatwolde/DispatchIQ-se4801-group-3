package com.dispatchiq.backend.api.dto.response;

import java.time.OffsetDateTime;

public record TelemetryUpdateResponse(
        String type,
        String driverId,
        double lat,
        double lng,
        double remainingDistanceMeters,
        double remainingDurationSeconds,
        OffsetDateTime eta,
        String assignmentId
) {
    public static TelemetryUpdateResponse of(
            String driverId,
            double lat,
            double lng,
            double distance,
            double duration,
            String assignmentId
    ) {
        return new TelemetryUpdateResponse(
                "telemetry_update",
                driverId,
                lat,
                lng,
                distance,
                duration,
                OffsetDateTime.now().plusSeconds((long) duration),
                assignmentId
        );
    }
}
