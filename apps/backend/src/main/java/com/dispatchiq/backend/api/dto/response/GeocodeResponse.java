package com.dispatchiq.backend.api.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GeocodeResponse {

    @JsonProperty("lat")
    private double lat;

    @JsonProperty("lng")
    private double lng;

    public GeocodeResponse(double lat, double lng) {
        this.lat = lat;
        this.lng = lng;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLng() {
        return lng;
    }

    public void setLng(double lng) {
        this.lng = lng;
    }
}
