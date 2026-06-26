package com.dispatchiq.backend.api.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Enhanced geocoding result that carries both coordinates and descriptive text
 * for UI suggestion dropdowns.
 */
public record GeocodeResult(
    @JsonProperty("name") String name,
    @JsonProperty("displayName") String displayName,
    @JsonProperty("lat") double lat,
    @JsonProperty("lng") double lng
) {}
