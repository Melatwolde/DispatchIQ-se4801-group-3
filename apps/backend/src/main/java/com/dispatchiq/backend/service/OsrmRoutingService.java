package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.response.osrm.OsrmRouteResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.Locale;

@Service
public class OsrmRoutingService {

        private final RestClient restClient;

        public OsrmRoutingService(@Value("${spring.routing.osrm.url:http://localhost:5000}") String osrmUrl) {
                this.restClient = RestClient.builder()
                                .baseUrl(osrmUrl)
                                .build();
        }

        public String getRouteRaw(double pickupLat, double pickupLng, double dropoffLat, double dropoffLng) {

                String uri = String.format(Locale.US, "/route/v1/driving/%f,%f;%f,%f?overview=full",
                                pickupLng, pickupLat, dropoffLng, dropoffLat);

                return restClient.get()
                                .uri(uri)
                                .retrieve()
                                .body(String.class);
        }

        public OsrmRouteResponse getRouteParsed(double pickupLat, double pickupLng, double dropoffLat,
                        double dropoffLng) {
                String uri = String.format(Locale.US, "/route/v1/driving/%f,%f;%f,%f?overview=full",
                                pickupLng, pickupLat, dropoffLng, dropoffLat);

                return restClient.get()
                                .uri(uri)
                                .retrieve()
                                .body(OsrmRouteResponse.class);
        }

        public String getRouteByCoordinates(String coordinates) {
                String uri = String.format("/route/v1/driving/%s?overview=full", coordinates);

                return restClient.get()
                                .uri(uri)
                                .retrieve()
                                .body(String.class);
        }
}
