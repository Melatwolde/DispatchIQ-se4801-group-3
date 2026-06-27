package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.request.TelemetryPayload;
import com.dispatchiq.backend.api.dto.response.TelemetryUpdateResponse;
import com.dispatchiq.backend.api.dto.response.osrm.OsrmRouteResponse;
import com.dispatchiq.backend.entity.Assignment;
import com.dispatchiq.backend.entity.AssignmentStatus;
import com.dispatchiq.backend.repository.AssignmentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TelemetryProcessingService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryProcessingService.class);
    private static final List<AssignmentStatus> ROUTING_STATUSES = List.of(
            AssignmentStatus.ACCEPTED,
            AssignmentStatus.IN_TRANSIT
    );

    private final DriverLocationService driverLocationService;
    private final TelemetryBroadcastService broadcastService;
    private final OsrmRoutingService osrmRoutingService;
    private final AssignmentRepository assignmentRepository;
    private final ObjectMapper objectMapper;

    public TelemetryProcessingService(
            DriverLocationService driverLocationService,
            TelemetryBroadcastService broadcastService,
            OsrmRoutingService osrmRoutingService,
            AssignmentRepository assignmentRepository,
            ObjectMapper objectMapper
    ) {
        this.driverLocationService = driverLocationService;
        this.broadcastService = broadcastService;
        this.osrmRoutingService = osrmRoutingService;
        this.assignmentRepository = assignmentRepository;
        this.objectMapper = objectMapper;
    }

    public TelemetryUpdateResponse process(String rawPayload) {
        TelemetryPayload payload = parsePayload(rawPayload);
        driverLocationService.persistLocation(payload.driverId(), payload.lat(), payload.lng());

        Assignment assignment = resolveAssignment(payload);
        double dropoffLat = assignment.getDropoffLat();
        double dropoffLng = assignment.getDropoffLng();

        double remainingDistance = 0;
        double remainingDuration = 0;

        try {
            OsrmRouteResponse route = osrmRoutingService.getRouteParsed(
                    payload.lat(), payload.lng(), dropoffLat, dropoffLng);
            if (route.routes() != null && !route.routes().isEmpty()) {
                remainingDistance = route.routes().get(0).distance();
                remainingDuration = route.routes().get(0).duration();
            }
        } catch (Exception e) {
            log.warn("OSRM ETA recalculation failed for driver {}: {}", payload.driverId(), e.getMessage());
        }

        TelemetryUpdateResponse update = TelemetryUpdateResponse.of(
                payload.driverId(),
                payload.lat(),
                payload.lng(),
                remainingDistance,
                remainingDuration,
                assignment.getId().toString()
        );

        broadcastService.broadcast(update);
        return update;
    }

    private TelemetryPayload parsePayload(String raw) {
        try {
            return objectMapper.readValue(raw, TelemetryPayload.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid telemetry payload: " + e.getMessage());
        }
    }

    private Assignment resolveAssignment(TelemetryPayload payload) {
        if (payload.assignmentId() != null && !payload.assignmentId().isBlank()) {
            UUID assignmentId = UUID.fromString(payload.assignmentId());
            return assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
        }

        UUID driverId = UUID.fromString(payload.driverId());
        return assignmentRepository
                .findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(driverId, ROUTING_STATUSES)
                .orElseThrow(() -> new IllegalArgumentException("No active assignment for driver"));
    }
}
