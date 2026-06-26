package com.dispatchiq.backend.dto.osrm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * POJO for OSRM `/table` endpoint (distance & duration matrices).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OSRMDistanceMatrixResponse {

    @JsonProperty("distances")
    private List<List<Double>> distances; // meters

    @JsonProperty("durations")
    private List<List<Double>> durations; // seconds

    public List<List<Double>> getDistances() {
        return distances;
    }

    public void setDistances(List<List<Double>> distances) {
        this.distances = distances;
    }

    public List<List<Double>> getDurations() {
        return durations;
    }

    public void setDurations(List<List<Double>> durations) {
        this.durations = durations;
    }
}
