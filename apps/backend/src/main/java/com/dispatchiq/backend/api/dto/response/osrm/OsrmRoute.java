package com.dispatchiq.backend.api.dto.response.osrm;

public record OsrmRoute(
    String geometry,
    double distance,
    double duration
) {}
