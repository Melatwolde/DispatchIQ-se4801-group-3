package com.dispatchiq.backend.dto.osrm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * POJO for OSRM `/route` endpoint (only the fields we need).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OSRMRouteResponse {

    @JsonProperty("routes")
    private List<Route> routes;

    public List<Route> getRoutes() {
        return routes;
    }

    public void setRoutes(List<Route> routes) {
        this.routes = routes;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Route {

        @JsonProperty("duration")
        private double duration; // seconds

        @JsonProperty("distance")
        private double distance; // meters

        @JsonProperty("geometry")
        private Geometry geometry;

        public double getDuration() {
            return duration;
        }

        public void setDuration(double duration) {
            this.duration = duration;
        }

        public double getDistance() {
            return distance;
        }

        public void setDistance(double distance) {
            this.distance = distance;
        }

        public Geometry getGeometry() {
            return geometry;
        }

        public void setGeometry(Geometry geometry) {
            this.geometry = geometry;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Geometry {

        @JsonProperty("coordinates")
        private List<List<Double>> coordinates; // [[lng, lat], ...]

        public List<List<Double>> getCoordinates() {
            return coordinates;
        }

        public void setCoordinates(List<List<Double>> coordinates) {
            this.coordinates = coordinates;
        }
    }
}
