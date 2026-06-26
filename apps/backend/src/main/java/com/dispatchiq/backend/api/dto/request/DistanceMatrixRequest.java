package com.dispatchiq.backend.api.dto.request;

import com.dispatchiq.backend.dto.Coordinate;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class DistanceMatrixRequest {

    @JsonProperty("coordinates")
    private List<Coordinate> coordinates;

    public DistanceMatrixRequest() { }

    public DistanceMatrixRequest(List<Coordinate> coordinates) {
        this.coordinates = coordinates;
    }

    public List<Coordinate> getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(List<Coordinate> coordinates) {
        this.coordinates = coordinates;
    }
}
