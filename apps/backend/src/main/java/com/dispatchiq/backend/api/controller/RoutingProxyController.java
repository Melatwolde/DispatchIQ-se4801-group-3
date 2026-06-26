package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.service.OsrmRoutingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routing")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "routing", description = "Proxy to local OSRM instance")
public class RoutingProxyController {

    private final OsrmRoutingService routingService;

    public RoutingProxyController(OsrmRoutingService routingService) {
        this.routingService = routingService;
    }

    @GetMapping(value = "/route", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getRoute(
            @RequestParam(required = false) String coordinates,
            @RequestParam(required = false) Double pickupLat,
            @RequestParam(required = false) Double pickupLng,
            @RequestParam(required = false) Double dropoffLat,
            @RequestParam(required = false) Double dropoffLng) {
        
        if (coordinates != null && !coordinates.isEmpty()) {
            return ResponseEntity.ok(routingService.getRouteByCoordinates(coordinates));
        }

        if (pickupLat != null && pickupLng != null && dropoffLat != null && dropoffLng != null) {
            String routeRawJson = routingService.getRouteRaw(pickupLat, pickupLng, dropoffLat, dropoffLng);
            return ResponseEntity.ok(routeRawJson);
        }

        return ResponseEntity.badRequest().body("{\"error\": \"Missing required parameters: 'coordinates' or 'pickupLat', 'pickupLng', 'dropoffLat', 'dropoffLng'\"}");
    }
}
