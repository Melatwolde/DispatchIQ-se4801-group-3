package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.response.GeocodeResult;
import com.dispatchiq.backend.dto.photon.PhotonResponse;
import com.dispatchiq.backend.dto.osrm.OSRMRouteResponse;
import com.dispatchiq.backend.dto.osrm.OSRMDistanceMatrixResponse;
import com.dispatchiq.backend.dto.Coordinate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Service that talks to the local Photon (geocoding) and OSRM (routing / distance‑matrix) containers.
 *
 * All URLs use {@code host.docker.internal} so the Spring Boot container can reach the other containers
 * on the host network.
 */
@Service
public class GeospatialRoutingService {

    private static final String PHOTON_BASE_URL = "http://host.docker.internal:2322/api";
    private static final String OSRM_BASE_URL   = "http://host.docker.internal:5001";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeospatialRoutingService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        this.objectMapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Geocode a free‑form address using Photon, returning a list of potential matches.
     *
     * @param query the address or place name to look up
     * @return a list of {@link GeocodeResult} suggestions
     */
    public List<GeocodeResult> geocodeAddress(String query) throws IOException, InterruptedException {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = PHOTON_BASE_URL + "?q=" + encodedQuery + "&limit=10";
        HttpRequest request = HttpRequest.newBuilder()
                .GET()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            return List.of();
        }

        PhotonResponse photonResponse = objectMapper.readValue(response.body(), PhotonResponse.class);
        if (photonResponse.getFeatures() == null || photonResponse.getFeatures().isEmpty()) {
            return List.of();
        }

        return photonResponse.getFeatures().stream()
                .map(feature -> {
                    double lng = feature.getGeometry().getCoordinates().get(0);
                    double lat = feature.getGeometry().getCoordinates().get(1);
                    String name = feature.getProperties().get("name") != null ? feature.getProperties().get("name").toString() : "Unknown";
                    
                    // Construct a display name from available properties
                    StringBuilder displayName = new StringBuilder(name);
                    Object city = feature.getProperties().get("city");
                    Object street = feature.getProperties().get("street");
                    if (street != null) displayName.append(", ").append(street);
                    if (city != null) displayName.append(", ").append(city);

                    return new GeocodeResult(name, displayName.toString(), lat, lng);
                })
                .toList();
    }

    /**
     * Get a driving route between two points using OSRM, including turn-by-turn steps.
     *
     * @param startLng start longitude
     * @param startLat start latitude
     * @param endLng   end longitude
     * @param endLat   end latitude
     * @return the OSRM route response (first route only)
     */
    public Optional<OSRMRouteResponse.Route> getRoute(double startLng,
                                                       double startLat,
                                                       double endLng,
                                                       double endLat) throws IOException, InterruptedException {
        String coordinates = String.format("%f,%f;%f,%f", startLng, startLat, endLng, endLat);
        // Added steps=true to enable turn-by-turn logic in frontend
        String url = OSRM_BASE_URL + "/route/v1/driving/" + coordinates + "?overview=full&geometries=geojson&steps=true";

        HttpRequest request = HttpRequest.newBuilder()
                .GET()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            return Optional.empty();
        }

        OSRMRouteResponse routeResponse = objectMapper.readValue(response.body(), OSRMRouteResponse.class);
        if (routeResponse.getRoutes() == null || routeResponse.getRoutes().isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(routeResponse.getRoutes().get(0));
    }

    /**
     * Retrieve distance‑ and duration‑matrices for a list of coordinates using OSRM.
     *
     * @param coordinates list of coordinates (order matters)
     * @return the matrix response containing distance and duration arrays
     */
    public Optional<OSRMDistanceMatrixResponse> getDistanceMatrix(List<Coordinate> coordinates)
            throws IOException, InterruptedException {

        if (coordinates == null || coordinates.isEmpty()) {
            return Optional.empty();
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < coordinates.size(); i++) {
            Coordinate c = coordinates.get(i);
            sb.append(c.lng()).append(',').append(c.lat());
            if (i < coordinates.size() - 1) {
                sb.append(';');
            }
        }

        String url = OSRM_BASE_URL + "/table/v1/driving/" + sb + "?annotations=distance,duration";

        HttpRequest request = HttpRequest.newBuilder()
                .GET()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            return Optional.empty();
        }

        OSRMDistanceMatrixResponse matrixResponse = objectMapper.readValue(response.body(), OSRMDistanceMatrixResponse.class);
        return Optional.of(matrixResponse);
    }
}
