package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.request.DistanceMatrixRequest;
import com.dispatchiq.backend.api.dto.response.GeocodeResult;
import com.dispatchiq.backend.dto.osrm.OSRMRouteResponse;
import com.dispatchiq.backend.dto.osrm.OSRMDistanceMatrixResponse;
import com.dispatchiq.backend.service.GeospatialRoutingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/api/geospatial")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "geospatial", description = "Geocoding, routing and distance‑matrix utilities")
public class GeospatialRoutingController {

    private final GeospatialRoutingService routingService;

    public GeospatialRoutingController(GeospatialRoutingService routingService) {
        this.routingService = routingService;
    }

    @GetMapping(value = "/geocode", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Geocode an address using the local Photon service", description = "Returns a list of potential matches with coordinates and descriptive names.", parameters = {
            @Parameter(name = "query", description = "Free‑form address or place name", required = true, in = ParameterIn.QUERY)
    }, responses = {
            @ApiResponse(responseCode = "200", description = "Successful geocode", content = @Content(mediaType = "application/json", schema = @Schema(implementation = GeocodeResult.class))),
            @ApiResponse(responseCode = "400", description = "No results found")
    })
    public ResponseEntity<java.util.List<GeocodeResult>> geocode(@RequestParam String query)
            throws IOException, InterruptedException {
        java.util.List<GeocodeResult> results = routingService.geocodeAddress(query);
        if (results.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(results);
    }

    @GetMapping(value = "/route", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Get a driving route between two points", description = "Wraps the OSRM `/route` endpoint and returns the first route object.", parameters = {
            @Parameter(name = "startLng", description = "Start longitude", required = true, in = ParameterIn.QUERY),
            @Parameter(name = "startLat", description = "Start latitude", required = true, in = ParameterIn.QUERY),
            @Parameter(name = "endLng", description = "End longitude", required = true, in = ParameterIn.QUERY),
            @Parameter(name = "endLat", description = "End latitude", required = true, in = ParameterIn.QUERY)
    }, responses = {
            @ApiResponse(responseCode = "200", description = "Route found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = OSRMRouteResponse.Route.class))),
            @ApiResponse(responseCode = "400", description = "Invalid parameters or OSRM error")
    })
    public ResponseEntity<OSRMRouteResponse.Route> getRoute(
            @RequestParam double startLng,
            @RequestParam double startLat,
            @RequestParam double endLng,
            @RequestParam double endLat) throws IOException, InterruptedException {

        Optional<OSRMRouteResponse.Route> opt = routingService.getRoute(startLng, startLat, endLng, endLat);
        return opt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.badRequest().build());
    }

    @PostMapping(value = "/distance-matrix", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Retrieve OSRM distance‑ and duration‑matrices", description = "Accepts a list of coordinates (order matters) and returns the OSRM matrix response.", responses = {
            @ApiResponse(responseCode = "200", description = "Matrix computed", content = @Content(mediaType = "application/json", schema = @Schema(implementation = OSRMDistanceMatrixResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<OSRMDistanceMatrixResponse> getDistanceMatrix(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "List of coordinates for the matrix extraction", required = true, content = @Content(schema = @Schema(implementation = DistanceMatrixRequest.class))) @RequestBody DistanceMatrixRequest request)
            throws IOException, InterruptedException {

        if (request == null || request.getCoordinates() == null || request.getCoordinates().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return routingService.getDistanceMatrix(request.getCoordinates())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.badRequest().build());
    }

}

    