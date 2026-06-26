package com.dispatchiq.backend.dto.photon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Minimal POJO hierarchy for the Photon geocoding response.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PhotonResponse {

    @JsonProperty("features")
    private List<Feature> features;

    public List<Feature> getFeatures() {
        return features;
    }

    public void setFeatures(List<Feature> features) {
        this.features = features;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Feature {

        @JsonProperty("geometry")
        private Geometry geometry;

        @JsonProperty("properties")
        private java.util.Map<String, Object> properties;

        public Geometry getGeometry() {
            return geometry;
        }

        public void setGeometry(Geometry geometry) {
            this.geometry = geometry;
        }

        public java.util.Map<String, Object> getProperties() {
            return properties;
        }

        public void setProperties(java.util.Map<String, Object> properties) {
            this.properties = properties;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Geometry {

        @JsonProperty("coordinates")
        private List<Double> coordinates; // [lng, lat]

        public List<Double> getCoordinates() {
            return coordinates;
        }

        public void setCoordinates(List<Double> coordinates) {
            this.coordinates = coordinates;
        }
    }
}
