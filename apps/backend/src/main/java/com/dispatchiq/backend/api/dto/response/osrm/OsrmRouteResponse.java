package com.dispatchiq.backend.api.dto.response.osrm;

import java.util.List;

public record OsrmRouteResponse(
    String code,
    List<OsrmRoute> routes
) {}
